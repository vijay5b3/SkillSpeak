# 🎯 SRMV - Production Build

## ✅ Connected to Production Server

This build connects to your **live Vercel production server**:

- **Production URL:** https://chat-bot-final-b1uz.vercel.app
- **SSE Endpoint:** https://chat-bot-final-b1uz.vercel.app/events
- **API Endpoint:** https://chat-bot-final-b1uz.vercel.app/api/chat

---

## 📦 What's Included

- **SRMV.exe** - Standalone Windows application (72 MB)
- Self-contained with .NET 8.0 runtime
- No installation required
- Works on Windows 10/11

---

## 🚀 How to Use

1. **Double-click** `SRMV.exe` to run
2. Window appears as always-on-top overlay
3. **Automatically connects** to production server
4. Type questions in the text box at bottom
5. Press **Enter** or click **Send**
6. Responses appear instantly

---

## ⌨️ Keyboard Shortcuts

- **F2** - Toggle transparency (60% ↔ 100%)
- **Drag** - Move window by clicking anywhere
- **Resize** - Drag corners/edges to resize

---

## ✨ Features

- ✅ **Always on Top** - Stays above all windows
- ✅ **Transparent Mode** - Press F2 to make semi-transparent
- ✅ **Screen Capture Protected** - Hidden from Zoom/Teams/OBS
- ✅ **Auto-Reconnect** - Reconnects every 2 seconds if disconnected
- ✅ **Hidden from Taskbar** - Only visible in Task Manager
- ✅ **Resizable** - Minimum 400x300, default 800x500
- ✅ **Real-time Sync** - Shows messages from web interface
- ✅ **Direct Input** - Send messages without web interface

---

## 🌐 Connected to Vercel Production

This build is configured for:

```
Server: https://chat-bot-final-b1uz.vercel.app
SSE Stream: /events
API: /api/chat
```

**All messages sync between:**
- This Windows app
- Web interface at https://chat-bot-final-b1uz.vercel.app
- Any other connected clients

---

## 🔧 Technical Details

- **Platform:** Windows 10/11 (x64)
- **Framework:** .NET 8.0 (self-contained)
- **Size:** ~72 MB
- **Connection:** HTTPS with auto-reconnect
- **Protocol:** SSE (Server-Sent Events) + REST API

---

## 🐛 Troubleshooting

### App won't connect:
- Check internet connection
- Verify production server is running
- Wait for auto-reconnect (every 2 seconds)

### No responses appearing:
- Check if web app is working: https://chat-bot-final-b1uz.vercel.app
- Verify Vercel environment variables are set
- Check Vercel deployment logs

### App not visible:
- Check Task Manager → it should be running
- Hidden from taskbar by design
- Look for window on your desktop

---

## 📊 Version Information

- **Build Date:** October 17, 2025
- **Version:** 2.0.0 (Production)
- **Server:** Vercel Production
- **URL:** https://chat-bot-final-b1uz.vercel.app

---

## 🔄 Updates

To get latest version:
1. Download new SRMV.exe from repository
2. Replace old file
3. Run new version

---

## 📞 Support

- **Production URL:** https://chat-bot-final-b1uz.vercel.app
- **Repository:** https://github.com/vijay5b3/ChatBotNew
- **Vercel Dashboard:** https://vercel.com/vijays-projects/chat-bot

---

**Ready to use!** Just double-click SRMV.exe to start. 🚀
