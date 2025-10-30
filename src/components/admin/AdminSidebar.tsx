'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const menuItems = [
    {
      icon: 'bi-speedometer2',
      label: 'Dashboard',
      href: '/admin/dashboard',
    },
    {
      icon: 'bi-box-seam',
      label: 'Products',
      href: '/admin/products',
    },
    {
      icon: 'bi-receipt',
      label: 'Orders',
      href: '/admin/orders',
      badge: newOrdersCount,
    },
    {
      icon: 'bi-tags',
      label: 'Categories',
      href: '/admin/categories',
    },
    {
      icon: 'bi-gear',
      label: 'Settings',
      href: '/admin/settings',
    },
  ];

  // Fetch new orders count
  useEffect(() => {
    fetchNewOrdersCount();

    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('New order received:', payload);
          setNewOrdersCount((prev) => prev + 1);
          toast.success('🔔 New order received!', {
            duration: 5000,
            position: 'top-right',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // If order status changed from 'pending' to something else, decrease count
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          
          if (oldStatus === 'pending' && newStatus !== 'pending') {
            setNewOrdersCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNewOrdersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      setNewOrdersCount(count || 0);
    } catch (error) {
      console.error('Error fetching new orders count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success('Logged out successfully');
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`bg-dark text-white vh-100 position-fixed ${isCollapsed ? 'collapsed-sidebar' : 'expanded-sidebar'}`} style={{ zIndex: 1000 }}>
        {/* Header */}
        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex justify-content-between align-items-center">
            {!isCollapsed && (
              <h5 className="mb-0 text-primary">
                <i className="bi bi-shop me-2"></i>
                Admin Panel
              </h5>
            )}
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={onToggle}
              aria-label="Toggle sidebar"
            >
              <i className={`bi ${isCollapsed ? 'bi-arrow-right' : 'bi-arrow-left'}`}></i>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-3">
          <ul className="nav flex-column">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="nav-item mb-1">
                  <Link 
                    href={item.href}
                    className={`nav-link d-flex align-items-center px-3 py-2 text-decoration-none position-relative ${
                      isActive ? 'bg-primary text-white' : 'text-light'
                    } hover-bg-secondary`}
                  >
                    <i className={`${item.icon} ${isCollapsed ? 'fs-5' : 'me-3'}`}></i>
                    {!isCollapsed && <span>{item.label}</span>}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span 
                        className="badge bg-danger rounded-pill ms-auto"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="position-absolute bottom-0 w-100 border-top border-secondary">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-outline-danger w-100 rounded-0 py-2 d-flex align-items-center justify-content-center"
          >
            <i className={`bi bi-box-arrow-right ${!isCollapsed && 'me-2'}`}></i>
            {!isCollapsed && <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
          <div className="p-3">
            <div className="d-flex align-items-center">
              <img 
                src="/favicon.png" 
                alt="Icon" 
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
              {!isCollapsed && (
                <div className="ms-3">
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    style={{ height: '24px', width: 'auto' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div 
          className="d-md-none position-fixed w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 999 }}
          onClick={onToggle}
        />
      )}

      <style jsx>{`
        .expanded-sidebar {
          width: 280px;
          transition: width 0.3s ease;
        }
        
        .collapsed-sidebar {
          width: 70px;
          transition: width 0.3s ease;
        }
        
        .hover-bg-secondary:hover {
          background-color: rgba(108, 117, 125, 0.2) !important;
        }
        
        @media (max-width: 768px) {
          .expanded-sidebar {
            width: 280px;
          }
          .collapsed-sidebar {
            width: 0;
            overflow: hidden;
          }
        }
      `}</style>
    </>
  );
}