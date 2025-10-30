# Supabase Database Setup Guide

## 📋 Database Schema Overview

Your Abdesadek Shop database includes the following tables:

### Tables Structure:

1. **categories** - Product categories
   - id, name, description, image_url, is_active
   
2. **products** - All products
   - id, name, description, price, stock, promo, is_best_seller, category_id, images, is_active
   
3. **orders** - Customer orders
   - id, order_number, customer_name, customer_email, customer_phone, shipping_address, notes, total_amount, status, payment_status
   
4. **order_items** - Products in each order
   - id, order_id, product_id, product_name, product_price, quantity, promo_applied, subtotal

## 🚀 How to Set Up the Database

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Project**
   - Visit: https://app.supabase.com/project/hlanyjxswfknujqrlsxl

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Schema**
   - Open the file: `supabase/schema.sql`
   - Copy ALL the SQL content
   - Paste it into the SQL Editor

4. **Run the Query**
   - Click "Run" button (or press Ctrl/Cmd + Enter)
   - Wait for completion (should take 5-10 seconds)
   - You should see "Success. No rows returned"

5. **Verify Tables Created**
   - Click on "Table Editor" in the left sidebar
   - You should see: categories, products, orders, order_items

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref hlanyjxswfknujqrlsxl

# Run migrations
supabase db push
```

## 🔐 Security Features Included

### Row Level Security (RLS)
- ✅ Public can view active products and categories
- ✅ Only authenticated users can manage products/categories
- ✅ Anyone can create orders (for customer checkout)
- ✅ Only authenticated users can view/manage orders

### Storage Policies
- ✅ Product images bucket created
- ✅ Public can view images
- ✅ Only authenticated users can upload/delete images

## 📊 Sample Data

The schema includes sample data:
- 4 Categories (Electronics, Fashion, Home & Garden, Sports)
- 3 Products (Headphones, Smartwatch, Speaker)

## 🔧 Key Features

### Auto-Generated Fields
- ✅ Order numbers auto-generate (ORD-000001, ORD-000002, etc.)
- ✅ Timestamps auto-update on changes
- ✅ UUIDs for all primary keys

### Data Validation
- ✅ Price must be >= 0
- ✅ Stock must be >= 0
- ✅ Quantity in orders must be > 0
- ✅ Status fields have allowed values only

### Relationships
- Products → Categories (Many-to-One)
- Orders → Order Items (One-to-Many)
- Order Items → Products (Many-to-One)

## 🧪 Test the Database

After running the schema, test with these queries:

```sql
-- View all categories
SELECT * FROM categories;

-- View all products with categories
SELECT * FROM products_with_categories;

-- View orders summary
SELECT * FROM orders_summary;

-- Check sample products
SELECT name, price, promo, is_best_seller FROM products;
```

## 📱 Next Steps

After database setup:

1. ✅ Database tables created
2. ⏭️ Connect admin dashboard to Supabase
3. ⏭️ Test CRUD operations
4. ⏭️ Build customer-facing website
5. ⏭️ Implement shopping cart
6. ⏭️ Add WhatsApp integration

## 🆘 Troubleshooting

### Error: "relation already exists"
- Some tables already exist. You can either:
  - Drop existing tables first (careful!)
  - Comment out the CREATE TABLE statements for existing tables

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Check that RLS policies are properly configured

### Images not uploading
- Verify the storage bucket "product-images" exists
- Check storage policies are enabled
- Ensure file size is under limit (50MB default)

## 📚 Useful SQL Commands

```sql
-- Drop all tables (CAREFUL!)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Reset auto-increment for order numbers
DELETE FROM orders;
-- Order numbers will restart from ORD-000001

-- Clear all products
DELETE FROM products;

-- Disable/Enable RLS temporarily (for testing)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

---

**Ready to proceed?** Once the database is set up, the admin dashboard will automatically connect to these tables!