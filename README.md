# 🎯 SRMV Chat Application

> AI-powered technical interview assistant with web interface and Windows overlay app

## 🌟 Features

- ✅ **Web Chat Interface** - Clean, modern chat UI
- ✅ **Voice Input** - Ask questions using your microphone
- ✅ **Windows Overlay App (SRMV)** - Screen-share-safe transparent overlay
- ✅ **Technical Interview Focus** - Optimized for coding interviews
- ✅ **Complete Code Examples** - Get full implementations with comments
- ✅ **Complexity Analysis** - Time and space complexity for algorithms
- ✅ **Real-time Sync** - Messages sync between web and Windows app

## 🚀 Quick Start

### Local Development

```powershell
# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env with your OpenRouter API key
# Get one at: https://openrouter.ai/keys

# Start server
npm start

# Open browser
http://localhost:3000
```

### Deploy to Vercel

```powershell
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# Deploy on Vercel
# 1. Go to https://vercel.com
# 2. Import your repository
# 3. Add environment variables (see ENV_VARIABLES_GUIDE.md)
# 4. Deploy!
```

📖 **Full deployment guide:** See `VERCEL_DEPLOYMENT.md`

## 📋 Environment Variables

Required for both local and Vercel deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | AI model to use | `mistralai/mistral-7b-instruct` |
| `OPENROUTER_BASE_URL` | API endpoint | `https://openrouter.ai/api/v1` |
| `MAX_TOKENS` | Max response length | `500` |
| `TEMPERATURE` | Response creativity | `0.3` |

📖 **Detailed guide:** See `ENV_VARIABLES_GUIDE.md`

## 🖥️ Windows App (SRMV)

### Features:
- 🎯 Always-on-top overlay
- 👻 Transparent mode (F2)
- 🚫 Hidden from screen captures (Zoom, Teams, OBS)
- 📝 Direct message input
- 🔄 Auto-reconnect to server
- 📏 Resizable window

### Standalone Executable:
- **Location:** `SRMV-Standalone/SRMV.exe`
- **Size:** 72 MB (includes .NET 8.0 runtime)
- **No installation required** - Just run the EXE

### Configuration:
To connect to Vercel instead of localhost, edit `MainWindow.xaml.cs`:

```csharp
private readonly string _serverUrl = "https://your-app.vercel.app/events";
private readonly string _chatApiUrl = "https://your-app.vercel.app/api/chat";
```

## 📂 Project Structure

```
D:\Geminai\
├── public/                    # Web interface
│   ├── index.html            # Chat UI
│   └── app.js                # Frontend logic
├── windows app/              # Windows overlay source
│   └── TransparentOverlayApp/
├── SRMV-Standalone/          # Compiled Windows app
│   └── SRMV.exe              # Ready to run
├── server.js                 # Express backend
├── package.json              # Dependencies
├── .env                      # Environment variables (local)
├── .env.example              # Template
├── vercel.json               # Vercel configuration
├── .gitignore                # Git exclusions
├── .vercelignore             # Vercel exclusions
│
├── VERCEL_DEPLOYMENT.md      # Full deployment guide
├── QUICK_DEPLOY.md           # 5-minute quick start
├── ENV_VARIABLES_GUIDE.md    # Environment variables reference
├── DEPLOYMENT_CHECKLIST.md   # Step-by-step checklist
├── FIXES.md                  # Recent bug fixes
├── SOLUTION_SUMMARY.md       # Technical documentation
└── QUICK_FIX_REFERENCE.md    # Quick reference
```

## 🎨 How It Works

### Architecture

```
┌──────────────────┐
│   Web Browser    │  ← User asks questions
│  (React-like UI) │  ← Voice input supported
└────────┬─────────┘
         │
         │ HTTP POST /api/chat
         │
         ▼
┌──────────────────┐
│  Express Server  │  ← Proxies to OpenRouter
│   (server.js)    │  ← Broadcasts via SSE
└────────┬─────────┘
         │
         ├─────────────┬──────────────┐
         │             │              │
         ▼             ▼              ▼
   OpenRouter API   SSE /events   Direct API
         │             │              │
         │             ▼              │
         │     ┌──────────────┐      │
         │     │ Windows App  │      │
         │     │   (SRMV)     │◄─────┘
         │     └──────────────┘
         │
         └─── AI Response
```

### Request Flow

1. **User asks question** (web or Windows app)
2. **Send to /api/chat** with conversation history
3. **Server forwards to OpenRouter API**
4. **OpenRouter processes with AI model**
5. **Server receives response**
6. **Server broadcasts via SSE** (for Windows app)
7. **Display response** in both interfaces

## 🧪 Testing

### Test Explanation:
```
Ask: "What is binary search?"

Expected Response:
[Binary Search]
Definition: Search algorithm that finds target in sorted array by dividing search interval in half.

How it works:
- Compare target with middle element
- If equal, return position
- If smaller, search left half
- If larger, search right half

Time Complexity: O(log n)
Space Complexity: O(1) iterative
```

