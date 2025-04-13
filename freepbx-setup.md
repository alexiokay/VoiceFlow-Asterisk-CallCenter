# 🛠️ FreePBX Server Installation and Configuration Guide

[![Debian](https://img.shields.io/badge/Debian-12-purple.svg)](https://www.debian.org/)
[![FreePBX](https://img.shields.io/badge/FreePBX-17-orange.svg)](https://www.freepbx.org/)
[![Asterisk](https://img.shields.io/badge/Asterisk-20-red.svg)](https://www.asterisk.org/)

<div align="center">
  <img src="https://www.freepbx.org/wp-content/uploads/Sangoma_FreePBX_Logo_RGB_hori-pos-e1588854523908.png" alt="FreePBX Logo" width="300"/>
  <br>
  <em>Complete guide to setting up and configuring your FreePBX server for use with ARI Stasi</em>
</div>

---

## 📑 Table of Contents
- [Virtual Machine Setup](#-virtual-machine-setup)
- [Network Configuration](#-network-configuration)
- [FreePBX Installation](#-freepbx-installation)
- [Configuring ARI](#-configuring-ari-asterisk-rest-interface)
- [Speech Recognition Configuration](#-speech-recognition-configuration)
- [SIP Trunk Configuration](#-sip-trunk-configuration)
- [Testing the Setup](#-testing-the-setup)
- [Additional Resources](#-additional-resources)

---

## 💻 Virtual Machine Setup

<img src="https://cdn-icons-png.flaticon.com/512/6119/6119533.png" alt="VM" width="50" align="right"/>

<details open>
<summary><b>Step-by-step VM Configuration</b></summary>
<p>

1. Create a new virtual machine with the following specifications:
   - Set network adapter to **Bridged** (use the same adapter as your host machine)
   - Configure adequate storage (minimum 20GB recommended)
   - Set boot order: first boot from installation media, then from disk

2. Install Debian 12 as the base operating system
   - Follow the standard Debian installation procedure
   - Select minimal installation options
   - After installation, change boot order: first boot from disk, then from installation media

</p>
</details>

## 🌐 Network Configuration

<img src="https://cdn-icons-png.flaticon.com/512/1373/1373315.png" alt="Network" width="50" align="right"/>

Ensure your network configuration matches your host network settings:

<details>
<summary><b>Sangoma FreePBX Distro Configuration</b></summary>
<p>

1. Edit the Apache HTTP configuration:
   ```bash
   nano /etc/httpd/conf/httpd.conf
   ```
   - Set the server name to match your host IP address

2. Edit the network interface configuration:
   ```bash
   nano /etc/sysconfig/network-scripts/ifcfg-eth0
   ```
   - Set the IP address to be in the same subnet as your host machine (change only the last octet)
   - Example: If host is `192.168.1.10`, set VM to something like `192.168.1.20`

</p>
</details>

## 📥 FreePBX Installation

<img src="https://cdn-icons-png.flaticon.com/512/2344/2344139.png" alt="Install" width="50" align="right"/>

<details>
<summary><b>Installation Steps</b></summary>
<p>

1. Download and run the official FreePBX installation script:
   ```bash
   wget https://www.freepbx.org/downloads/
   ```

</p>
</details>

<details>
<summary><b>⚠️ Troubleshooting: GitHub Connection Issues</b></summary>
<p>

If you encounter "raw.github not resolved" errors, add GitHub to your known hosts:
   ```bash
   nano /etc/hosts
   ```
   Add this line:
   ```
   185.199.110.133 raw.githubusercontent.com
   ```

</p>
</details>

<details>
<summary><b>⚠️ Troubleshooting: Script Errors at Line 1174</b></summary>
<p>

If you get error with line 1174, this is often related to date/time synchronization:

1. Check your current date:
   ```bash
   date
   ```

2. If incorrect, install NTP and synchronize time:
   ```bash
   apt install ntp -y
   systemctl start ntp
   timedatectl set-ntp true
   ```

3. Re-run the installation script:
   ```bash
   sudo bash /tmp/sng_freepbx_debian_install.sh
   ```

</p>
</details>

## 🔌 Configuring ARI (Asterisk REST Interface)

<img src="https://cdn-icons-png.flaticon.com/512/2885/2885417.png" alt="API" width="50" align="right"/>

<details open>
<summary><b>ARI Configuration Steps</b></summary>
<p>

1. Access the FreePBX web interface using your browser: `http://<your-vm-ip>`

2. Configure ARI in the web interface:
   - Navigate to: **Settings** → **Advanced Settings** → **Asterisk REST API**
   - Enable the interface
   - Add origins (your host IP address and any other authorized IPs)

3. Edit the HTTP configuration to allow connections from other hosts:
   ```bash
   nano /etc/asterisk/http_additional.conf
   ```
   - Change `bindaddr` to `0.0.0.0` to accept connections from all interfaces
   - Alternatively, configure the binding address in **Asterisk Built-in Mini-HTTP Server Settings** under **Advanced Settings**

4. Retrieve ARI credentials for your application:
   - Navigate to: **Settings** → **Advanced Settings** 
   - Check **Display readonly settings** (and optionally **Override readonly settings** if you want to change credentials)
   - Search for **ARI username**
   - Copy the credentials to your `.env` file in the ARI Stasi application

</p>
</details>

## 🎙️ Speech Recognition Configuration

<img src="https://cdn-icons-png.flaticon.com/512/4127/4127185.png" alt="Speech" width="50" align="right"/>

<details>
<summary><b>Speech Recognition Options</b></summary>
<p>

The default configuration uses Google Speech API, but you can consider these alternatives:

| Provider | Type | Features |
|----------|------|----------|
| [OpenAI Whisper](https://github.com/openai/whisper) | Open-source | Self-hosted, multiple languages |
| [MCP-Elevenlab-Scribe-ASR](https://github.com/aromanstatue/MCP-Elevenlab-Scribe-ASR) | Open-source wrapper | High quality, API-based |
| [Eleven Labs Scribe](https://elevenlabs.io/scribe) | Commercial | Best quality, low latency |

</p>
</details>

## 📞 SIP Trunk Configuration

<img src="https://cdn-icons-png.flaticon.com/512/5778/5778578.png" alt="SIP" width="50" align="right"/>

<details open>
<summary><b>Setting up SIP Trunks</b></summary>
<p>

Configure your SIP trunk provider in FreePBX:

1. Navigate to: **Connectivity** → **Trunks** → **Add Trunk**

2. Important settings for optimal audio quality:
   - Set **DTMF Mode** to **RFC4733**
   - Enable **Transport** options for **TLS** and **SRTP** if supported by your provider
   - Set **Codec Priority** to prioritize higher quality codecs (G.722, OPUS)

</p>
</details>

<details>
<summary><b>Outgoing Call Configuration</b></summary>
<p>

For outgoing calls, configure outbound routes in FreePBX:
- Navigate to: **Connectivity** → **Outbound Routes**
- Create a route that uses your trunk for outgoing calls

</p>
</details>

<details>
<summary><b>Incoming Call Configuration</b></summary>
<p>

For incoming calls, configure inbound routes in FreePBX:
- Navigate to: **Connectivity** → **Inbound Routes**
- Create a route that directs incoming calls to the appropriate destination

</p>
</details>

## ✅ Testing the Setup

<img src="https://cdn-icons-png.flaticon.com/512/2858/2858204.png" alt="Testing" width="50" align="right"/>

<details>
<summary><b>Verification Steps</b></summary>
<p>

1. Use the ARI Stasi Server application to connect to your FreePBX server
2. Test both incoming and outgoing calls
3. Verify that speech recognition and transcription are working correctly

</p>
</details>

## 📚 Additional Resources

<details>
<summary><b>Official Documentation</b></summary>
<p>

- [Official FreePBX Documentation](https://wiki.freepbx.org/)
- [Asterisk REST Interface (ARI) Documentation](https://wiki.asterisk.org/wiki/display/AST/Asterisk+REST+Interface+(ARI))
- [SIP Trunk Configuration Guide](https://wiki.freepbx.org/display/FPG/Trunks+Module)

</p>
</details>

---

<div align="center">
  <p>🔧 Connect your telephony system with confidence 🔧</p>
</div> 