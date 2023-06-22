const util = require("util");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const ari = require("ari-client");
const EventEmitter = require("events");
const WebSocket = require("ws");

class AriControllerServer extends EventEmitter {
  constructor(pbxIP, accessKey, secretKey) {
    super();
    this.pbxIP = pbxIP;
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.client = null;
    this.bridge = null;
    this.bridge2 = null;
    this.externalMediaAdded = false;
    this.udpServer = null;
    this.transcriptionServerIp = "0.0.0.0";
    this.transcriptionServerPort = "3044";
    this.activeChannels = new Map();
    this.bridges = null;
    this.externalMediaChannelId = null;
  }

  closeAllChannels() {
    this.client.channels.list((err, channels) => {
      if (err) {
        console.error("Error listing channels:", err);
        return;
      }

      channels.forEach((channel) => {
        //console.log("Channel: ", channel);
        try {
          channel.hangup();
        } catch (err) {}
      });
    });
  }

  async start() {
    await this.connectARI();
    await this.createBridge();
    this.startARILoop();
    this.startWebServer();
  }

  async connectARI() {
    return new Promise((resolve, reject) => {
      const ariEndpoint = `http://${this.pbxIP}:8088`;

      ari.connect(ariEndpoint, "asterisk", "asterisk", (err, client) => {
        if (err) {
          reject(err);
        } else {
          this.client = client;
          resolve();
        }
      });
    });
  }

  async createBridge() {
    try {
      this.bridges = await this.client.bridges.list();
      this.bridge = this.bridges.find(
        (candidate) => candidate.bridge_type === "mixing"
      );
   

      if (this.bridge) {
        console.log(`Using bridge ${this.bridge.id}`);
      } else {
        this.bridge = await this.client.bridges.create({ type: "mixing" });
        console.log(`Created bridge ${this.bridge.id}`);
      }

      if (this.bridge2) {
        console.log(`Using bridge ${this.bridge2.id}`);
      } else {
        this.bridge2 = await this.client.bridges.create({ type: "mixing" });
        console.log(`Created bridge ${this.bridge2.id}`);
      }

      this.bridge.on("BridgeDestroyed", (event) => {
        this.emit("bridgeDestroyed", event);
      });

      return;
    } catch (err) {
      throw err;
    }
  }

  startARILoop() {
    this.client.on("StasisStart", this.stasisStart.bind(this));
    this.client.on("StasisEnd", this.stasisEnd.bind(this));
    this.client.on("ChannelDtmfReceived", this.dtmfReceived.bind(this));

    this.client.start("hello-world");
  }

  startWebServer() {
    const port = 3011;
    server.listen(port, () => {
      console.log(`Listening on *:${port}`);
    });

    app.use(express.static(__dirname + "/public"));
    app.get("/", (req, res) => {
      res.sendFile(__dirname + "/testPage.html");
    });

    console.log("Client connected");

    const ws = new WebSocket(
      `ws://${this.transcriptionServerIp}:${this.transcriptionServerPort}`
    );

    ws.onopen = () => {
      console.log("WebSocket connection to AriTranscriber server established");
    };

    ws.onmessage = (message) => {
      console.log("Received transcription:", message.data);
    };

    ws.onclose = () => {
      console.log("WebSocket connection to AriTranscriber server closed");
    };
  }

  async stasisStart(event, channel) {
    const dialed = event.args[0] === "dialed";
  
    console.log("dialed: ", dialed);
    const channename = event["channel"]["name"];
    console.log("test variable: ", channename);
  
    console.log(
      util.format(
        "Channel %s just entered our application, adding it to bridge %s",
        channel.name
        //this.bridge.id
      )
    );
  
    await channel.answer();
  
    if (!this.externalMediaAdded) {
      this.externalMediaChannelId = await this.createExternalMediaChannel();
      this.externalMediaAdded = true;
    
    }
  
    if (dialed) {
      console.log("this channel is dialed");
      console.log("playing audio message");
  
      
    } else if (channel.id == this.externalMediaChannelId) {
 
      
     

    } else if (channename.startsWith('UnicastRTP')) {
      
      
    } else if (channel.dialplan.exten == 'audio_number') {
      
      this.addChannelToBridge(channel, this.bridge2);

    } else {

       const audioUrl = "custom/welcome";
      const audioChannel = await this.createAudioChannel(); // Create a separate channel for playing audio
      //this.addChannelToBridge(audioChannel); // Add the audio channel to the bridge
      const channelExtension = audioChannel.dialplan.exten;
      console.log("Channel extension: " + channelExtension);
      console.log('bridge type:' + this.bridge.bridge_type)
  
      await channel.answer();
      
 
        this.addChannelToBridge(channel, this.bridge1);
        this.addChannelToBridge(channel, this.bridge2);


      
  
      
    }
  }
  
