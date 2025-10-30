# Quick Deployment Script for Glomo Shop

## Step 1: Configure Git (First Time Only)
```powershell
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

## Step 2: Complete the Commit
```powershell
cd "c:\Users\abdos\Desktop\Abdesadek 3\nextjs-supabase-app"
git commit -m "Initial commit - Glomo Shop ready for deployment"
```

## Step 3: Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `glomo-shop`
3. **Important:** Do NOT initialize with README
4. Set to Private or Public
5. Click "Create repository"

## Step 4: Push to GitHub
Copy the commands GitHub shows you, or use these:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/glomo-shop.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy to Vercel
1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Select `glomo-shop` repository
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://hlanyjxswfknujqrlsxl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
6. Click "Deploy"

## Step 6: Add Custom Domain
1. In Vercel → Settings → Domains
2. Add: `glomo.shop`
3. Add: `www.glomo.shop`

## Step 7: Configure DNS
At your domain registrar (where you bought glomo.shop):

### Option A: A Record (Recommended)
```
Type: A
Name: @
Value: 76.76.21.21
```

### Option B: CNAME for www
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Step 8: Update Supabase
Go to Supabase → Authentication → URL Configuration:
- Site URL: `https://glomo.shop`
- Redirect URLs: `https://glomo.shop/**`

---

## 🎉 Done!
Your site will be live at: **https://glomo.shop**

See DEPLOYMENT.md for detailed instructions.
