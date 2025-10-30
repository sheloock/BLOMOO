# 🚀 Push Glomo Shop to GitHub - Step by Step

## Prerequisites ✅
- GitHub account open in browser
- Terminal/PowerShell ready

---

## Step 1: Configure Git Identity

In PowerShell, run these commands (replace with client's info):

```powershell
git config --global user.email "client-email@example.com"
git config --global user.name "Client Name"
```

**Example:**
```powershell
git config --global user.email "glomo@glomo.shop"
git config --global user.name "Glomo Shop"
```

---

## Step 2: Create GitHub Repository

### 2.1 In Browser (GitHub Account Open)
1. Click the **"+"** icon in top right corner
2. Select **"New repository"**
   
   OR go directly to: https://github.com/new

### 2.2 Fill Repository Details
- **Repository name:** `glomo-shop` (or any name you prefer)
- **Description:** "Glomo Shop - E-commerce platform"
- **Visibility:** Choose **Private** (recommended) or Public
- ⚠️ **IMPORTANT:** Do NOT check these boxes:
  - ❌ Add a README file
  - ❌ Add .gitignore
  - ❌ Choose a license
- Click **"Create repository"** button

### 2.3 Copy Repository URL
After creation, you'll see a page with setup instructions.
Copy the repository URL that looks like:
```
https://github.com/USERNAME/glomo-shop.git
```

---

## Step 3: Complete Git Commit

In PowerShell:

```powershell
cd "c:\Users\abdos\Desktop\Abdesadek 3\nextjs-supabase-app"
git commit -m "Initial commit - Glomo Shop ready for deployment"
```

**Expected output:**
```
[main (root-commit) abc1234] Initial commit - Glomo Shop ready for deployment
 XX files changed, XXXX insertions(+)
 create mode 100644 ...
```

---

## Step 4: Connect to GitHub Repository

Replace `USERNAME` with the actual GitHub username:

```powershell
git remote add origin https://github.com/USERNAME/glomo-shop.git
```

**Example:**
```powershell
git remote add origin https://github.com/glomo-official/glomo-shop.git
```

---

## Step 5: Rename Branch to 'main'

```powershell
git branch -M main
```

---

## Step 6: Push Code to GitHub

```powershell
git push -u origin main
```

### 6.1 Authentication Required
You'll be prompted for credentials:

**Option A: GitHub CLI (if installed)**
- Follow the authentication prompts

**Option B: Personal Access Token (Recommended)**
1. GitHub will show a prompt
2. Click "Generate Token" or go to: https://github.com/settings/tokens
3. Click **"Generate new token"** → **"Generate new token (classic)"**
4. Settings:
   - Note: "Glomo Shop Deployment"
   - Expiration: 90 days (or custom)
   - Scopes: Check **"repo"** (full control)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Paste token when prompted for password

**Option C: GitHub Desktop (Easiest)**
- If authentication fails, download GitHub Desktop: https://desktop.github.com
- Sign in with GitHub account
- Push from there

---

## Step 7: Verify Upload

### 7.1 Check in Browser
Go to: `https://github.com/USERNAME/glomo-shop`

You should see:
- ✅ All your files
- ✅ Green "Code" button
- ✅ Recent commit message
- ✅ File count and commit history

### 7.2 Expected Files
```
📁 glomo-shop/
  📁 .github/
  📁 public/
    - favicon.ico
    - favicon.png
    - logo.png
  📁 src/
    📁 app/
    📁 components/
    📁 lib/
    📁 types/
  📁 supabase/
  📄 package.json
  📄 next.config.ts
  📄 tsconfig.json
  📄 DEPLOYMENT.md
  📄 README.md
  ... and more
```

---

## 🎉 Success!

Your code is now on GitHub! 

**Next Step:** Deploy to Vercel

---

## Troubleshooting

### Problem: "Authentication failed"
**Solution 1:** Use Personal Access Token
- Go to: https://github.com/settings/tokens
- Generate token with "repo" scope
- Use token as password

**Solution 2:** Use GitHub Desktop
- Download: https://desktop.github.com
- Sign in and push from GUI

### Problem: "Repository already exists"
**Solution:** Use a different name or delete the existing repo

### Problem: "Permission denied"
**Solution:** Make sure you're logged into the correct GitHub account

### Problem: "Failed to push some refs"
**Solution:** 
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## Quick Command Summary

```powershell
# 1. Configure git
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# 2. Commit
cd "c:\Users\abdos\Desktop\Abdesadek 3\nextjs-supabase-app"
git commit -m "Initial commit - Glomo Shop ready for deployment"

# 3. Add remote (replace USERNAME)
git remote add origin https://github.com/USERNAME/glomo-shop.git

# 4. Push
git branch -M main
git push -u origin main
```

---

## What's Next?

Once code is on GitHub:
1. ✅ **Deploy to Vercel** (see DEPLOYMENT.md)
2. ✅ **Add glomo.shop domain**
3. ✅ **Configure Supabase production URLs**

---

**Need help?** Check DEPLOYMENT.md for the full deployment guide!
