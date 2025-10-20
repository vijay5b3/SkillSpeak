# 🔧 Windows App Troubleshooting Guide

## 🚨 Problem: Windows App Not Receiving Resume Practice Messages

### Current Status
- ✅ Server running on localhost:3000
- ✅ Windows app built with localhost URLs
- ✅ Web browser connected (source: web)
- ❌ Windows app NOT connected (should see "source: windows")

### Expected Server Logs
When both web and Windows app are connected with username "v12", you should see:

```
SSE client connected with ID: v12, source: web. Session clients: 1
SSE client connected with ID: v12, source: windows. Session clients: 2
Broadcasting to client v12 (2 connections): {"role":"user","type":"user","content":"hi"}
```

### What You're Currently Seeing
```
SSE client connected with ID: v12, source: web. Session clients: 1
Broadcasting to client v12 (1 connections): {"role":"user","type":"user","content":"hi"}
```

**Notice: Only 1 connection instead of 2!**

---

## 📋 Step-by-Step Fix

### Step 1: Close ALL Windows App Instances
```powershell
taskkill /F /IM SRMV.exe /T
```

### Step 2: Verify Server is Running
Open PowerShell and check:
```powershell
Test-NetConnection -ComputerName localhost -Port 3000
```

Should see: `TcpTestSucceeded : True`

### Step 3: Launch Windows App
```powershell
cd "d:\Gemina_v2.2_production\windows app\TransparentOverlayApp\bin\Release\net8.0-windows\win-x64"
.\SRMV.exe
```

### Step 4: Enter Username
When the Windows app launches, you should see:
1. **Username Prompt Dialog** - A popup asking for username
2. Enter: **v12** (same as web browser)
3. Click **OK**

### Step 5: Verify Connection
After entering username, you should see:
- Windows overlay appears on screen
- Message: "✅ Connected - Ready to chat!"

Check server terminal - you should now see:
```
SSE client connected with ID: v12, source: windows. Session clients: 2
```

### Step 6: Test Message Flow
1. In browser: Go to Resume-Aware Practice
2. Make sure username is "v12"
3. Send a message: "Tell me about my experience"
4. **Expected Results**:
   - ✅ Question appears in browser
   - ✅ Question appears in Windows overlay
   - ✅ Answer appears in browser
   - ✅ Answer appears in Windows overlay
   - ✅ Voice speaks the answer

---

## 🔍 Common Issues

### Issue 1: Username Prompt Doesn't Appear
**Symptoms**: Windows app launches but no dialog box

**Solution**:
- Check if dialog is hidden behind other windows
- Try Alt+Tab to find it
- Close app and relaunch
- Check Windows notification area (system tray)

### Issue 2: "Connection Failed" Error
**Symptoms**: Windows app shows connection error

**Solution**:
1. Verify server is running:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 3000
   ```

2. Check firewall settings:
   - Allow Node.js through Windows Firewall
   - Allow SRMV.exe through Windows Firewall

3. Restart server:
   ```powershell
   Stop-Process -Name node -Force
   node server.js
   ```

### Issue 3: Only Questions Appear, No Answers
**Symptoms**: User messages show in Windows app but AI responses don't

**Possible Causes**:
1. ❌ Windows app connected to wrong username
2. ❌ Windows app connected to old Vercel URL (not localhost)
3. ❌ Browser and Windows app have different usernames

**Solution**:
- Verify SAME username ("v12") in both browser and Windows app
- Close Windows app completely
- Rebuild and relaunch:
  ```powershell
  cd "d:\Gemina_v2.2_production\windows app\TransparentOverlayApp"
  dotnet build -c Release
  .\bin\Release\net8.0-windows\win-x64\SRMV.exe
  ```

### Issue 4: Two Separate Sessions
**Symptoms**: Server shows 2 different clientIds instead of 2 connections for same clientId

**Server Logs Look Like This (WRONG)**:
```
SSE client connected with ID: v12_web, source: web. Session clients: 1
SSE client connected with ID: v12_windows, source: windows. Session clients: 1
```

**Should Look Like This (CORRECT)**:
```
SSE client connected with ID: v12, source: web. Session clients: 1
SSE client connected with ID: v12, source: windows. Session clients: 2
```

**Solution**:
- Use EXACT SAME username in browser and Windows app
- Username is case-sensitive: "v12" ≠ "V12"

---

## 🧪 Testing Checklist

- [ ] Server running on localhost:3000
- [ ] Windows app (SRMV.exe) visible on screen
- [ ] Username prompt appeared and "v12" was entered
- [ ] Windows overlay shows "✅ Connected - Ready to chat!"
- [ ] Browser connected with username "v12"
- [ ] Server logs show: `Session clients: 2`
- [ ] Resume uploaded/pasted in Resume-Aware Practice
- [ ] Test message sent from browser
- [ ] Message appears in Windows overlay
- [ ] AI response appears in Windows overlay
- [ ] Voice speaks the AI response

---

## 📊 Debug Commands

### Check if Windows App is Running
```powershell
Get-Process -Name SRMV -ErrorAction SilentlyContinue
```

### View Server Logs (Last 50 Lines)
Look for these patterns:
```
SSE client connected with ID: v12, source: web
SSE client connected with ID: v12, source: windows
Broadcasting to client v12 (2 connections)
```

### Kill All Node and SRMV Processes
```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name SRMV -Force -ErrorAction SilentlyContinue
```

### Fresh Start
```powershell
# 1. Kill everything
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
taskkill /F /IM SRMV.exe /T 2>$null

# 2. Start server
cd "d:\Gemina_v2.2_production"
node server.js

# 3. In NEW terminal, launch Windows app
cd "d:\Gemina_v2.2_production\windows app\TransparentOverlayApp\bin\Release\net8.0-windows\win-x64"
.\SRMV.exe

# 4. Enter username: v12

# 5. Open browser: http://localhost:3000
# 6. Set username to "v12" in Resume-Aware Practice
```

---

## 🎯 Expected Workflow

```
┌─────────────────┐
│ Browser (Web)   │──┐
│ Username: v12   │  │
└─────────────────┘  │
                     │
                     ├──▶ Server (localhost:3000)
                     │     clientId: v12
                     │     Session clients: 2
┌──────────────────┐ │
│ Windows App      │─┘
│ Username: v12    │
│ Source: windows  │
└──────────────────┘

When message sent from Resume Practice:
1. Browser → Server (with clientId: v12)
2. Server broadcasts to ALL connections with clientId: v12
3. Message reaches BOTH browser and Windows app
4. Windows app speaks response with voice
```

---

## ⚠️ Critical Points

1. **SAME USERNAME** in browser and Windows app
2. **localhost:3000** URLs in Windows app (not Vercel)
3. **2 connections** for same clientId (1 web + 1 windows)
4. **Rebuild required** after changing MainWindow.xaml.cs URLs

---

## 📞 Quick Fixes

### "I don't see Windows app at all"
```powershell
cd "d:\Gemina_v2.2_production\windows app\TransparentOverlayApp\bin\Release\net8.0-windows\win-x64"
.\SRMV.exe
```
Wait for username prompt, enter "v12"

### "Windows app shows old Vercel URL in error"
```powershell
cd "d:\Gemina_v2.2_production\windows app\TransparentOverlayApp"
dotnet clean
dotnet build -c Release
.\bin\Release\net8.0-windows\win-x64\SRMV.exe
```

### "Only 1 connection showing in server logs"
- Windows app hasn't connected yet
- Check if username prompt is waiting
- Verify username is exactly "v12" in both places

---

**Last Updated**: Current troubleshooting session
**Status**: Awaiting Windows app connection with username "v12"
