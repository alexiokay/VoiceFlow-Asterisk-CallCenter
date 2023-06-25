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
var util = require("util");
var express = require("express");
var app = express();
var server = require("http").createServer(app);
var ari = require("ari-client");
var EventEmitter = require("events");
var WebSocket = require("ws");
var moment = require("moment");
var AriControllerServer = /** @class */ (function (_super) {
    __extends(AriControllerServer, _super);
    function AriControllerServer(pbxIP, accessKey, secretKey) {
        var _this = _super.call(this) || this;
        _this.pbxIP = pbxIP;
        _this.accessKey = accessKey;
        _this.secretKey = secretKey;
        _this.client = null;
        _this.bridge = null;
        _this.bridge2 = null;
        _this.udpServer = null;
        _this.transcriptionServerIp = "0.0.0.0";
        _this.transcriptionServerPort = "3044";
        _this.activeChannels = new Map();
        _this.bridges = null;
        _this.externalMediaChannelId = null;
        _this.isOutgoingCall = false;
        _this.ws = null;
        return _this;
    }
    AriControllerServer.prototype.closeAllChannels = function () {
        this.client.channels.list(function (err, channels) {
            if (err) {
                console.error("Error listing channels:", err);
                return;
            }
            channels.forEach(function (channel) {
                //console.log("Channel: ", channel);
                try {
                    channel.hangup();
                }
                catch (err) { }
            });
        });
    };
    AriControllerServer.prototype.start = function (contacts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connectARI()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.createBridge()];
                    case 2:
                        _a.sent();
                        this.startARILoop();
                        this.startWebServer();
                        this.contacts = contacts;
                        if (this.contacts) {
                            console.log("Contact hash map:", this.contacts);
                        }
                        else {
                            console.log("Failed to convert JSON file to hash map");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AriControllerServer.prototype.connectARI = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var ariEndpoint = "http://".concat(_this.pbxIP, ":8088");
                        ari.connect(ariEndpoint, "asterisk", "asterisk", function (err, client) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                _this.client = client;
                                resolve();
                            }
                        });
                    })];
            });
        });
    };
    AriControllerServer.prototype.createBridge = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, err_1;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        _a = this;
                        return [4 /*yield*/, this.client.bridges.list()];
                    case 1:
                        _a.bridges = _c.sent();
                        this.bridge = this.bridges.find(function (candidate) { return candidate.bridge_type === "mixing"; });
                        if (!this.bridge) return [3 /*break*/, 2];
                        console.log("Using bridge ".concat(this.bridge.id));
                        return [3 /*break*/, 4];
                    case 2:
                        _b = this;
                        return [4 /*yield*/, this.client.bridges.create({ type: "mixing" })];
                    case 3:
                        _b.bridge = _c.sent();
                        console.log("Created bridge ".concat(this.bridge.id));
                        _c.label = 4;
                    case 4:
                        this.bridge.on("BridgeDestroyed", function (event) {
                            _this.emit("bridgeDestroyed", event);
                        });
                        return [2 /*return*/];
                    case 5:
                        err_1 = _c.sent();
                        throw err_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AriControllerServer.prototype.startARILoop = function () {
        this.client.on("StasisStart", this.stasisStart.bind(this));
        this.client.on("StasisEnd", this.stasisEnd.bind(this));
        this.client.on("ChannelDtmfReceived", this.dtmfReceived.bind(this));
        this.client.start("hello-world");
    };
    AriControllerServer.prototype.startWebServer = function () {
        var port = 3011;
        server.listen(port, function () {
            console.log("Listening on *:".concat(port));
        });
        app.use(express.static(__dirname + "/public"));
        app.get("/", function (req, res) {
            res.sendFile(__dirname + "/testPage.html");
        });
        console.log("Client connected");
        this.ws = new WebSocket("ws://".concat(this.transcriptionServerIp, ":").concat(this.transcriptionServerPort));
        this.ws.onopen = function () {
            console.log("WebSocket connection to AriTranscriber server established");
        };
        this.ws.onmessage = function (message) {
            console.log("Received transcription:", message.data);
        };
        this.ws.onclose = function () {
            console.log("WebSocket connection to AriTranscriber server closed");
        };
    };
    AriControllerServer.prototype.stasisStart = function (event, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var dialed, channename, _a, audio_url_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dialed = event.args[0] === "dialed";
                        console.log("dialed: ", dialed);
                        channename = event["channel"]["name"];
                        //console.log("test variable: ", channeldial);
                        console.log("test variable: ", channename);
                        //! ----------------- test -----------------
                        console.log(util.format("Channel %s just entered our application, adding it to bridge %s", channel.name
                        //this.bridge.id
                        ));
                        return [4 /*yield*/, channel.answer()];
                    case 1:
                        _b.sent();
                        if (!dialed) return [3 /*break*/, 2];
                        // if the channel is outgoing, play a welcome message after is answered
                        console.log(dialed ? "this channel is dialed" : "this channel is incoming");
                        this.addChannelToBridge(channel);
                        return [3 /*break*/, 6];
                    case 2:
                        if (!(channel.id == this.externalMediaChannelId)) return [3 /*break*/, 3];
                        this.addChannelToBridge(channel);
                        console.log("this is the external media channel");
                        return [3 /*break*/, 6];
                    case 3:
                        if (!channel.name.startsWith("UnicastRTP")) return [3 /*break*/, 4];
                        this.addChannelToBridge(channel);
                        console.log("this is the external media channel");
                        return [3 /*break*/, 6];
                    case 4:
                        console.log("bridge type:" + this.bridge.bridge_type);
                        this.addChannelToBridge(channel);
                        _a = this;
                        return [4 /*yield*/, this.createExternalMediaChannel()];
                    case 5:
                        _a.externalMediaChannelId = _b.sent();
                        audio_url_1 = "custom/welcome";
                        channel.play({ media: "sound:".concat(audio_url_1) }, function (err, playback) {
                            console.log(util.format("Playing audio: ", audio_url_1));
                            if (err) {
                                console.error("Error playing audio:", err);
                                return;
                            }
                            playback.once("PlaybackFinished", function (completedPlayback) {
                                var noMatchCount = 0;
                                console.log("Audio playback finished");
                                _this.playAudio(channel, "beep");
                                setTimeout(function () { }, 6000);
                                _this.ws.onmessage = function (message) {
                                    console.log("script received transcription:", message.data);
                                    var foundNumber = _this.findNumberByWords(message.data);
                                    console.log("found number: ", foundNumber);
                                    if (foundNumber === "no-match") {
                                        noMatchCount++;
                                        _this.playAudio(channel, "beep");
                                        if (noMatchCount === 3 ||
                                            noMatchCount === 6 ||
                                            noMatchCount === 9) {
                                            _this.playAudio(channel, "custom/try_again");
                                        }
                                        else if (noMatchCount === 12) {
                                            console.log("no match 3 times, hangup the call");
                                            // hangup the call
                                            channel.hangup();
                                        }
                                    }
                                    else {
                                        console.log("found number: ", foundNumber);
                                        _this.initiateOutgoingCall(channel, foundNumber);
                                        // breeak the ws.onmessage loop
                                        _this.ws.onmessage = function () { };
                                    }
                                };
                            });
                        });
                        _b.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AriControllerServer.prototype.initiateOutgoingCall = function (dialingChannel, recipent) {
        return __awaiter(this, void 0, void 0, function () {
            var fromNumber, fromNumber2, fromNumber3, magda, gajuk, testPhone, testPhone2, sipProvider, outgoingChannelParams, ringingPlayback;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fromNumber = "+48732059465";
                        fromNumber2 = "+31857603963";
                        fromNumber3 = "+48326305144";
                        magda = "+48518811205";
                        gajuk = "+48690007602";
                        testPhone = "+48428813669";
                        testPhone2 = "+3197010253339";
                        sipProvider = "alexispace@freshandtidy.pstn.twilio.com";
                        outgoingChannelParams = {
                            endpoint: "Local/".concat(recipent, "@from-internal"),
                            app: "hello-world",
                            callerId: fromNumber3,
                            appArgs: "dialed",
                            headers: {
                                "X-Custom-Caller-ID": fromNumber3,
                                "X-Custom-Recipient": recipent,
                                // Add more headers if needed
                            },
                        };
                        dialingChannel.play({ media: "tone:ring;tonezone=fr" }, function (err, newPlayback) {
                            if (err) {
                                throw err;
                            }
                            ringingPlayback = newPlayback;
                        });
                        return [4 /*yield*/, this.client.channels.originate(outgoingChannelParams, function (err, channel) {
                                // save the channel id so we can control it later on StasisStart
                                if (err) {
                                    console.error("Error initiating outgoing call:", err);
                                    return;
                                }
                                channel.on("StasisStart", function (event, channel) {
                                    channel.play({ media: "sound:custom/welcome_2" }, function (err, playback) {
                                        if (err) {
                                            console.error("Error playing ringing tone:", err);
                                            return;
                                        }
                                        playback.once("PlaybackFinished", function (completedPlayback) {
                                            console.log("Ringing tone playback finished");
                                            ringingPlayback.stop();
                                        });
                                    });
                                    setTimeout(function () { }, 2000);
                                    _this.playAudio(channel, "beep");
                                });
                                // Store the call start time
                                var callStartTime = moment().format("YYYY-MM-DD HH:mm:ss");
                                //this.addChannelToBridge(channel);
                                console.log("Outgoing call initiated successfully");
                                // Register the call usage after the call ends
                                channel.on("StasisEnd", function (event, channel) {
                                    var callEndTime = moment()
                                        .add(1, "hour")
                                        .format("YYYY-MM-DD HH:mm:ss");
                                    var date = new Date().toISOString().split("T")[0];
                                    // Register outgoing call usage
                                    _this.registerOutgoingCallUsage(fromNumber3, recipent, callStartTime, callEndTime, date);
                                });
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AriControllerServer.prototype.stasisEnd = function (event, channel) {
        var channelId = channel.id;
        console.log("Channel ".concat(channelId, " just left the Stasis application"));
        this.activeChannels.delete(channelId);
        // close all channels
        this.closeAllChannels();
    };
    AriControllerServer.prototype.dtmfReceived = function (event, channel) {
        console.log("Channel ".concat(channel.name, " clicked: ").concat(event.digit));
    };
    AriControllerServer.prototype.createExternalMediaChannel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ariEndpoint, appName, externalHost, format, username, password, port, url, response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ariEndpoint = "http://".concat(this.pbxIP, ":8088/ari");
                        appName = "hello-world";
                        externalHost = "84.29.2.193";
                        format = "ulaw";
                        username = "asterisk";
                        password = "asterisk";
                        port = 8000;
                        url = "".concat(ariEndpoint, "/channels/externalMedia?app=").concat(appName, "&external_host=").concat(externalHost, "%3A").concat(8000, "&format=").concat(format);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(url, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: "Basic ".concat(Buffer.from("".concat(username, ":").concat(password)).toString("base64")),
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        return [2 /*return*/];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Error creating ExternalMedia channel:", error_1.message);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AriControllerServer.prototype.playAudio = function (channel, audioUrl) {
        channel.play({ media: "sound:".concat(audioUrl) }, function (err, playback) {
            console.log("Playing audio:", audioUrl);
            if (err) {
                console.error("Error playing audio:", err);
                return;
            }
            else {
                console.log("Audio played successfully");
            }
        });
    };
    AriControllerServer.prototype.addChannelToBridge = function (channel, bridge) {
        var _this = this;
        if (bridge === void 0) { bridge = this.bridge; }
        bridge.addChannel({ channel: channel.id }, function (err) {
            if (err) {
                console.error("Error adding channel to bridge:", err);
                return;
            }
            else {
                console.log("Channel added to bridge successfully: " + channel.name);
                _this.emit("channelAddedToBridge", channel);
            }
            console.log("User: " + channel.name);
        });
    };
    /**
     * Finds a phone number based on matching words in a given text.
     * @param {string} searchWords - The text to search for matching words.
     * @returns {string} - The matched phone number, or "no-match" if no match is found.
     */
    AriControllerServer.prototype.findNumberByWords = function (searchWords) {
        var foundNumber = "no-match";
        // Split the search words into an array and remove empty strings
        var searchWordList = searchWords
            .toLowerCase()
            .split(" ")
            .filter(function (word) { return word !== ""; });
        // Iterate over each contact to find a match
        for (var _i = 0, _a = this.contacts.contacts; _i < _a.length; _i++) {
            var contact = _a[_i];
            var name_1 = contact.name, phone = contact.phone, words = contact.words;
            console.log("name: ", name_1);
            console.log("phone: ", phone);
            console.log("words: ", words);
            console.log("searchWordList: ", searchWordList);
            // Check if any word in the contact's words matches any word in the search word list
            var matchFound = words.some(function (contactWord) {
                // Find the matched word in the search word list
                var matchedWord = searchWordList.find(function (word) {
                    return contactWord.toLowerCase().includes(word);
                });
                if (matchedWord) {
                    console.log("Matched word: ".concat(matchedWord));
                    return true; // Exit the loop once a match is found
                }
                return false;
            });
            if (matchFound) {
                foundNumber = phone;
                break; // Exit the loop once a match is found
            }
        }
        return foundNumber;
    };
    AriControllerServer.prototype.registerOutgoingCallUsage = function (fromNumber, recipent, callStartTime, callEndTime, date) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("callStartTime: ", callStartTime);
                console.log("callEndTime: ", callEndTime);
                console.log("phoneNumber: ", fromNumber);
                console.log("recipent: ", recipent);
                fetch("http://127.0.0.1:8001/api/v1/call-usage/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        start_time: callStartTime,
                        end_time: callEndTime,
                        from_number: fromNumber,
                        recipent: recipent,
                        date: date,
                    }),
                })
                    .then(function (response) { return response.json(); })
                    .then(function (data) {
                    console.log("Success:", data);
                })
                    .catch(function (error) {
                    console.error("Error:", error);
                });
                return [2 /*return*/];
            });
        });
    };
    AriControllerServer.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.activeChannels.clear();
                //this.closeAllChannels();
                this.emit("close");
                return [2 /*return*/];
            });
        });
    };
    return AriControllerServer;
}(EventEmitter));
// Usage:
// const pbxIP = "45.32.239.133";
// const accessKey = "ACCESS KEY HERE";
// const secretKey = "SECRET KEY HERE";
// const speechServer = new AriControllerServer(pbxIP, accessKey, secretKey);
// speechServer.start();
module.exports.AriControllerServer = AriControllerServer;
