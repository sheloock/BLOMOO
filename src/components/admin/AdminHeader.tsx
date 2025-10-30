'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface AdminHeaderProps {
  title: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  created_at: string;
  status: string;
}

export default function AdminHeader({ title, isSidebarCollapsed, onToggleSidebar }: AdminHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchRecentOrders();

    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('header-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as Order;
          console.log('New order notification:', newOrder);
          
          setRecentOrders((prev) => [newOrder, ...prev].slice(0, 5));
          setUnreadCount((prev) => prev + 1);
          
          // Show toast notification with sound
          toast.success(
            `New order #${newOrder.order_number} from ${newOrder.customer_name}`,
            {
              duration: 5000,
              position: 'top-right',
              icon: '🔔',
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      if (data) {
        setRecentOrders(data);
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark as read when opening
      setUnreadCount(0);
    }
  };

  return (
    <header 
      className="bg-white border-bottom shadow-sm position-sticky top-0"
      style={{ 
        zIndex: 998,
        marginLeft: isSidebarCollapsed ? '70px' : '280px',
        transition: 'margin-left 0.3s ease'
      }}
    >
      <div className="d-flex justify-content-between align-items-center px-4 py-3">
        {/* Left side */}
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-outline-secondary me-3 d-md-none"
            onClick={onToggleSidebar}
          >
            <i className="bi bi-list"></i>
          </button>
          <h4 className="mb-0 text-dark">{title}</h4>
        </div>

        {/* Right side */}
        <div className="d-flex align-items-center gap-3">
          {/* Notifications */}
          <div className="position-relative dropdown">
            <button 
              className="btn btn-outline-secondary position-relative"
              onClick={handleNotificationClick}
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded={showNotifications}
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                  style={{ fontSize: '0.6em' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <ul className="dropdown-menu dropdown-menu-end" style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
              <li className="dropdown-header d-flex justify-content-between align-items-center">
                <span className="fw-bold">Notifications</span>
                {recentOrders.length > 0 && (
                  <a 
                    href="/admin/orders"
                    className="text-primary text-decoration-none small"
                    onClick={() => setShowNotifications(false)}
                  >
                    View All
                  </a>
                )}
              </li>
              <li><hr className="dropdown-divider" /></li>
              
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <li key={order.id}>
                    <a 
                      className="dropdown-item py-3"
                      href={`/admin/orders?highlight=${order.id}`}
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="d-flex align-items-start">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="bi bi-receipt text-primary"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold">New Order #{order.order_number}</div>
                          <div className="small text-muted">{order.customer_name}</div>
                          <div className="small text-muted">
                            {new Date(order.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </a>
                  </li>
                ))
              ) : (
                <li>
                  <div className="dropdown-item-text text-center py-4 text-muted">
                    <i className="bi bi-bell-slash fs-1 d-block mb-2"></i>
                    <div>No new notifications</div>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Quick actions dropdown */}
          <div className="dropdown">
            <button 
              className="btn btn-primary dropdown-toggle"
              type="button" 
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-plus-lg me-2"></i>
              Quick Add
            </button>
            <ul className="dropdown-menu">
              <li>
                <a className="dropdown-item" href="/admin/products/new">
                  <i className="bi bi-box-seam me-2"></i>Add Product
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="/admin/categories/new">
                  <i className="bi bi-tags me-2"></i>Add Category
                </a>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <a className="dropdown-item" href="/admin/orders">
                  <i className="bi bi-receipt me-2"></i>View Orders
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}