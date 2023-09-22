"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var WebSocket = require("ws");
var rtp = require("../rtp-udp-server");
var fs = require("fs");
var https = require("https");
var http = require("http");
var Transform = require("stream").Transform;
var provider = require("../tools/google-speech-provider");
var EventEmitter = require("events");
var net = require("net");
var AriTranscriber = /** @class */ (function (_super) {
    __extends(AriTranscriber, _super);
    function AriTranscriber(opts) {
        var _this = this;
        _this.opts = opts;
        // Run it.
        _this.transcriber();
        return _this;
    }
    // The WebSocket server serves up the transcription.
    AriTranscriber.prototype.startWebsocketServer = function () {
        this.webServer = this.opts.sslCert
            ? https.createServer({
                cert: fs.readFileSync(this.opts.sslCert),
                key: fs.readFileSync(this.opts.sslKey),
            })
            : http.createServer();
        this.wssServer = new WebSocket.Server({ server: this.webServer });
        this.wssServer.on("connection", function (ws, req) {
            console.log("Connection from: ", req.connection.remoteAddress);
            ws.on("message", function (message) {
                console.log("Received WebSocket message:", message); // Log the received WebSocket message
            });
            // Example of sending a message to the WebSocket client
            ws.send("Hello, WebSocket client!"); // Log the sent WebSocket message
        });
        this.webServer.listen(this.opts.wssPort);
    };
    AriTranscriber.prototype.stopAudioServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.audioServer) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.audioServer.close()];
                    case 1:
                        _a.sent();
                        this.audioServer = null;
                        console.log("Audio server stopped");
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /*
     * The transcriptCallback simply passes any text received from the
     * speech provider to any client connected to the WebSocket server.
     */
    AriTranscriber.prototype.transcriptCallback = function (text, isFinal) {
        if (isFinal && this.wssServer) {
            console.log("Received transcription:", text);
            this.wssServer.clients.forEach(function (client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(text);
                }
            });
        }
    };
    /*
     * The resultsCallback is just an example of how Google identifies
     * speakers if you have speakerDiarization enabled. We don't do
     * anything with this other than display the raw results on the console.
     */
    AriTranscriber.prototype.resultsCallback = function (results) {
        if (results[0].isFinal) {
            var transcription = results
                .map(function (result) { return result.alternatives[0].transcript; })
                .join("\n");
            console.log("Transcription: ".concat(transcription));
            var wordsInfo = results[0].alternatives[0].words;
            wordsInfo.forEach(function (a) {
                return console.log(" word: ".concat(a.word, ", speakerTag: ").concat(a.speakerTag));
            });
        }
    };
    // The main wrapper
    AriTranscriber.prototype.transcriber = function () {
        return __awaiter(this, void 0, void 0, function () {
            var speechEncoding, speechRate, swap16, config;
            var _this = this;
            return __generator(this, function (_a) {
                swap16 = false;
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
                        console.error("Unknown format ".concat(this.opts.format));
                        return [2 /*return*/];
                }
                // Start the server that receives audio from Asterisk.
                console.log("Starting audio listener on ".concat(this.opts.listenServer));
                this.audioServer = new rtp.RtpUdpServerSocket(this.opts.listenServer, swap16, this.opts.audioOutput || false);
                this.audioServer.on("packet", function (packet) {
                    console.log("Received RTP packet:", packet); // Log the received RTP packet
                });
                console.log("Starting speech provider");
                config = {
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
                this.speechProvider = new provider.GoogleSpeechProvider(config, this.audioServer, function (text, isFinal) {
                    _this.transcriptCallback(text, isFinal);
                }, function (results) {
                    if (_this.opts.speakerDiarization) {
                        _this.resultsCallback(results);
                    }
                });
                console.log("speechProvider started");
                // If wssPort was specified, start the WebSocket server.
                if (this.opts.wssPort > 0) {
                    console.log("Starting ".concat(this.opts.sslCert ? "secure " : "", "transcription websocket server on port ").concat(this.opts.wssPort));
                    this.startWebsocketServer();
                }
                console.log("Processing");
                return [2 /*return*/];
            });
        });
    };
    return AriTranscriber;
}(EventEmitter));
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
