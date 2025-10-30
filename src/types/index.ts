// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Component props types
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  size?: 'sm' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Carousel slide types
export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  image?: string;
  url?: string;
}

// Admin & E-commerce types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promo?: string | null; // e.g., '8%', '15%', NULL for no promo
  is_best_seller: boolean;
  category_id?: string | null;
  category?: Category;
  images: string[];
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  city: string;
  address: string;
  additional_info?: string | null;
  notes?: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'with delivery guy' | 'delivered' | 'canceled';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  promo_applied?: string | null;
  subtotal: number;
  created_at: string;
}

export interface AdminStats {
  total_products: number;
  total_orders: number;
  total_customers: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_products: number;
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
}