### Test Code Request:
```
Ask: "Write binary search code in Python"

Expected Response:
[Binary Search - Implementation]

Main Logic:
```python
def binary_search(arr, target):
    # Step 1: Initialize pointers
    left, right = 0, len(arr) - 1
    
    # Step 2: Search until pointers meet
    while left <= right:
        mid = (left + right) // 2
        
        # Step 3: Compare and adjust
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    # Step 4: Not found
    return -1
```

Time Complexity: O(log n)
Space Complexity: O(1)
```

## 🔧 Troubleshooting

### Web Chat

**Problem:** Duplicate responses
- ✅ Fixed: SSE disabled for web UI

**Problem:** Incomplete responses
- ✅ Fixed: MAX_TOKENS increased to 500

**Problem:** Wrong format
- ✅ Fixed: System prompt aligned with Windows app

### Windows App

**Problem:** Not connecting to server
- Check server is running (npm start)
- Verify URLs in MainWindow.xaml.cs
- Check auto-reconnect every 2 seconds

**Problem:** Messages not appearing
- Check SSE endpoint: http://localhost:3000/events
- Verify server logs show "SSE client connected"
- Restart Windows app

### Vercel Deployment

**Problem:** Build fails
- Check package.json is valid
- Test locally first: npm start
- Check Vercel build logs

**Problem:** Environment variables not working
- Verify all 5 variables added in Vercel dashboard
- Check spelling (case-sensitive)
- Redeploy after adding variables

## 📊 API Usage

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web chat interface |
| `/api/chat` | POST | Send message, get AI response |
| `/events` | GET | SSE stream (for Windows app) |

### Rate Limits

- **OpenRouter Free Tier:** Check https://openrouter.ai/docs
- **Vercel Free Tier:** 100GB bandwidth/month
- **Fair Use:** Recommended for personal/educational use

## 🛡️ Security

### Best Practices:
- ✅ API key stored in environment variables (encrypted)
- ✅ `.env` in `.gitignore` (never committed)
- ✅ HTTPS enabled on Vercel (automatic)
- ✅ CORS configured properly
- ✅ No secrets in client-side code

### Recommendations:
- 🔐 Rotate API keys periodically
- 📊 Monitor OpenRouter usage dashboard
- 🚨 Set up usage alerts
- 🔒 Use different API keys for dev/prod

## 📈 Monitoring

### Vercel Analytics (Free):
- Page views
- Response times
- Error rates
- Geographic distribution

### OpenRouter Dashboard:
- API usage
- Token consumption
- Cost tracking
- Rate limit status

**Access:** https://openrouter.ai/activity

## 🔄 Updates & Maintenance

### Update Code:
```powershell
# Make changes
git add .
git commit -m "Description of changes"
git push

# Vercel auto-deploys!
```

### Update Dependencies:
```powershell
npm update
npm audit fix
```

### Rebuild Windows App:
```powershell
cd "windows app\TransparentOverlayApp"
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

## 🎓 Learn More

### Documentation:
- 📘 Vercel Deployment: `VERCEL_DEPLOYMENT.md`
- 📗 Quick Deploy: `QUICK_DEPLOY.md`
- 📙 Environment Variables: `ENV_VARIABLES_GUIDE.md`
- 📕 Deployment Checklist: `DEPLOYMENT_CHECKLIST.md`

### External Resources:
- **Vercel Docs:** https://vercel.com/docs
- **OpenRouter Docs:** https://openrouter.ai/docs
- **Express.js:** https://expressjs.com
- **WPF (.NET):** https://docs.microsoft.com/dotnet/desktop/wpf

## 🤝 Contributing

### Report Issues:
1. Check existing documentation
2. Test locally first
3. Include error messages and logs
4. Specify: local vs Vercel deployment

### Suggest Features:
- Web UI improvements
- Windows app enhancements
- New AI models support
- Additional platforms (Linux, macOS)

## 📝 License

MIT License - Free to use, modify, and distribute

## 🙏 Credits

### Technologies:
- **Backend:** Node.js + Express
- **Frontend:** Vanilla JavaScript
- **Windows App:** WPF (.NET 8.0)
- **AI:** OpenRouter API (Mistral 7B)
- **Hosting:** Vercel
- **Voice Input:** Web Speech API

### Special Thanks:
- OpenRouter for AI API access
- Vercel for free hosting
- Microsoft for .NET framework

## 📞 Support

### Issues?
1. Check documentation in this repository
2. Review Vercel function logs
3. Check OpenRouter dashboard
4. Verify environment variables

### Quick Links:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **OpenRouter Dashboard:** https://openrouter.ai/activity
- **Documentation:** See README files in project

---

## 🚀 Get Started Now!

### Local Development:
```powershell
npm install
npm start
# Open http://localhost:3000
```

### Deploy to Vercel:
See `QUICK_DEPLOY.md` for 5-minute deployment guide!

### Windows App:
Run `SRMV-Standalone\SRMV.exe` - No installation needed!

---

**Version:** 1.3.0  
**Last Updated:** October 17, 2025  
**Status:** Production Ready ✅

**Live Demo:** Deploy to Vercel to get your own URL!

---

Made with ❤️ for technical interview preparation
