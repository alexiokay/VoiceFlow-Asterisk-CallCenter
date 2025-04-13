# FreePBX Server Installation and Configuration Guide

This guide provides step-by-step instructions for setting up a FreePBX server to work with the ARI Stasi Server application.

## 1. Virtual Machine Setup

1. Create a new virtual machine with the following specifications:
   - Set network adapter to **Bridged** (use the same adapter as your host machine)
   - Configure adequate storage (minimum 20GB recommended)
   - Set boot order: first boot from installation media, then from disk

2. Install Debian 12 as the base operating system
   - Follow the standard Debian installation procedure
   - Select minimal installation options
   - After installation, change boot order: first boot from disk, then from installation media

## 2. Network Configuration

Ensure your network configuration matches your host network settings:

### For Sangoma FreePBX Distro:

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

## 3. FreePBX Installation

1. Download and run the official FreePBX installation script:
   ```bash
   wget https://www.freepbx.org/downloads/
   ```

### Troubleshooting: GitHub Connection Issues

If you encounter "raw.github not resolved" errors, add GitHub to your known hosts:
   ```bash
   nano /etc/hosts
   ```
   Add this line:
   ```
   185.199.110.133 raw.githubusercontent.com
   ```

### Troubleshooting: Script Errors at Line 1174

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

## 4. Configuring ARI (Asterisk REST Interface)

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

## 5. Speech Recognition Configuration

The default configuration uses Google Speech API, but you can consider these alternatives:

- OpenAI Whisper (open-source model)
- MCP server implementation like [MCP-Elevenlab-Scribe-ASR](https://github.com/aromanstatue/MCP-Elevenlab-Scribe-ASR)
- Eleven Labs Scribe (high-quality commercial option)

## 6. SIP Trunk Configuration

Configure your SIP trunk provider in FreePBX:

1. Navigate to: **Connectivity** → **Trunks** → **Add Trunk**

2. Important settings for optimal audio quality:
   - Set **DTMF Mode** to **RFC4733**
   - Enable **Transport** options for **TLS** and **SRTP** if supported by your provider
   - Set **Codec Priority** to prioritize higher quality codecs (G.722, OPUS)

3. For outgoing calls, configure outbound routes in FreePBX:
   - Navigate to: **Connectivity** → **Outbound Routes**
   - Create a route that uses your trunk for outgoing calls

4. For incoming calls, configure inbound routes in FreePBX:
   - Navigate to: **Connectivity** → **Inbound Routes**
   - Create a route that directs incoming calls to the appropriate destination

## 7. Testing the Setup

1. Use the ARI Stasi Server application to connect to your FreePBX server
2. Test both incoming and outgoing calls
3. Verify that speech recognition and transcription are working correctly

## Additional Resources

- [Official FreePBX Documentation](https://wiki.freepbx.org/)
- [Asterisk REST Interface (ARI) Documentation](https://wiki.asterisk.org/wiki/display/AST/Asterisk+REST+Interface+(ARI))
- [SIP Trunk Configuration Guide](https://wiki.freepbx.org/display/FPG/Trunks+Module) 