  async createAudioChannel() {
    return new Promise((resolve, reject) => {
      this.client.channels.originate(
        {
          endpoint: "Local/audio_number@audio-channel", // Replace with the appropriate endpoint for the audio channel
          app: "hello-world",
          appArgs: "audio-channel",
          callerId: "CallerID",
        },
        (err, channel) => {
          if (err) {
            reject(err);
          } else {
            resolve(channel);
          }
        }
      );
    });
  }
  
  addChannelToBridge(channel, bridge = this.bridge) {
    bridge.addChannel({ channel: channel.id }, (err) => {
      if (err) {
        console.error("Error adding channel to bridge:", err);
        return;
      } else {
        console.log("Channel added to bridge successfully: " + channel.name);
        this.emit("channelAddedToBridge", channel);
      }
      console.log("User: " + channel.name);
    });
  }

  

  initiateOutgoingCall(dialingChannel) {
    const fromNumber = "+48732059465"; // Twilio
    const fromNumber2 = "+31857603963"; // Hallo
    const magda = "+48518811205";
    const gajuk = "+48690007602";
    const testPhone = "+48428813669"; // Voip.ms Bria
    const testPhone2 = "+3197010253339"; // Twilio
    const sipProvider = "alexispace@freshandtidy.pstn.twilio.com";
    const outgoingChannelParams = {
      endpoint: `Local/${testPhone}@from-internal`,
      extension: testPhone,

      callerId: fromNumber2,
      appArgs: testPhone + ",from-internal",
      headers: {
        "X-Custom-Caller-ID": fromNumber2,
        "X-Custom-Recipient": testPhone,
        // Add more headers if needed
      },
    };

    this.client.channels.originate(outgoingChannelParams, (err, channel) => {
      // save the channel id so we can control it later on StasisStart
      if (err) {
        console.error("Error initiating outgoing call:", err);
        return;
      }
      console.log("Outgoing call initiated successfully");
    });
  }

  stasisEnd(event, channel) {
    const channelId = channel.id;
    console.log(`Channel ${channelId} just left the Stasis application`);

    this.activeChannels.delete(channelId);

    if (channel.dialplan.exten == 'audio_number') {
      channel.hangup();
      } else {
         // close all channels
    this.closeAllChannels();
      }

   
  }

  dtmfReceived(event, channel) {
    console.log(`Channel ${channel.name} clicked: ${event.digit}`);
  }

  async createExternalMediaChannel() {
    const ariEndpoint = `http://${this.pbxIP}:8088/ari`;
    const appName = "hello-world";
    const externalHost = `84.29.2.193`;
    const format = "ulaw";
    const username = "asterisk";
    const password = "asterisk";
    const port = 8000;

    const url = `${ariEndpoint}/channels/externalMedia?app=${appName}&external_host=${externalHost}%3A${8000}&format=${format}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${username}:${password}`
          ).toString("base64")}`,
        },
      });

      const data = await response.json();
      console.log("ExternalMedia channel created:", data);\

      this.bridge.addChannel({ channel: data.id }, (err) => {
        if (err) {
          console.error("Error adding channel to bridge:", err);
          return;
        } else {
          console.log("Channel added to bridge successfully: " + data.name);
          this.emit("channelAddedToBridge", data);
        }

        console.log("User: " + data.name);
      });
      return data.id;

      
    } catch (error) {
      console.error("Error creating ExternalMedia channel:", error.message);
    }
  }

  playAudio(channel, audioUrl) {
    channel.play({ media: `sound:${audioUrl}` }, (err, playback) => {
      console.log("Playing audio:", audioUrl);
      if (err) {
        console.error("Error playing audio:", err);
        return;
      } else {
        console.log("Audio played successfully");
      }
    });
  }

  async close() {
    this.activeChannels.clear();
    this.closeAllChannels();
    this.emit("close");
  }
}

// Usage:
// const pbxIP = "45.32.239.133";
// const accessKey = "ACCESS KEY HERE";
// const secretKey = "SECRET KEY HERE";

// const speechServer = new AriControllerServer(pbxIP, accessKey, secretKey);
// speechServer.start();

module.exports.AriControllerServer = AriControllerServer;
