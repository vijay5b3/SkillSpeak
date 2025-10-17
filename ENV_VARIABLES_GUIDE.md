# 🔐 Environment Variables for Vercel

## Complete List of Variables to Add

### 📋 Copy-Paste Ready Format

When adding to Vercel Dashboard, copy these exact values:

---

### ✅ Variable 1: OPENROUTER_API_KEY

**Name:**
```
OPENROUTER_API_KEY
```

**Value:**
```
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
```

**Environments:** Production, Preview, Development (all three)

---

### ✅ Variable 2: OPENROUTER_MODEL

**Name:**
```
OPENROUTER_MODEL
```

**Value:**
```
mistralai/mistral-7b-instruct
```

**Environments:** Production, Preview, Development (all three)

---

### ✅ Variable 3: OPENROUTER_BASE_URL

**Name:**
```
OPENROUTER_BASE_URL
```

**Value:**
```
https://openrouter.ai/api/v1
```

**Environments:** Production, Preview, Development (all three)

---

### ✅ Variable 4: MAX_TOKENS

**Name:**
```
MAX_TOKENS
```

**Value:**
```
500
```

**Environments:** Production, Preview, Development (all three)

---

### ✅ Variable 5: TEMPERATURE

**Name:**
```
TEMPERATURE
```

**Value:**
```
0.3
```

**Environments:** Production, Preview, Development (all three)

---

## 📝 How to Add in Vercel Dashboard

### Step-by-Step:

1. **Go to your Vercel project page**
   - https://vercel.com/dashboard

2. **Click on your project**

3. **Click "Settings" tab at the top**

4. **Click "Environment Variables" in the left sidebar**

5. **For EACH variable above:**

   a. **Click "Add New" button**
   
   b. **Fill in the form:**
      ```
      ┌─────────────────────────────────────┐
      │ Name:  [OPENROUTER_API_KEY     ]   │
      │                                     │
      │ Value: [sk-or-v1-a38666...     ]   │
      │        (Automatically Encrypted)    │
      │                                     │
      │ Environments:                       │
      │ ☑ Production                        │
      │ ☑ Preview                           │
      │ ☑ Development                       │
      │                                     │
      │         [Cancel]    [Save]          │
      └─────────────────────────────────────┘
      ```
   
   c. **Click "Save"**
   
   d. **Repeat for all 5 variables**

6. **After adding all variables, click "Redeploy"**
   - Go to "Deployments" tab
   - Click on the latest deployment
   - Click "..." menu → "Redeploy"

---

## 🔍 Verify Variables Are Set

### Method 1: Vercel Dashboard

1. Go to Settings → Environment Variables
2. You should see all 5 variables listed:
   ```
   ✅ OPENROUTER_API_KEY        Production, Preview, Development
   ✅ OPENROUTER_MODEL          Production, Preview, Development
   ✅ OPENROUTER_BASE_URL       Production, Preview, Development
   ✅ MAX_TOKENS                Production, Preview, Development
   ✅ TEMPERATURE               Production, Preview, Development
   ```

### Method 2: Deployment Logs

1. Go to Deployments tab
2. Click latest deployment
3. Click "View Function Logs"
4. Check for "Server listening" message (means variables loaded)

---

## 🚨 Important Security Notes

### ✅ DO:
- Add variables in Vercel dashboard (encrypted)
- Use different API keys for production/development
- Rotate API keys periodically
- Check OpenRouter usage dashboard

### ❌ DON'T:
- Commit `.env` file to Git (already in .gitignore)
- Share your API key publicly
- Hardcode API keys in code
- Expose API key in client-side code

---

## 🔧 Using Vercel CLI (Alternative Method)

If you prefer command line:

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link to project (after first deployment)
cd D:\Geminai
vercel link

# Add each variable
vercel env add OPENROUTER_API_KEY production
# Paste: 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

vercel env add OPENROUTER_MODEL production
# Enter: mistralai/mistral-7b-instruct

vercel env add OPENROUTER_BASE_URL production
# Enter: https://openrouter.ai/api/v1

