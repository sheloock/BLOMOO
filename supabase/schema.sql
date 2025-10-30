-- ============================================
-- Abdesadek Shop Database Schema
-- E-commerce Platform Tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    promo VARCHAR(10), -- e.g., '8%', '15%', NULL for no promo
    is_best_seller BOOLEAN DEFAULT false,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    images TEXT[], -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL, -- Full Name (Required)
    customer_phone VARCHAR(50) NOT NULL, -- Phone Number (Required - for delivery coordination)
    customer_email VARCHAR(255), -- Email (Optional - for order confirmation)
    
    -- Shipping Address (Morocco-specific)
    city VARCHAR(100) NOT NULL, -- City/Ville - Dropdown (Casablanca, Rabat, etc.)
    address TEXT NOT NULL, -- Street, neighborhood, landmark
    additional_info TEXT, -- Optional - apartment number, floor, building name, etc.
    
    -- Order Details
    notes TEXT, -- Customer notes about the order
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'with delivery guy', 'delivered', 'canceled')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDER ITEMS TABLE (Products in each order)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Store product name in case product is deleted
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    promo_applied VARCHAR(10), -- Store the promo that was applied at purchase time
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_best_seller ON products(is_best_seller);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_city ON orders(city); -- For filtering orders by destination city
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_categories_is_active ON categories(is_active);

-- ============================================
-- FUNCTIONS for Auto-Update Timestamps
-- ============================================
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS for Auto-Update Timestamps
-- ============================================
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION to Generate Order Number
-- ============================================
-- Drop existing function if it exists with any signature
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the next order number
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders;
    
    -- Generate order number like ORD-000001
    NEW.order_number = 'ORD-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER for Auto-Generate Order Number
-- ============================================
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Public can view active categories"
    ON categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
    ON categories FOR ALL
    USING (auth.role() = 'authenticated');

-- Products Policies
CREATE POLICY "Public can view active products"
    ON products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Authenticated users can manage products"
    ON products FOR ALL
    USING (auth.role() = 'authenticated');

-- Orders Policies
CREATE POLICY "Authenticated users can view all orders"
    ON orders FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
    ON orders FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Order Items Policies
CREATE POLICY "Authenticated users can view order items"
    ON order_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can create order items"
    ON order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update order items"
    ON order_items FOR UPDATE
    USING (auth.role() = 'authenticated');

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample categories
INSERT INTO categories (name, description, is_active) VALUES
('Electronics', 'Electronic devices and gadgets', true),
('Fashion', 'Clothing and accessories', true),
('Home & Garden', 'Home decor and gardening supplies', true),
('Sports', 'Sports equipment and fitness gear', true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, stock, promo, is_best_seller, category_id, images) 
SELECT 
    'Premium Wireless Headphones',
    'High-quality wireless headphones with noise cancellation and superior sound quality',
    299.00,
    25,
    '15%',
    true,
    (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1),
    ARRAY['/images/products/headphones.jpg']
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Premium Wireless Headphones');

INSERT INTO products (name, description, price, stock, promo, is_best_seller, category_id, images) 
SELECT 
    'Smart Fitness Watch',
    'Advanced fitness tracking with heart rate monitor, GPS, and waterproof design',
    199.00,
    15,
    NULL,
    true,
    (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1),
    ARRAY['/images/products/smartwatch.jpg']
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Smart Fitness Watch');

INSERT INTO products (name, description, price, stock, promo, is_best_seller, category_id, images) 
SELECT 
    'Bluetooth Speaker',
    'Portable bluetooth speaker with 360° sound and 12-hour battery life',
    89.00,
    30,
    '8%',
    false,
    (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1),
    ARRAY['/images/products/speaker.jpg']
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Bluetooth Speaker');

-- ============================================
-- VIEWS for Easy Querying
-- ============================================

-- View for products with category information
CREATE OR REPLACE VIEW products_with_categories AS
SELECT 
    p.*,
    c.name as category_name,
    c.description as category_description
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- View for orders with items count and details
CREATE OR REPLACE VIEW orders_summary AS
SELECT 
    o.*,
    COUNT(oi.id) as items_count,
    SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- ============================================
-- STORAGE BUCKET for Product Images
-- ============================================
-- Note: Run this in Supabase SQL Editor or Dashboard
-- This creates a storage bucket for product images

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy to allow public read
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Storage policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
);

-- Storage policy to allow authenticated users to update
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
);

-- Storage policy to allow authenticated users to delete
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
);

-- ============================================
-- END OF SCHEMA
-- ============================================