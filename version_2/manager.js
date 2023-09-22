"use strict";
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
var _a = require("./AriTranscriberServer"), AriTranscriber = _a.AriTranscriber, AriTranscriberOptions = _a.AriTranscriberOptions;
var fs = require("fs");
var path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
console.log("Hello, world!");
//? ---------------- Convert JSON file to hash map ----------------
function convertJSONFileToHashMap(filePath) {
    try {
        // Read the JSON file content
        var fileContent = fs.readFileSync(filePath, "utf8");
        // Parse the JSON content into a JavaScript object
        var jsonObject = JSON.parse(fileContent);
        // Create a new hash map
        var hashMap = {};
        // Iterate over the properties of the parsed object
        for (var key in jsonObject) {
            if (jsonObject.hasOwnProperty(key)) {
                // Assign each property as a key-value pair in the hash map
                hashMap[key] = jsonObject[key];
            }
        }
        return hashMap;
    }
    catch (error) {
        console.error("Error converting JSON file to hash map:", error);
        return null;
    }
}
var jsonFilePath = "../tools/contacts.json";
var contacts = convertJSONFileToHashMap(jsonFilePath);
console.log("Contacts:", contacts);
var AriControllerServer = require("./AriControllerServer").AriControllerServer;
// Specify the options for the transcriber
var options = {
    sslCert: "",
    sslKey: "path/to/ssl/private/key.key",
    wssPort: process.env.WSS_PORT,
    format: "ulaw",
    speechLang: "en-US",
    speechModel: "default",
    speakerDiarization: false,
    listenServer: process.env.LISTENER_SERVER,
    audioOutput: "audio.raw",
};
// Create an instance of AriTranscriber with the provided options
var transcriber = new AriTranscriber(options);
// Create an instance of AriControllerServer
var pbxIP = process.env.PBX_IP;
var accessKey = "ACCESS KEY HERE";
var secretKey = "SECRET KEY HERE";
var controller = new AriControllerServer(pbxIP, accessKey, secretKey);
// TODO: make it work
controller.on("close", function () {
    console.log("controller closed");
    //transcriber.stop();
});
transcriber.on("close", function () {
    console.log("transcriber closed");
    //controller.stop();
});
// Handle SIGINT signal to gracefully stop the servers
process.on("SIGINT", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, controller.close()];
            case 1:
                _a.sent();
                process.exit();
                return [2 /*return*/];
        }
    });
}); });
// Start the AriControllerServer
controller.start(contacts);
//TODO: add methods to start and stop the transcriber and controller in case if one of them fails or is closed
