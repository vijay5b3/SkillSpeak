# 🚀 Windows App - Quick Start Guide

## ✅ Windows App Chat is Now Fixed!

The chat functionality has been enhanced with better error handling and diagnostics.

## How to Use

### 1. Start the Server (Required!)
```powershell
cd D:\Geminai
npm start
```
**Wait for:** `Server listening on http://localhost:3000`

### 2. Run Windows App
```powershell
D:\Geminai\SRMV-Production\SRMV.exe
```
**Wait for:** `✅ Connected - Ready to chat!`

### 3. Send a Message
- Type: "hi" or "what is binary search?"
- Press **Enter** or click **📤 Send**
- Watch the response appear!

## Expected Behavior

### When Working Correctly:
```
✅ Connected - Ready to chat!

[👤 You]
hi

[🤖 Assistant]
Hello! I'm your friendly technical interview assistant...
```

### If Server is Not Running:
```
[❌ Network Error]
Could not connect to server. Please check:
1. Server is running
2. Internet connection is active
3. Firewall is not blocking the app

Error: Connection refused
```

## Troubleshooting

### "Network Error" appears?
**→ Start the server:**
```powershell
cd D:\Geminai
npm start
```

### "Connecting to chat server..." stays forever?
**→ Server is not running or URL is wrong**
1. Check server is running
2. You should see "Server listening on http://localhost:3000"

### App closes immediately?
**→ Rebuild may be needed:**
```powershell
cd D:\Geminai
taskkill /F /IM SRMV.exe
cd "windows app/TransparentOverlayApp"
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o "../../SRMV-Production"
```

## Key Features

✅ **Clean Message Format** - No horizontal lines  
✅ **Real-time Streaming** - Words appear as AI types  
✅ **Smart Error Messages** - Tells you exactly what's wrong  
✅ **Auto-Reconnect** - Reconnects if connection drops  
✅ **Debug Logging** - Detailed logs for troubleshooting  

## Controls

- **Type & Enter** - Send message
- **F2** - Toggle transparency
- **Drag** - Move window
- **Resize grips** - Resize window
- **✕ button** - Close app

---

**Need help?** Check `WINDOWS_APP_CHAT_FIXED.md` for detailed troubleshooting.
