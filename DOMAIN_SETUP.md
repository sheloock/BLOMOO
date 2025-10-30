# Domain Setup Guide for glomo.shop

## Overview
This guide will help you connect your **glomo.shop** domain to your Vercel deployment.

---

## Prerequisites
- ✅ Domain purchased: **glomo.shop**
- ✅ Website deployed on Vercel
- 🔑 Access to your domain registrar (where you bought glomo.shop)

---

## Step 1: Deploy to Vercel First

Before configuring the domain, make sure your site is deployed:

1. Go to **https://vercel.com**
2. Sign in with GitHub (sheloock account)
3. Import **BLOMOO** repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**
6. Wait for deployment to complete
7. Copy your Vercel URL (e.g., `blomoo-xxx.vercel.app`)

---

## Step 2: Add Domain in Vercel

1. In Vercel dashboard, go to your **BLOMOO** project
2. Click **"Settings"** → **"Domains"**
3. In the "Add Domain" field, type: `glomo.shop`
4. Click **"Add"**
5. Also add: `www.glomo.shop`
6. Click **"Add"**

Vercel will show you DNS configuration instructions.

---

## Step 3: Configure DNS at Your Domain Registrar

You need to update DNS records where you purchased **glomo.shop**.

### Find Your Domain Registrar
Common registrars in Morocco:
- **OVH** (https://www.ovhcloud.com)
- **Hostinger** (https://www.hostinger.com)
- **Namecheap** (https://www.namecheap.com)
- **GoDaddy** (https://www.godaddy.com)
- **Google Domains** (https://domains.google)

### Login to Your Registrar
1. Go to your domain registrar's website
2. Sign in to your account
3. Find **DNS Management** or **DNS Settings** for glomo.shop

---

## Step 4: Add DNS Records

Add these DNS records in your registrar's DNS management panel:

### Record 1: Root Domain (glomo.shop)
```
Type:     A
Name:     @  (or leave blank, or "glomo.shop")
Value:    76.76.21.21
TTL:      3600 (or Auto)
```

### Record 2: WWW Subdomain (www.glomo.shop)
```
Type:     CNAME
Name:     www
Value:    cname.vercel-dns.com
TTL:      3600 (or Auto)
```

### Visual Example:
```
┌──────────┬──────────┬─────────────────────────┬──────┐
│ Type     │ Name     │ Value                   │ TTL  │
├──────────┼──────────┼─────────────────────────┼──────┤
│ A        │ @        │ 76.76.21.21            │ 3600 │
│ CNAME    │ www      │ cname.vercel-dns.com   │ 3600 │
└──────────┴──────────┴─────────────────────────┴──────┘
```

---

## Step 5: Wait for DNS Propagation

DNS changes can take time to propagate:
- **Minimum:** 5-15 minutes
- **Average:** 1-6 hours
- **Maximum:** 24-48 hours (rare)

### Check DNS Propagation Status
Use these tools to verify:
1. **https://dnschecker.org**
   - Enter: `glomo.shop`
   - Select: `A` record
   - Should show: `76.76.21.21`

2. **https://whatsmydns.net**
   - Enter: `www.glomo.shop`
   - Select: `CNAME` record
   - Should show: `cname.vercel-dns.com`

---

## Step 6: Verify in Vercel

1. Go back to Vercel → **Settings** → **Domains**
2. You should see:
   ```
   ✅ glomo.shop - Valid Configuration
   ✅ www.glomo.shop - Valid Configuration
   ```
3. If you see "Invalid Configuration", wait for DNS propagation

---

## Step 7: Test Your Domain

Once DNS is propagated and Vercel shows valid configuration:

1. Open browser and go to: **https://glomo.shop**
2. It should load your Glomo Shop website!
3. Test these URLs:
   - ✅ https://glomo.shop
   - ✅ https://www.glomo.shop
   - ✅ https://glomo.shop/admin
   - ✅ https://glomo.shop/cart

---

## Step 8: Update Supabase URLs

Now that your domain is live, update Supabase:

1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add these URLs to **Redirect URLs**:
   ```
   https://glomo.shop/**
   https://www.glomo.shop/**
   ```
5. Click **Save**

---

## Common Issues & Solutions

### Issue 1: "Domain is already in use"
**Solution:** The domain might be connected to another Vercel project.
- Go to Vercel → All Projects
- Check if glomo.shop is used elsewhere
- Remove it from the old project first

### Issue 2: "Invalid Configuration" in Vercel
**Solution:** DNS records not propagated yet.
- Wait 15-30 minutes
- Verify DNS records in your registrar
- Check propagation status at dnschecker.org
- Make sure you added BOTH A and CNAME records

### Issue 3: Website shows "404 Not Found"
**Solution:** 
- Verify deployment is successful in Vercel
- Check that environment variables are added
- Try rebuilding the deployment

### Issue 4: "NET::ERR_CERT_AUTHORITY_INVALID"
**Solution:** SSL certificate is being generated.
- Wait 5-10 minutes for Vercel to generate SSL
- Vercel provides free SSL automatically
- Clear browser cache and try again

### Issue 5: www.glomo.shop doesn't redirect to glomo.shop
**Solution:**
- In Vercel → Settings → Domains
- Find www.glomo.shop
- Click "Edit" → Set redirect to glomo.shop

---

## DNS Configuration by Popular Registrars

### OVH (ovhcloud.com)
1. Dashboard → Domain names
2. Click glomo.shop → DNS zone
3. Click "Add an entry"
4. Add A and CNAME records

### Hostinger
1. Dashboard → Domains
2. Click glomo.shop → DNS / Name Servers
3. Click "Manage" → Add records

### Namecheap
1. Dashboard → Domain List
2. Click "Manage" next to glomo.shop
3. Advanced DNS → Add records

### GoDaddy
1. My Products → Domains
2. Click glomo.shop → Manage DNS
3. Add records in DNS Management

---

## Final Checklist

After completing all steps:

- [ ] Website deployed on Vercel
- [ ] DNS A record added (@ → 76.76.21.21)
- [ ] DNS CNAME record added (www → cname.vercel-dns.com)
- [ ] DNS propagation complete (checked on dnschecker.org)
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] https://glomo.shop loads successfully
- [ ] https://www.glomo.shop loads successfully
- [ ] SSL certificate is active (shows padlock 🔒)
- [ ] Supabase redirect URLs updated
- [ ] Admin panel accessible at https://glomo.shop/admin

---

## Support

If you need help:
1. Check Vercel documentation: https://vercel.com/docs/concepts/projects/domains
2. Contact your domain registrar's support
3. Vercel support: https://vercel.com/support

---

## Estimated Timeline

| Task | Time |
|------|------|
| Deploy to Vercel | 2-3 minutes |
| Add domain in Vercel | 1 minute |
| Configure DNS records | 5 minutes |
| DNS propagation | 15 min - 24 hours |
| SSL certificate generation | 5-10 minutes |
| **Total** | **30 min - 24 hours** |

Most domains work within 30 minutes to 2 hours! 🚀