vercel env add MAX_TOKENS production
# Enter: 500

vercel env add TEMPERATURE production
# Enter: 0.3

# Repeat for 'preview' and 'development' environments
vercel env add OPENROUTER_API_KEY preview
# ... etc

# Redeploy
vercel --prod
```

---

## 📊 Quick Reference Table

| Variable Name | Value | Required | Default |
|--------------|-------|----------|---------|
| OPENROUTER_API_KEY | Your API key | ✅ Yes | None |
| OPENROUTER_MODEL | mistralai/mistral-7b-instruct | ✅ Yes | None |
| OPENROUTER_BASE_URL | https://openrouter.ai/api/v1 | ⚠️ Optional | https://openrouter.ai/api/v1 |
| MAX_TOKENS | 500 | ⚠️ Optional | 120 |
| TEMPERATURE | 0.3 | ⚠️ Optional | 0.0 |

**Notes:**
- ✅ Required: App won't work without it
- ⚠️ Optional: App uses default if not set
- We recommend setting ALL variables for consistency

---

## 🔄 Update Environment Variables

### To Change a Variable:

1. Go to Settings → Environment Variables
2. Find the variable you want to change
3. Click "..." menu → "Edit"
4. Enter new value
5. Click "Save"
6. Go to Deployments → Click "..." → "Redeploy"

### To Delete a Variable:

1. Go to Settings → Environment Variables
2. Find the variable
3. Click "..." menu → "Remove"
4. Confirm deletion

---

## 🧪 Test Environment Variables

After deploying, test if variables are working:

### Test 1: Check API Connection
```
1. Open your Vercel app URL
2. Ask: "What is binary search?"
3. If you get a response → Variables are working! ✅
4. If you get an error → Check logs and variables
```

### Test 2: Check Logs
```
1. Go to Vercel Deployments
2. Click latest deployment
3. Click "View Function Logs"
4. Look for: "Server listening on..."
5. Should see no errors about missing env vars
```

---

## 💡 Pro Tips

### Tip 1: Different Keys for Different Environments
```
Production:  Use main API key (your-api-key-prod)
Preview:     Use testing API key (your-api-key-test)
Development: Use development API key (your-api-key-dev)
```

### Tip 2: Use Vercel's Built-in Variables
These are automatically available:
- `VERCEL`: Always "1" when running on Vercel
- `VERCEL_ENV`: "production", "preview", or "development"
- `VERCEL_URL`: Your deployment URL

### Tip 3: Check Variable Usage
Monitor your OpenRouter usage at:
https://openrouter.ai/credits

---

## 🆘 Troubleshooting

### Problem: "Environment variable not found"

**Solution:**
1. Go to Settings → Environment Variables
2. Check all 5 variables are present
3. Verify spelling is exact (case-sensitive)
4. Click "Redeploy" after adding/editing

### Problem: "Invalid API key"

**Solution:**
1. Check OPENROUTER_API_KEY value is correct
2. No extra spaces at beginning/end
3. Verify API key at https://openrouter.ai/keys
4. Try regenerating API key if needed

### Problem: Variables not updating

**Solution:**
1. After changing variables, must redeploy
2. Go to Deployments tab
3. Click "..." on latest deployment
4. Click "Redeploy"
5. Wait for deployment to complete

---

## ✅ Checklist: Environment Variables Setup

Before going live, verify:

- [ ] All 5 variables added to Vercel
- [ ] Each variable has all 3 environments (Production, Preview, Development)
- [ ] Variable names are spelled exactly as shown (case-sensitive)
- [ ] No extra spaces in values
- [ ] Redeployed after adding variables
- [ ] Tested app with a sample question
- [ ] Checked function logs for errors
- [ ] Verified OpenRouter API key is active

**All checked?** Your app is ready! 🚀

---

## 📞 Need Help?

- **Vercel Env Vars Docs:** https://vercel.com/docs/concepts/projects/environment-variables
- **OpenRouter API Docs:** https://openrouter.ai/docs
- **Check Vercel Logs:** Dashboard → Deployments → View Function Logs
