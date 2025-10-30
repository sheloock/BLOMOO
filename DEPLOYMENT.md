# Deployment Guide for Glomo Shop

## 🚀 Deploy to Vercel with Custom Domain

### Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Your domain: glomo.shop
- Supabase project credentials

---

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository
```bash
cd "c:\Users\abdos\Desktop\Abdesadek 3\nextjs-supabase-app"
git init
git add .
git commit -m "Initial commit - Glomo Shop ready for deployment"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `glomo-shop` (or any name you prefer)
3. Set to Private or Public
4. DO NOT initialize with README (we already have code)
5. Click "Create repository"

### 1.3 Push Code
```bash
git remote add origin https://github.com/YOUR_USERNAME/glomo-shop.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Connect to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your repositories

### 2.2 Import Project
1. Click "Add New..." → "Project"
2. Find and select your `glomo-shop` repository
3. Click "Import"

### 2.3 Configure Project
**Framework Preset:** Next.js (auto-detected)

**Environment Variables** - Add these:
```
NEXT_PUBLIC_SUPABASE_URL=https://hlanyjxswfknujqrlsxl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
NEXT_PUBLIC_SITE_NAME=Glomo Shop
NEXT_PUBLIC_SITE_DESCRIPTION=Premium Quality Products & Fast Delivery
```

**Build Settings:**
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

4. Click "Deploy"

### 2.4 Wait for Deployment
- First deployment takes 2-3 minutes
- You'll get a URL like: `https://glomo-shop.vercel.app`

---

## Step 3: Connect Custom Domain (glomo.shop)

### 3.1 Add Domain in Vercel
1. Go to your project in Vercel
2. Click "Settings" → "Domains"
3. Enter: `glomo.shop`
4. Click "Add"
5. Also add: `www.glomo.shop`

### 3.2 Configure DNS Records
Go to your domain registrar (where you bought glomo.shop) and add these DNS records:

**For glomo.shop (apex domain):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`
- TTL: `Auto` or `3600`

**For www.glomo.shop:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`
- TTL: `Auto` or `3600`

**OR use Nameservers (Recommended):**
If your registrar supports it, point nameservers to:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### 3.3 Wait for DNS Propagation
- Can take 5 minutes to 48 hours (usually 10-30 minutes)
- Check status at: https://www.whatsmydns.net/#A/glomo.shop

---

## Step 4: Update Supabase Configuration

### 4.1 Add Production URLs
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**

### 4.2 Configure Authentication URLs
Go to **Authentication** → **URL Configuration**:

**Site URL:**
```
https://glomo.shop
```

**Redirect URLs:** (add all of these)
```
https://glomo.shop/**
https://www.glomo.shop/**
https://glomo-shop.vercel.app/**
http://localhost:3000/**
```

### 4.3 Configure Storage CORS
Go to **Storage** → **Policies**:

Make sure your `product-images` bucket allows public access:
```sql
-- Already configured in your schema.sql
-- Verify in Supabase Dashboard → Storage → product-images → Policies
```

---

## Step 5: Test Your Deployment

### 5.1 Test All Features
Visit https://glomo.shop and test:
- ✅ Homepage loads with products
- ✅ Product images display correctly
- ✅ Add to cart works
- ✅ Checkout process completes
- ✅ Orders appear in admin dashboard
- ✅ Admin login works (`/admin/login`)

### 5.2 Admin Access
```
URL: https://glomo.shop/admin/login
Email: Your Supabase admin email
Password: Your Supabase admin password
```

---

## Step 6: SSL Certificate (Automatic)

Vercel automatically provides SSL certificates:
- ✅ Free SSL/TLS (Let's Encrypt)
- ✅ Auto-renewal
- ✅ HTTPS redirect enabled by default

Your site will be accessible via:
- https://glomo.shop ✅
- https://www.glomo.shop ✅

---

## Common Issues & Solutions

### Issue: "Domain not verified"
**Solution:** Wait for DNS propagation (10-30 minutes)

### Issue: "Invalid custom domain"
**Solution:** Check DNS records are correct at your registrar

### Issue: Images not loading
**Solution:** 
1. Check Supabase Storage policies
2. Verify bucket is public
3. Check CORS settings

### Issue: "Build failed"
**Solution:**
1. Check environment variables in Vercel
2. Run `npm run build` locally first
3. Check build logs in Vercel

### Issue: Admin login not working
**Solution:**
1. Verify Supabase URL in environment variables
2. Check authentication redirect URLs in Supabase

---

## Updating Your Site

After deployment, to update your site:

```bash
# Make changes to your code
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your changes
3. Deploy to production
4. Update https://glomo.shop

---

## Performance Tips

### Enable Vercel Analytics (Optional)
1. Go to Vercel Dashboard → Your Project
2. Click "Analytics"
3. Enable Web Analytics (free)

### Image Optimization
- Vercel automatically optimizes images
- Use Next.js Image component when possible

### Caching
- Vercel provides edge caching automatically
- Your site loads fast worldwide

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

## Your Production URLs

After deployment:
- 🌐 Main Site: https://glomo.shop
- 🌐 WWW: https://www.glomo.shop
- 🔐 Admin: https://glomo.shop/admin/login
- 📊 Vercel Dashboard: https://vercel.com/dashboard

---

**🎉 Your Glomo Shop will be live at glomo.shop!**
