const WebSocket = require("ws");
const rtp = require("../rtp-udp-server");

const fs = require("fs");
const https = require("https");
const http = require("http");
const { Transform } = require("stream");
const provider = require("../tools/google-speech-provider");
const EventEmitter = require("events");
const net = require("net");

interface AriTranscriberOptions {
  sslCert?: string;
  sslKey?: string;
  wssPort: number;
  format: "ulaw" | "slin16";
  speechLang: string;
  speechModel: string;
  speakerDiarization: boolean;
  listenServer: string;
  audioOutput?: string;
  audioServer: any;
}

class AriTranscriber extends EventEmitter {
  private opts: AriTranscriberOptions;
  private webServer?: http.Server;
  private wssServer?: WebSocket.Server;
  private speechProvider?: GoogleSpeechProvider;
  private audioServer?: any;

  constructor(opts: AriTranscriberOptions) {
    this.opts = opts;
    // Run it.
    this.transcriber();
  }

  // The WebSocket server serves up the transcription.
  private startWebsocketServer(): void {
    this.webServer = this.opts.sslCert
      ? https.createServer({
          cert: fs.readFileSync(this.opts.sslCert),
          key: fs.readFileSync(this.opts.sslKey!),
        })
      : http.createServer();

    this.wssServer = new WebSocket.Server({ server: this.webServer });
    this.wssServer.on("connection", (ws, req) => {
      console.log("Connection from: ", req.connection.remoteAddress);

      ws.on("message", (message) => {
        console.log("Received WebSocket message:", message); // Log the received WebSocket message
      });

      // Example of sending a message to the WebSocket client
      ws.send("Hello, WebSocket client!"); // Log the sent WebSocket message
    });

    this.webServer.listen(this.opts.wssPort);
  }

  private async stopAudioServer(): Promise<void> {
    if (this.audioServer) {
      await this.audioServer.close();
      this.audioServer = null;
      console.log("Audio server stopped");
    }
  }

  /*
   * The transcriptCallback simply passes any text received from the
   * speech provider to any client connected to the WebSocket server.
   */
  private transcriptCallback(text: string, isFinal: boolean): void {
    if (isFinal && this.wssServer) {
      console.log("Received transcription:", text);
      this.wssServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(text);
        }
      });
    }
  }

  /*
   * The resultsCallback is just an example of how Google identifies
   * speakers if you have speakerDiarization enabled. We don't do
   * anything with this other than display the raw results on the console.
   */
  private resultsCallback(results: SpeechResults[]): void {
    if (results[0].isFinal) {
      const transcription = results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      console.log(`Transcription: ${transcription}`);
      const wordsInfo = results[0].alternatives[0].words;
      wordsInfo.forEach((a) =>
        console.log(` word: ${a.word}, speakerTag: ${a.speakerTag}`)
      );
    }
  }

  // The main wrapper
  private async transcriber(): Promise<void> {
    let speechEncoding: string;
    let speechRate: number;
    let swap16 = false;

    switch (this.opts.format) {
      case "ulaw":
        speechEncoding = "MULAW";
        speechRate = 8000;
        break;
      case "slin16":
        speechEncoding = "LINEAR16";
        speechRate = 16000;
        swap16 = true;
        break;
      default:
        console.error(`Unknown format ${this.opts.format}`);
        return;
    }

    // Start the server that receives audio from Asterisk.
    console.log(`Starting audio listener on ${this.opts.listenServer}`);
    this.audioServer = new rtp.RtpUdpServerSocket(
      this.opts.listenServer,
      swap16,
      this.opts.audioOutput || false
    );

    this.audioServer.on("packet", (packet) => {
      console.log("Received RTP packet:", packet); // Log the received RTP packet
    });

    console.log("Starting speech provider");
    let config = {
      encoding: speechEncoding,
      sampleRateHertz: speechRate,
      languageCode: this.opts.speechLang,
      audioChannelCount: 1,
      model: this.opts.speechModel,
      useEnhanced: true,
      profanityFilter: false,
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      metadata: {
        interactionType: "DISCUSSION",
        microphoneDistance: "MIDFIELD",
        originalMediaType: "AUDIO",
        recordingDeviceName: "ConferenceCall",
      },
    };
    if (this.opts.speakerDiarization) {
      config.enableSpeakerDiarization = true;
      config.diarizationSpeakerCount = 5;
    }

    // Start the speech provider passing in the audio server socket.
    this.speechProvider = new provider.GoogleSpeechProvider(
      config,
      this.audioServer,
      (text, isFinal) => {
        this.transcriptCallback(text, isFinal);
      },
      (results) => {
        if (this.opts.speakerDiarization) {
          this.resultsCallback(results);
        }
      }
    );

    console.log("speechProvider started");

    // If wssPort was specified, start the WebSocket server.
    if (this.opts.wssPort > 0) {
      console.log(
        `Starting ${
          this.opts.sslCert ? "secure " : ""
        }transcription websocket server on port ${this.opts.wssPort}`
      );
      this.startWebsocketServer();
    }

    console.log("Processing");
  }
}

// // Specify the options for the transcriber
// const options: AriTranscriberOptions = {
//   sslCert: "", //path/to/ssl/certificate.crt
//   sslKey: "path/to/ssl/private/key.key",
//   wssPort: 3044,
//   format: "ulaw",
//   speechLang: "en-US",
//   speechModel: "default",
//   speakerDiarization: false,
//   listenServer: "0.0.0.0:8000",
//   audioOutput: "audio.raw",
// };

// // Create an instance of AriTranscriber with the provided options
// const transcriber = new AriTranscriber(options);

module.exports.AriTranscriber = AriTranscriber;
