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

    this.udpServer = null;
    this.transcriptionServerIp = "0.0.0.0";
    this.transcriptionServerPort = "3044";
    this.activeChannels = new Map();
    this.bridges = null;
    this.externalMediaChannelId = null;
    this.isOutgoingCall = false;
    this.ws = null;
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

  async start(contacts: any[]) {
    await this.connectARI();
    await this.createBridge();
    this.startARILoop();
    this.startWebServer();
    this.contacts = contacts;

    if (this.contacts) {
      console.log("Contact hash map:", this.contacts);
    } else {
      console.log("Failed to convert JSON file to hash map");
    }
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

    this.ws = new WebSocket(
      `ws://${this.transcriptionServerIp}:${this.transcriptionServerPort}`
    );

    this.ws.onopen = () => {
      console.log("WebSocket connection to AriTranscriber server established");
    };

    this.ws.onmessage = (message) => {
      console.log("Received transcription:", message.data);
    };

    this.ws.onclose = () => {
      console.log("WebSocket connection to AriTranscriber server closed");
    };
  }

  async stasisStart(event, channel) {
    const dialed = event.args[0] === "dialed";

    console.log("dialed: ", dialed);

    //! ----------------- test -----------------
    //const channeldial = event["channel"]["dialed"]["name"];
    const channename = event["channel"]["name"];
    //console.log("test variable: ", channeldial);
    console.log("test variable: ", channename);
    //! ----------------- test -----------------

    console.log(
      util.format(
        "Channel %s just entered our application, adding it to bridge %s",
        channel.name
        //this.bridge.id
      )
    );

    await channel.answer();

    if (dialed) {
      // if the channel is outgoing, play a welcome message after is answered
      console.log(
        dialed ? "this channel is dialed" : "this channel is incoming"
      );
      this.playAudio(channel, "custom/welcome_2");

      setTimeout(() => {}, 2000);
      this.playAudio(channel, "beep");

      this.addChannelToBridge(channel);
    } else if (channel.id == this.externalMediaChannelId) {
      this.addChannelToBridge(channel);
      console.log("this is the external media channel");
    } else if (channel.name.startsWith("UnicastRTP")) {
      this.addChannelToBridge(channel);
      console.log("this is the external media channel");
    } else {
      console.log("bridge type:" + this.bridge.bridge_type);
      this.addChannelToBridge(channel);
      this.externalMediaChannelId = await this.createExternalMediaChannel();

      // console.log("from channel: ", channel.name);

      //if the channel is incoming, play a welcome message and initiate the outgoing call
      const audio_url = "custom/welcome";
      channel.play({ media: `sound:${audio_url}` }, (err, playback) => {
        console.log(util.format("Playing audio: ", audio_url));
        if (err) {
          console.error("Error playing audio:", err);
          return;
        }

        playback.once("PlaybackFinished", (completedPlayback) => {
          let noMatchCount = 0;
          console.log("Audio playback finished");
          this.playAudio(channel, "beep");
          setTimeout(() => {}, 6000);

          this.ws.onmessage = (message) => {
            console.log("script received transcription:", message.data);

            let foundNumber = this.findNumberByWords(message.data);
            console.log("found number: ", foundNumber);
            if (foundNumber === "no-match") {
              noMatchCount++;
              this.playAudio(channel, "beep");

              if (noMatchCount === 10) {
                console.log("no match 3 times, hangup the call");
                // hangup the call
                channel.hangup();
              }
            } else {
              console.log("found number: ", foundNumber);
              this.initiateOutgoingCall(channel, foundNumber);
              // breeak the ws.onmessage loop
              this.ws.onmessage = () => {};
            }
          };
        });
      });
    }
  }

  initiateOutgoingCall(dialingChannel, recipent) {
    const fromNumber = "+48732059465"; // Twilio
    const fromNumber2 = "+31857603963"; // Hallo
    const fromNumber3 = "+48326305144"; // Voim.ms
    const magda = "+48518811205";
    const gajuk = "+48690007602";
    const testPhone = "+48428813669"; // Voip.ms Bria
    const testPhone2 = "+3197010253339"; // Twilio
    const sipProvider = "alexispace@freshandtidy.pstn.twilio.com";

    const outgoingChannelParams = {
      endpoint: `Local/${recipent}@from-internal`,
      app: "hello-world",

      callerId: fromNumber3,
      appArgs: "dialed",
      headers: {
        "X-Custom-Caller-ID": fromNumber3,
        "X-Custom-Recipient": recipent,
        // Add more headers if needed
      },
    };

    this.client.channels.originate(outgoingChannelParams, (err, channel) => {
      // save the channel id so we can control it later on StasisStart
      if (err) {
        console.error("Error initiating outgoing call:", err);
        return;
      }
      //this.addChannelToBridge(channel);
      console.log("Outgoing call initiated successfully");
    });
  }

  stasisEnd(event, channel) {
    const channelId = channel.id;
    console.log(`Channel ${channelId} just left the Stasis application`);

    this.activeChannels.delete(channelId);

    // close all channels
    this.closeAllChannels();
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
      return;

      console.log("ExternalMedia channel created:", data);
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

  findNumberByWords(searchWords) {
    let foundNumber = "no-match";

    const searchWordList = searchWords.toLowerCase().split(" ");

    for (const contact of this.contacts.contacts) {
      const { name, phone, words } = contact;

      const lowercaseName = name.toLowerCase();

      const matchFound = searchWordList.some((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "i");
        return (
          lowercaseName.match(regex) ||
          words.some((contactWord) => contactWord.match(regex))
        );
      });

      if (matchFound) {
        foundNumber = phone;
        break; // Exit the loop once a match is found
      }
    }

    return foundNumber;
  }

  // Function to escape special characters in a string
  escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
  }

  async close() {
    this.activeChannels.clear();
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
