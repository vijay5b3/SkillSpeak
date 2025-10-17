# 🚀 SRMV v2.0.0 - Production Release

**Release Date:** October 17, 2025  
**Build Status:** ✅ Complete  
**Production URL:** https://chat-bot-final-b1uz.vercel.app

---

## 📦 What's New in v2.0.0

### ✨ Updated Production URL
- Now connects to: `https://chat-bot-final-b1uz.vercel.app`
- Updated SSE endpoint: `/events`
- Updated API endpoint: `/api/chat`

### 🔧 Technical Improvements
- Built with .NET 8.0
- Self-contained executable (no installation required)
- Optimized for Windows 10/11 (x64)
- File size: ~170 MB (uncompressed), ~73.5 MB (ZIP)

---

## 📥 Download & Installation

### Option 1: Pre-built Binary (Recommended)
1. Navigate to `SRMV-Production/` folder
2. Extract `SRMV-v2.0.0.zip`
3. Double-click `SRMV.exe` to run
4. No installation required!

### Option 2: Build from Source
```powershell
cd "windows app/TransparentOverlayApp"
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```
Output will be in: `bin/Release/net8.0-windows/win-x64/publish/`

---

## 🌐 Production Configuration

This release is configured for production deployment:

| Component | URL |
|-----------|-----|
| **Base URL** | https://chat-bot-final-b1uz.vercel.app |
| **SSE Stream** | https://chat-bot-final-b1uz.vercel.app/events |
| **Chat API** | https://chat-bot-final-b1uz.vercel.app/api/chat |
| **Web Interface** | https://chat-bot-final-b1uz.vercel.app |

---

## ✨ Features

- ✅ **Always on Top** - Stays above all windows
- ✅ **Transparent Mode** - Press F2 to toggle (60% ↔ 100%)
- ✅ **Screen Capture Protected** - Hidden from Zoom/Teams/OBS
- ✅ **Auto-Reconnect** - Reconnects every 2 seconds if disconnected
- ✅ **Hidden from Taskbar** - Clean desktop experience
- ✅ **Resizable** - Drag corners/edges (min: 400x300, default: 800x500)
- ✅ **Real-time Sync** - Messages sync with web interface
- ✅ **Direct Input** - Send messages without opening browser

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **F2** | Toggle transparency (60% ↔ 100%) |
| **Enter** | Send message |
| **Shift+Enter** | New line in message |
| **Drag** | Move window (click anywhere on background) |

---

## 🔧 System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit)
- **RAM:** 100 MB minimum
- **Disk Space:** 200 MB
- **Internet:** Required for server connection
- **.NET Runtime:** Included (self-contained)

---

## 📂 File Structure

```
SRMV-Production/
├── SRMV.exe                        # Main executable (169.72 MB)
├── SRMV.pdb                        # Debug symbols
├── SRMV-v2.0.0.zip                 # Compressed package (73.5 MB)
├── README.md                       # Production documentation
├── D3DCompiler_47_cor3.dll         # DirectX compiler
├── PenImc_cor3.dll                 # Input method support
├── PresentationNative_cor3.dll     # WPF presentation layer
├── vcruntime140_cor3.dll           # Visual C++ runtime
└── wpfgfx_cor3.dll                 # WPF graphics
```

---

## 🐛 Troubleshooting

### App won't connect:
1. Check internet connection
2. Verify production server is online: https://chat-bot-final-b1uz.vercel.app
3. Wait for auto-reconnect (every 2 seconds)
4. Check Windows Firewall settings

### No responses appearing:
1. Test web app: https://chat-bot-final-b1uz.vercel.app
2. Check Vercel deployment status
3. Verify environment variables in Vercel
4. Check browser console for errors

### App not visible:
1. Check Task Manager → look for "SRMV.exe"
2. Hidden from taskbar by design
3. Window should be on desktop
4. Try Alt+Tab to find window

### Performance issues:
1. Close unnecessary applications
2. Check system resources in Task Manager
3. Restart the application
4. Update Windows to latest version

---

## 📊 Version History

| Version | Date | Changes |
|---------|------|---------|
| **2.0.0** | Oct 17, 2025 | Updated to production URL: chat-bot-final-b1uz.vercel.app |
| 1.3.0 | Previous | Connected to: chat-bot-six-beta.vercel.app |

---

## 🔄 Update Instructions

To update from previous version:

1. Close current SRMV app if running
2. Download new `SRMV-v2.0.0.zip`
3. Extract to replace old files
4. Run new `SRMV.exe`
5. All settings and features preserved

---

## 📞 Support & Links

- **Production App:** https://chat-bot-final-b1uz.vercel.app
- **GitHub Repository:** https://github.com/vijay5b3/ChatBotNew
- **Vercel Dashboard:** https://vercel.com/vijays-projects/chat-bot
- **Issues:** Report on GitHub Issues

---

## 🔐 Security Notes

- ✅ Screen capture protection enabled
- ✅ HTTPS connection to production server
- ✅ No data stored locally
- ✅ All communication encrypted
- ✅ No telemetry or tracking

---

## 📝 License

This project is part of the ChatBotNew repository.

---

## 🎯 Quick Start

1. Go to `SRMV-Production/` folder
2. Extract `SRMV-v2.0.0.zip`
3. Double-click `SRMV.exe`
4. Start chatting! 🚀

**That's it!** The app will automatically connect to the production server and you're ready to use it.

---

**Built with ❤️ using .NET 8.0 and WPF**
