'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'status'>('created_at');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'total_amount':
          return b.total_amount - a.total_amount;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        )
      );
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'with delivery guy': return 'primary';
      case 'delivered': return 'success';
      case 'canceled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Orders Management">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Orders Management">
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h5 className="mb-1">All Orders</h5>
                <p className="text-muted mb-0">{filteredOrders.length} orders found</p>
              </div>
              <div className="d-flex gap-2">
                <Button variant="primary">
                  <i className="bi bi-download me-2"></i>
                  Export Orders
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <div className="card bg-warning bg-opacity-10 border-warning">
              <div className="card-body text-center">
                <h4 className="text-warning">{orders.filter(o => o.status === 'pending').length}</h4>
                <p className="mb-0 text-warning small">Pending</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-info bg-opacity-10 border-info">
              <div className="card-body text-center">
                <h4 className="text-info">{orders.filter(o => o.status === 'confirmed').length}</h4>
                <p className="mb-0 text-info small">Confirmed</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-primary bg-opacity-10 border-primary">
              <div className="card-body text-center">
                <h4 className="text-primary">{orders.filter(o => o.status === 'with delivery guy').length}</h4>
                <p className="mb-0 text-primary small">With Delivery</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-success bg-opacity-10 border-success">
              <div className="card-body text-center">
                <h4 className="text-success">{orders.filter(o => o.status === 'delivered').length}</h4>
                <p className="mb-0 text-success small">Delivered</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-danger bg-opacity-10 border-danger">
              <div className="card-body text-center">
                <h4 className="text-danger">{orders.filter(o => o.status === 'canceled').length}</h4>
                <p className="mb-0 text-danger small">Canceled</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-secondary bg-opacity-10 border-secondary">
              <div className="card-body text-center">
                <h4 className="text-secondary">{orders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()} MAD</h4>
                <p className="mb-0 text-secondary small">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label htmlFor="search" className="form-label">Search Orders</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="search"
                  placeholder="Search by ID, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                className="form-select"
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="with delivery guy">With Delivery Guy</option>
                <option value="delivered">Delivered</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="sort" className="form-label">Sort By</label>
              <select
                className="form-select"
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="created_at">Newest First</option>
                <option value="total_amount">Amount High-Low</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <Button 
                variant="secondary" 
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('created_at');
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </Button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <code>{order.order_number}</code>
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{order.customer_name}</div>
                        <small className="text-muted">{order.customer_phone}</small>
                        {order.customer_email && <><br/><small className="text-muted">{order.customer_email}</small></>}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {order.city}
                      </span>
                    </td>
                    <td>
                      <strong>{order.total_amount.toFixed(2)} MAD</strong>
                    </td>
                    <td>
                      <div className="dropdown">
                        <button 
                          className={`btn btn-sm btn-${getStatusColor(order.status)} dropdown-toggle`}
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          {order.status === 'with delivery guy' ? 'With Delivery' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </button>
                        <ul className="dropdown-menu">
                          {['pending', 'confirmed', 'with delivery guy', 'delivered', 'canceled'].map(status => (
                            <li key={status}>
                              <button 
                                className="dropdown-item"
                                onClick={() => handleStatusUpdate(order.id, status as Order['status'])}
                              >
                                {status === 'with delivery guy' ? 'With Delivery Guy' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {formatDate(order.created_at)}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="btn btn-outline-primary"
                          title="View Order Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <button 
                          className="btn btn-outline-success"
                          title="WhatsApp Customer"
                          onClick={() => {
                            const message = `Hello ${order.customer_name}! Regarding your order ${order.order_number}, your order status is: ${order.status}. Total: ${order.total_amount} MAD. Delivery to: ${order.city}, ${order.address}.`;
                            const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                        >
                          <i className="bi bi-whatsapp"></i>
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          title="Delete Order"
                          onClick={() => handleDeleteOrder(order.id, order.order_number)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-4">
                <i className="bi bi-receipt display-4 text-muted mb-3"></i>
                <h5 className="text-muted">No orders found</h5>
                <p className="text-muted mb-3">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}