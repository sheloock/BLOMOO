# Supabase Database Setup Guide

## Step 1: Access Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Sign in to your account
3. Select your project: **hlanyjxswfknujqrlsxl**

---

## Step 2: Run Database Schema

### Option A: Using SQL Editor (Recommended)
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"**
3. Copy the entire content from `supabase/schema.sql` file
4. Paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for success message: "Success. No rows returned"

### Option B: Using Database Migrations
1. In the left sidebar, click **"Database"** → **"Migrations"**
2. Click **"Create a new migration"**
3. Name it: `initial_schema`
4. Paste the content from `supabase/schema.sql`
5. Click **"Run migration"**

---

## Step 3: Enable Realtime (Optional - for live notifications)

1. Go to **"Database"** → **"Replication"**
2. Find these tables and toggle **"Realtime"** ON:
   - ✅ `orders`
   - ✅ `order_items`
   - ✅ `products`
   - ✅ `categories`

---

## Step 4: Verify Storage Bucket

1. In the left sidebar, click **"Storage"**
2. You should see a bucket named **"product-images"**
3. If it doesn't exist:
   - Click **"Create bucket"**
   - Name: `product-images`
   - Make it **Public** ✅
   - Click **"Create bucket"**

---

## Step 5: Configure Authentication Settings

1. In the left sidebar, click **"Authentication"** → **"URL Configuration"**
2. Add these URLs under **"Redirect URLs"**:
   ```
   http://localhost:3000/**
   https://glomo.shop/**
   https://www.glomo.shop/**
   https://*.vercel.app/**
   ```
3. Click **"Save"**

---

## Step 6: Update CORS Settings (for Storage)

1. Go to **"Storage"** → **"Policies"**
2. Make sure these policies exist for `product-images` bucket:
   - ✅ Public can view product images
   - ✅ Authenticated users can upload product images
   - ✅ Authenticated users can update product images
   - ✅ Authenticated users can delete product images

If not, they will be created automatically when you run the schema.

---

## Step 7: Get Your API Credentials

1. In the left sidebar, click **"Settings"** → **"API"**
2. Copy these values:

   **Project URL:**
   ```
   https://hlanyjxswfknujqrlsxl.supabase.co
   ```

   **Anon (public) key:**
   ```
   [Copy the long key starting with 'eyJ...']
   ```

3. Keep these safe - you'll need them for Vercel deployment!

---

## Step 8: Create Admin User (for Admin Panel Access)

1. In the left sidebar, click **"Authentication"** → **"Users"**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email:** Your admin email (e.g., admin@glomo.shop)
   - **Password:** Create a strong password
   - Auto Confirm User: ✅ (check this box)
4. Click **"Create user"**
5. **Save these credentials** - you'll use them to log into `/admin/login`

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] All tables created (categories, products, orders, order_items)
- [ ] Sample data inserted (3 products, 4 categories)
- [ ] Storage bucket `product-images` exists and is public
- [ ] RLS policies are enabled
- [ ] Realtime is enabled (optional)
- [ ] Admin user created
- [ ] API credentials copied

---

## Next Steps

Once Supabase is configured, proceed to:
1. **Deploy to Vercel** (add the API credentials as environment variables)
2. **Configure glomo.shop domain**
3. **Test the admin panel** with your admin user credentials

---

## Troubleshooting

### Error: "relation already exists"
- This means the tables are already created. You can skip this step.

### Error: "permission denied"
- Make sure you're signed in to the correct Supabase project
- Check that you have owner/admin access

### Can't upload images
- Verify the `product-images` bucket is **public**
- Check storage policies are enabled
- Verify CORS settings include your domain

### Can't log into admin panel
- Make sure you created an admin user in Authentication
- Check that the email is confirmed (Auto Confirm User ✅)
- Verify the password is correct
