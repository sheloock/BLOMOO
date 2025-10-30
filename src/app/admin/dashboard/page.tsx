'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import AnalyticsChart from '@/components/AnalyticsChart';
import { AdminStats, SalesData, Order, Product } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    total_products: 0,
    total_orders: 0,
    total_customers: 0,
    total_revenue: 0,
    pending_orders: 0,
    low_stock_products: 0,
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        productsRes,
        ordersRes,
        pendingOrdersRes,
        lowStockRes,
        recentOrdersRes,
        last7DaysRes,
        topProductsRes
      ] = await Promise.all([
        // Total products count
        supabase.from('products').select('id', { count: 'exact', head: true }),
        // Total orders and revenue
        supabase.from('orders').select('total_amount'),
        // Pending orders count
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        // Low stock products (stock <= 10)
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 10),
        // Recent orders (last 5)
        supabase
          .from('orders')
          .select('id, order_number, customer_name, total_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        // Sales data for last 7 days
        supabase
          .from('orders')
          .select('created_at, total_amount')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true }),
        // Top products by quantity sold
        supabase
          .from('order_items')
          .select('product_name, quantity, subtotal')
      ]);

      // Calculate stats
      const totalProducts = productsRes.count || 0;
      const totalOrders = ordersRes.data?.length || 0;
      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingOrders = pendingOrdersRes.count || 0;
      const lowStockProducts = lowStockRes.count || 0;

      // Get unique customers count (by customer_phone or customer_email)
      const uniqueCustomers = new Set(
        recentOrdersRes.data?.map(order => order.customer_name) || []
      ).size;

      setStats({
        total_products: totalProducts,
        total_orders: totalOrders,
        total_customers: uniqueCustomers,
        total_revenue: totalRevenue,
        pending_orders: pendingOrders,
        low_stock_products: lowStockProducts,
      });

      // Process sales data for chart (group by day)
      if (last7DaysRes.data) {
        const salesByDay = last7DaysRes.data.reduce((acc: any, order) => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, sales: 0, orders: 0 };
          }
          acc[date].sales += order.total_amount;
          acc[date].orders += 1;
          return acc;
        }, {});

        setSalesData(Object.values(salesByDay));
      }

      // Set recent orders
      if (recentOrdersRes.data) {
        setRecentOrders(recentOrdersRes.data);
      }

      // Process top products
      if (topProductsRes.data) {
        const productStats = topProductsRes.data.reduce((acc: any, item) => {
          if (!acc[item.product_name]) {
            acc[item.product_name] = { name: item.product_name, sales: 0, revenue: 0 };
          }
          acc[item.product_name].sales += item.quantity;
          acc[item.product_name].revenue += item.subtotal;
          return acc;
        }, {});

        const sortedProducts = Object.values(productStats)
          .sort((a: any, b: any) => b.sales - a.sales)
          .slice(0, 4);

        setTopProducts(sortedProducts as TopProduct[]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="container-fluid">
        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6 col-xl-3">
            <div className="card bg-primary text-white h-100">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h3 className="mb-1">{stats.total_revenue.toFixed(2)} MAD</h3>
                  <p className="mb-0">Total Revenue</p>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-currency-dollar fs-4"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="card bg-success text-white h-100">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h3 className="mb-1">{stats.total_orders}</h3>
                  <p className="mb-0">Total Orders</p>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-receipt fs-4"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="card bg-info text-white h-100">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h3 className="mb-1">{stats.total_products}</h3>
                  <p className="mb-0">Products</p>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-box-seam fs-4"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="card bg-secondary text-white h-100">
              <div className="card-body d-flex align-items-center">
                <div className="flex-grow-1">
                  <h3 className="mb-1">{stats.total_customers}</h3>
                  <p className="mb-0">Customers</p>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-people fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="alert alert-warning d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
              <div>
                <strong>{stats.pending_orders} Pending Orders</strong>
                <p className="mb-0">Need immediate attention</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-box-arrow-down me-3 fs-4"></i>
              <div>
                <strong>{stats.low_stock_products} Low Stock Products</strong>
                <p className="mb-0">Restock needed soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <Card title="Sales Overview (Last 7 Days)">
              <AnalyticsChart 
                data={salesData.map(item => ({
                  name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: item.sales
                }))}
                type="line"
              />
            </Card>
          </div>
          <div className="col-lg-4">
            <Card title="Top Products">
              <div className="list-group list-group-flush">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      <div>
                        <h6 className="mb-1">{product.name}</h6>
                        <small className="text-muted">{product.sales} sold</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">
                        {product.revenue.toFixed(2)} MAD
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-3">No sales data yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="row">
          <div className="col-12">
            <Card title="Recent Orders">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <code>{order.order_number}</code>
                          </td>
                          <td>{order.customer_name}</td>
                          <td><strong>{order.total_amount.toFixed(2)} MAD</strong></td>
                          <td>
                            <span className={`badge bg-${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <a href={`/admin/orders`} className="btn btn-outline-primary">
                                <i className="bi bi-eye"></i>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-3">
                          No orders yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-3">
                <a href="/admin/orders" className="btn btn-outline-primary">
                  View All Orders <i className="bi bi-arrow-right ms-2"></i>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}