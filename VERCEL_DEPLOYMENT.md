# 🚀 Vercel Deployment Guide

## 📋 Prerequisites

1. ✅ GitHub account
2. ✅ Vercel account (free tier available at https://vercel.com)
3. ✅ Git installed on your computer

---

## 🔧 Step 1: Prepare Your Code

### Files Created for Vercel:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ `.gitignore` - Files to exclude from Git

### What's Excluded:
- Windows app (not needed for web)
- node_modules (installed by Vercel)
- .env file (added separately in Vercel)
- Debug files

---

## 📦 Step 2: Create Git Repository

### Option A: New Repository (If you don't have Git setup)

```powershell
# Navigate to project directory
cd D:\Geminai

# Initialize Git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Chat application ready for Vercel"

# Create repository on GitHub (go to https://github.com/new)
# Then connect to GitHub:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Option B: Existing Repository

```powershell
cd D:\Geminai
git add .
git commit -m "Add Vercel configuration"
git push
```

---

## 🌐 Step 3: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Click "Sign Up" or "Login"
   - Connect your GitHub account

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select "Import Git Repository"
   - Choose your repository from the list
   - Click "Import"

3. **Configure Project:**
   - **Project Name:** `chat-app` (or your preferred name)
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave default)
   - **Build Command:** Leave empty (no build needed)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   Click "Environment Variables" section and add:

   | Name | Value |
   |------|-------|
   | `OPENROUTER_API_KEY` | `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` |
   | `OPENROUTER_MODEL` | `mistralai/mistral-7b-instruct` |
   | `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
   | `MAX_TOKENS` | `500` |
   | `TEMPERATURE` | `0.3` |

   **Important:** For each variable:
   - Click "Add" or "Add New"
   - Enter Name
   - Enter Value
   - Select "Production", "Preview", and "Development" (all three)
   - Click "Add"

5. **Deploy:**
   - Click "Deploy"
   - Wait 1-2 minutes for deployment
   - You'll get a URL like: `https://your-app.vercel.app`

### Method 2: Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
cd D:\Geminai
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? chat-app
# - In which directory is your code? ./
# - Want to override settings? No

# Add environment variables
vercel env add OPENROUTER_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development (all)

vercel env add OPENROUTER_MODEL
# Enter: mistralai/mistral-7b-instruct

vercel env add OPENROUTER_BASE_URL
# Enter: https://openrouter.ai/api/v1

vercel env add MAX_TOKENS
# Enter: 500

vercel env add TEMPERATURE
# Enter: 0.3

# Deploy to production
vercel --prod
```

---

## 🔐 Step 4: Environment Variables (Detailed)

### Adding in Vercel Dashboard:

1. Go to your project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in left sidebar
4. For each variable below, click "Add New":

#### Variable 1: OPENROUTER_API_KEY
```
Name: OPENROUTER_API_KEY
Value: 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
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2: OPENROUTER_MODEL
```
Name: OPENROUTER_MODEL
Value: mistralai/mistral-7b-instruct
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 3: OPENROUTER_BASE_URL
```
Name: OPENROUTER_BASE_URL
Value: https://openrouter.ai/api/v1
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 4: MAX_TOKENS
```
Name: MAX_TOKENS
Value: 500
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 5: TEMPERATURE
```
Name: TEMPERATURE
Value: 0.3
Environments: ✅ Production ✅ Preview ✅ Development
```

### Screenshot Guide:

```
┌─────────────────────────────────────────────┐
│ Environment Variables                       │
├─────────────────────────────────────────────┤
│                                             │
│ Name: [OPENROUTER_API_KEY              ]   │
│                                             │
│ Value: [sk-or-v1-a38666...             ]   │
│                                             │
│ Environments:                               │
│ ☑ Production  ☑ Preview  ☑ Development     │
│                                             │
│              [Add]                          │
└─────────────────────────────────────────────┘
```

---

## ✅ Step 5: Verify Deployment

### Test Your Deployed App:

1. **Open Your App:**
   - URL: `https://your-app.vercel.app`
   - Or use the URL shown in Vercel dashboard

2. **Test Chat Functionality:**
   ```
   Test 1: Ask "What is binary search?"
   Expected: Definition, steps, complexity
   
   Test 2: Ask "Write binary search code in Python"
   Expected: Complete code with comments
   ```

3. **Check Console:**
   - Press F12 in browser
   - Check Console tab for errors
   - Should see no errors

### Common URLs:
- **Production:** `https://your-app.vercel.app`
- **Preview (branch):** `https://your-app-git-branch.vercel.app`
- **Development:** Local testing

---

## 🔄 Step 6: Update and Redeploy

### Automatic Deployment (Recommended):
Every time you push to GitHub, Vercel automatically redeploys:

```powershell
cd D:\Geminai

# Make changes to your files
# Save your changes

# Commit and push
git add .
git commit -m "Updated chat logic"
git push

# Vercel automatically detects and deploys!
# Check your dashboard for deployment status
```

### Manual Deployment:
```powershell
# Using Vercel CLI
cd D:\Geminai
vercel --prod
```

---

## 📊 Vercel Dashboard Features

### Deployments Tab:
- See all deployments
- View deployment logs
- Rollback to previous versions

### Settings Tab:
- **General:** Project name, framework
- **Environment Variables:** Add/edit variables
- **Domains:** Add custom domain
- **Git:** Configure GitHub integration

### Analytics (Free Tier):
- Page views
- Response times
- Error tracking

---

## 🌍 Step 7: Custom Domain (Optional)

### Add Your Own Domain:

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `chat.yourdomain.com`
4. Vercel provides DNS instructions
5. Add DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: chat
   Value: cname.vercel-dns.com
   ```
6. Wait for DNS propagation (5-30 minutes)
7. Vercel auto-enables HTTPS

---

## ⚠️ Important Notes

### SSE (Server-Sent Events):
- ✅ SSE works on Vercel
- ✅ Windows app can connect to Vercel URL
- ⚠️ Vercel has 10-second function timeout on free tier
- ⚠️ SSE connections may reconnect frequently

### Solution for SSE on Vercel:
The app already has auto-reconnect logic (every 2 seconds), so it will handle Vercel's timeout gracefully.

### API Key Security:
- ✅ Never commit `.env` to Git
- ✅ Use Vercel Environment Variables
- ✅ API key is encrypted by Vercel
- ⚠️ Don't share your API key publicly

### Windows App with Vercel:
Update Windows app to use Vercel URL:

1. Open `MainWindow.xaml.cs`
2. Change URLs:
   ```csharp
   private readonly string _serverUrl = "https://your-app.vercel.app/events";
   private readonly string _chatApiUrl = "https://your-app.vercel.app/api/chat";
   ```
3. Rebuild Windows app

---

## 🐛 Troubleshooting

### Deployment Fails:

**Error:** "Build failed"
```powershell
# Check package.json is valid
npm install

# Test locally first
npm start
```

**Error:** "Environment variable not found"
- Go to Settings → Environment Variables
- Verify all 5 variables are added
- Click "Redeploy" after adding variables

### App Not Working:

**Problem:** Empty responses
- Check Vercel logs (Deployments → Latest → View Function Logs)
- Verify OPENROUTER_API_KEY is correct
- Check OpenRouter dashboard for API usage

**Problem:** 500 Error
- Check Function Logs in Vercel
- Verify all environment variables are set
- Check OpenRouter API is accessible

### SSE Not Working:

**Problem:** Windows app not connecting
- Update URLs to Vercel domain
- Check CORS is enabled (already done in server.js)
- Verify `/events` endpoint is accessible

---

## 📈 Monitoring

### Check Logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click latest deployment
5. Click "View Function Logs"

### Check Analytics:
1. Go to Analytics tab
2. View request counts
3. View response times
4. Check error rates

---

## 💰 Pricing

### Vercel Free Tier (Hobby):
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Serverless functions
- ⚠️ 10-second function timeout
- ⚠️ Fair use policy

### When to Upgrade:
- Need longer function timeouts
- Higher bandwidth needs
- Team collaboration
- Advanced analytics

---

## 🎯 Quick Start Checklist

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Sign up for Vercel
- [ ] Import repository to Vercel
- [ ] Add 5 environment variables
- [ ] Deploy
- [ ] Test at `https://your-app.vercel.app`
- [ ] Update Windows app URLs (optional)
- [ ] Share your app URL! 🎉

---

## 📞 Support

### Vercel Documentation:
- https://vercel.com/docs

### OpenRouter Documentation:
- https://openrouter.ai/docs

### Your App Status:
- Vercel Dashboard: https://vercel.com/dashboard
- Deployment URL: Will be provided after deployment

---

**Ready to Deploy!** 🚀

Follow the steps above and your chat application will be live on the internet in minutes!

**Estimated Time:** 10-15 minutes for first deployment
