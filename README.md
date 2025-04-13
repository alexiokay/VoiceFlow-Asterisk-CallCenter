# ARI Stasi Server - PBX Management System

## Overview

ARI Stasi Server is a telephony management system built on Asterisk's ARI (Asterisk REST Interface). It provides voice call handling, transcription, and PBX control capabilities. The system combines WebSockets, RTP, and Google Speech-to-Text integration to create a modern, feature-rich telephony solution.

## Key Features

- **Call Management**: Handles incoming and outgoing calls through Asterisk PBX
- **Speech-to-Text**: Real-time transcription of calls using Google Cloud Speech API
- **Bridge Management**: Creates and manages voice bridges for connecting multiple channels
- **Contact Recognition**: Supports voice-activated dialing using a contacts database
- **External Media Channels**: Supports external media integration for advanced use cases
- **WebSocket Interface**: Provides real-time updates and control via WebSockets

## Architecture

The system is built on TypeScript and Node.js with a modular architecture:

### Core Components

1. **AriControllerServer**: The main controller that interfaces with Asterisk PBX
   - Manages call flows, bridges, and DTMF input
   - Handles Stasis application events (start, end)
   - Provides WebSocket server for client connections
   - Manages contact lookups for voice-activated dialing

2. **AriTranscriberServer**: Provides real-time speech transcription
   - Connects to Google Cloud Speech API
   - Processes RTP audio streams
   - Transmits transcription results via WebSockets
   - Supports customizable language and model settings

3. **RTP UDP Server**: Handles the real-time audio streaming
   - Processes incoming RTP packets from Asterisk
   - Handles audio format conversion for transcription

4. **Google Speech Provider**: Integration with Google's Speech-to-Text API
   - Handles streaming transcription with automatic restarts
   - Manages audio chunking for optimal performance
   - Provides both interim and final transcription results

## Configuration

The system uses environment variables for configuration, including:
- PBX server IP and credentials
- WebSocket server ports
- External host information
- Transcription server settings
- Phone number configurations

## Getting Started

1. Set up a FreePBX server - [FreePBX Server Installation and Configuration Guide](freepbx-setup.md)
2. Configure environment variables in `.env` file (see `env.example` for reference)
3. Set up Google Cloud credentials for speech recognition
4. Configure contacts in `tools/contacts.json` for voice-activated dialing
5. Start the system with: `npm start` or `npx ts-node -T core/manager.ts`

## Use Cases

- **Voice Call Center**: Handle incoming calls with transcription for record-keeping
- **Automated Calling Systems**: Set up outbound call campaigns with speech recognition
- **Voice-Activated Dialing**: Allow callers to speak names instead of dialing numbers
- **Call Recording with Transcription**: Keep searchable records of call content

## Dependencies

- Asterisk PBX with ARI enabled
- Node.js and TypeScript
- Google Cloud Speech API credentials
- Various NPM packages including:
  - ari-client
  - @google-cloud/speech
  - ws (WebSockets)
  - express
  - dotenv

## Future Improvements

- Enhanced error handling and retry mechanisms
- UI improvements for monitoring and management
- Additional speech recognition providers
- Call analytics and reporting features