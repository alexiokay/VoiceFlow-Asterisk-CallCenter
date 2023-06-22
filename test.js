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
        _this.externalMediaAdded = false;
        _this.udpServer = null;
        _this.transcriptionServerIp = "0.0.0.0";
        _this.transcriptionServerPort = "3044";
        _this.activeChannels = new Map();
        _this.bridges = null;
        _this.externalMediaChannelId = null;
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
    AriControllerServer.prototype.start = function () {
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
            var _a, _b, _c, err_1;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 8, , 9]);
                        _a = this;
                        return [4 /*yield*/, this.client.bridges.list()];
                    case 1:
                        _a.bridges = _d.sent();
                        this.bridge = this.bridges.find(function (candidate) { return candidate.bridge_type === "mixing"; });
                        if (!this.bridge) return [3 /*break*/, 2];
                        console.log("Using bridge ".concat(this.bridge.id));
                        return [3 /*break*/, 4];
                    case 2:
                        _b = this;
                        return [4 /*yield*/, this.client.bridges.create({ type: "mixing" })];
                    case 3:
                        _b.bridge = _d.sent();
                        console.log("Created bridge ".concat(this.bridge.id));
                        _d.label = 4;
                    case 4:
                        if (!this.bridge2) return [3 /*break*/, 5];
                        console.log("Using bridge ".concat(this.bridge2.id));
                        return [3 /*break*/, 7];
                    case 5:
                        _c = this;
                        return [4 /*yield*/, this.client.bridges.create({ type: "mixing" })];
                    case 6:
                        _c.bridge2 = _d.sent();
                        console.log("Created bridge ".concat(this.bridge2.id));
                        _d.label = 7;
                    case 7:
                        this.bridge.on("BridgeDestroyed", function (event) {
                            _this.emit("bridgeDestroyed", event);
                        });
                        return [2 /*return*/];
                    case 8:
                        err_1 = _d.sent();
                        throw err_1;
                    case 9: return [2 /*return*/];
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
        var ws = new WebSocket("ws://".concat(this.transcriptionServerIp, ":").concat(this.transcriptionServerPort));
        ws.onopen = function () {
            console.log("WebSocket connection to AriTranscriber server established");
        };
        ws.onmessage = function (message) {
            console.log("Received transcription:", message.data);
        };
        ws.onclose = function () {
            console.log("WebSocket connection to AriTranscriber server closed");
        };
    };
    AriControllerServer.prototype.stasisStart = function (event, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var dialed, channename, _a, audioUrl, audioChannel, channelExtension;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dialed = event.args[0] === "dialed";
                        console.log("dialed: ", dialed);
                        channename = event["channel"]["name"];
                        console.log("test variable: ", channename);
                        console.log(util.format("Channel %s just entered our application, adding it to bridge %s", channel.name
                        //this.bridge.id
                        ));
                        return [4 /*yield*/, channel.answer()];
                    case 1:
                        _b.sent();
                        if (!!this.externalMediaAdded) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, this.createExternalMediaChannel()];
                    case 2:
                        _a.externalMediaChannelId = _b.sent();
                        this.externalMediaAdded = true;
                        _b.label = 3;
                    case 3:
                        if (!dialed) return [3 /*break*/, 4];
                        console.log("this channel is dialed");
                        console.log("playing audio message");
                        return [3 /*break*/, 10];
                    case 4:
                        if (!(channel.id == this.externalMediaChannelId)) return [3 /*break*/, 5];
                        return [3 /*break*/, 10];
                    case 5:
                        if (!channename.startsWith('UnicastRTP')) return [3 /*break*/, 6];
                        return [3 /*break*/, 10];
                    case 6:
                        if (!(channel.dialplan.exten == 'audio_number')) return [3 /*break*/, 7];
                        this.addChannelToBridge(channel, this.bridge2);
                        return [3 /*break*/, 10];
                    case 7:
                        audioUrl = "custom/welcome";
                        return [4 /*yield*/, this.createAudioChannel()];
                    case 8:
                        audioChannel = _b.sent();
                        channelExtension = audioChannel.dialplan.exten;
                        console.log("Channel extension: " + channelExtension);
                        console.log('bridge type:' + this.bridge.bridge_type);
                        return [4 /*yield*/, channel.answer()];
                    case 9:
                        _b.sent();
                        this.addChannelToBridge(channel, this.bridge1);
                        this.addChannelToBridge(channel, this.bridge2);
                        _b.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    AriControllerServer.prototype.createAudioChannel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.client.channels.originate({
                            endpoint: "Local/audio_number@audio-channel",
                            app: "hello-world",
                            appArgs: "audio-channel",
                            callerId: "CallerID",
                        }, function (err, channel) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(channel);
                            }
                        });
                    })];
            });
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
    AriControllerServer.prototype.initiateOutgoingCall = function (dialingChannel) {
        var fromNumber = "+48732059465"; // Twilio
        var fromNumber2 = "+31857603963"; // Hallo
        var magda = "+48518811205";
        var gajuk = "+48690007602";
        var testPhone = "+48428813669"; // Voip.ms Bria
        var testPhone2 = "+3197010253339"; // Twilio
        var sipProvider = "alexispace@freshandtidy.pstn.twilio.com";
        var outgoingChannelParams = {
            endpoint: "Local/".concat(testPhone, "@from-internal"),
            extension: testPhone,
            callerId: fromNumber2,
            appArgs: testPhone + ",from-internal",
            headers: {
                "X-Custom-Caller-ID": fromNumber2,
                "X-Custom-Recipient": testPhone,
                // Add more headers if needed
            },
        };
        this.client.channels.originate(outgoingChannelParams, function (err, channel) {
            // save the channel id so we can control it later on StasisStart
            if (err) {
                console.error("Error initiating outgoing call:", err);
                return;
            }
            console.log("Outgoing call initiated successfully");
        });
    };
    AriControllerServer.prototype.stasisEnd = function (event, channel) {
        var channelId = channel.id;
        console.log("Channel ".concat(channelId, " just left the Stasis application"));
        this.activeChannels.delete(channelId);
        if (channel.dialplan.exten == 'audio_number') {
            channel.hangup();
        }
        else {
            // close all channels
            this.closeAllChannels();
        }
    };
    AriControllerServer.prototype.dtmfReceived = function (event, channel) {
        console.log("Channel ".concat(channel.name, " clicked: ").concat(event.digit));
    };
    AriControllerServer.prototype.createExternalMediaChannel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ariEndpoint, appName, externalHost, format, username, password, port, url, response, data_1, error_1;
            var _this = this;
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
                        data_1 = _a.sent();
                        console.log("ExternalMedia channel created:", data_1);
                        this.bridge.addChannel({ channel: data_1.id }, function (err) {
                            if (err) {
                                console.error("Error adding channel to bridge:", err);
                                return;
                            }
                            else {
                                console.log("Channel added to bridge successfully: " + data_1.name);
                                _this.emit("channelAddedToBridge", data_1);
                            }
                            console.log("User: " + data_1.name);
                        });
                        return [2 /*return*/, data_1.id];
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
    AriControllerServer.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.activeChannels.clear();
                this.closeAllChannels();
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
