# ⚡ Quick Deploy to Vercel - 5 Minutes

## 1️⃣ Push to GitHub (2 minutes)

```powershell
# Navigate to project
cd D:\Geminai

# Initialize Git (if not done)
git init
git add .
git commit -m "Ready for Vercel deployment"

# Create repo on GitHub: https://github.com/new
# Then connect:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 2️⃣ Deploy on Vercel (2 minutes)

1. **Go to:** https://vercel.com
2. **Login** with GitHub
3. **Click:** "Add New" → "Project"
4. **Select** your repository
5. **Click:** "Import"

## 3️⃣ Add Environment Variables (1 minute)

In Vercel project settings, add these 5 variables:

```
OPENROUTER_API_KEY = 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
OPENROUTER_MODEL = mistralai/mistral-7b-instruct
OPENROUTER_BASE_URL = https://openrouter.ai/api/v1
MAX_TOKENS = 500
TEMPERATURE = 0.3
```

**For each variable:**
- Click "Add New"
- Enter Name and Value
- Select ✅ Production ✅ Preview ✅ Development
- Click "Save"

## 4️⃣ Deploy!

- Click "Deploy"
- Wait 1-2 minutes
- Get your URL: `https://your-app.vercel.app`

## ✅ Done!

Your app is live! Test it at your Vercel URL.

---

## 🔄 Update Later

```powershell
# Make changes
git add .
git commit -m "Updated"
git push

# Vercel auto-deploys!
```

---

## 🪟 Update Windows App

Change URLs in `MainWindow.xaml.cs`:

```csharp
private readonly string _serverUrl = "https://your-app.vercel.app/events";
private readonly string _chatApiUrl = "https://your-app.vercel.app/api/chat";
```

**That's it!** 🚀
