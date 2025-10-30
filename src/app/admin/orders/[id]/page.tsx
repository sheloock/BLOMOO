'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  promo_applied: string | null;
  subtotal: number;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  images: string[];
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, ProductDetails>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((resolvedParams) => {
      setOrderId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setOrderItems(itemsData || []);

      // Fetch product details for each item
      if (itemsData && itemsData.length > 0) {
        const productIds = itemsData
          .map(item => item.product_id)
          .filter((id): id is string => id !== null);

        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, name, description, images')
            .in('id', productIds);

          if (productsError) throw productsError;

          // Create a map of product details
          const productsMap: Record<string, ProductDetails> = {};
          productsData?.forEach(product => {
            productsMap[product.id] = product;
          });
          setProductDetails(productsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrder({ ...order, status: newStatus, updated_at: new Date().toISOString() });
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculatePromoPrice = (price: number, promo: string | null) => {
    if (!promo) return price;
    const promoValue = parseFloat(promo.replace('%', ''));
    return price - (price * promoValue / 100);
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/assets/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imagePath);
    
    return data.publicUrl || '/assets/placeholder-product.jpg';
  };

  if (loading) {
    return (
      <AdminLayout title="Order Details">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Order Not Found">
        <Card>
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
            <h4>Order Not Found</h4>
            <p className="text-muted">The order you're looking for doesn't exist.</p>
            <Link href="/admin/orders" className="btn btn-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Orders
            </Link>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Order ${order.order_number}`}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <Link href="/admin/orders" className="btn btn-link text-decoration-none p-0 mb-2">
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Orders
                </Link>
                <h4 className="mb-1">Order Details</h4>
                <p className="text-muted mb-0">
                  Order ID: <code>{order.order_number}</code>
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <div className="dropdown">
                  <button 
                    className={`btn btn-${getStatusColor(order.status)} dropdown-toggle`}
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem' }}></i>
                    {order.status === 'with delivery guy' ? 'With Delivery' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </button>
                  <ul className="dropdown-menu">
                    {['pending', 'confirmed', 'with delivery guy', 'delivered', 'canceled'].map(status => (
                      <li key={status}>
                        <button 
                          className="dropdown-item"
                          onClick={() => handleStatusUpdate(status as Order['status'])}
                        >
                          {status === 'with delivery guy' ? 'With Delivery Guy' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    const message = `Hello ${order.customer_name}! Regarding your order ${order.order_number}, your order status is: ${order.status}. Total: ${order.total_amount} MAD. Delivery to: ${order.city}, ${order.address}.`;
                    const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  Contact Customer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Customer Information */}
          <div className="col-12 col-lg-6">
            <Card title="Customer Information">
              <div className="row g-3">
                <div className="col-12">
                  <label className="text-muted small mb-1">Full Name</label>
                  <div className="fw-medium">
                    <i className="bi bi-person me-2 text-primary"></i>
                    {order.customer_name}
                  </div>
                </div>
                <div className="col-12">
                  <label className="text-muted small mb-1">Phone Number</label>
                  <div className="fw-medium">
                    <i className="bi bi-telephone me-2 text-primary"></i>
                    <a href={`tel:${order.customer_phone}`} className="text-decoration-none">
                      {order.customer_phone}
                    </a>
                  </div>
                </div>
                {order.customer_email && (
                  <div className="col-12">
                    <label className="text-muted small mb-1">Email</label>
                    <div className="fw-medium">
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      <a href={`mailto:${order.customer_email}`} className="text-decoration-none">
                        {order.customer_email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Delivery Information */}
          <div className="col-12 col-lg-6">
            <Card title="Delivery Information">
              <div className="row g-3">
                <div className="col-12">
                  <label className="text-muted small mb-1">City</label>
                  <div className="fw-medium">
                    <i className="bi bi-geo-alt me-2 text-danger"></i>
                    {order.city}
                  </div>
                </div>
                <div className="col-12">
                  <label className="text-muted small mb-1">Address</label>
                  <div className="fw-medium">
                    <i className="bi bi-house me-2 text-danger"></i>
                    {order.address}
                  </div>
                </div>
                {order.additional_info && (
                  <div className="col-12">
                    <label className="text-muted small mb-1">Additional Info</label>
                    <div className="fw-medium">
                      <i className="bi bi-info-circle me-2 text-info"></i>
                      {order.additional_info}
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div className="col-12">
                    <label className="text-muted small mb-1">Customer Notes</label>
                    <div className="alert alert-light mb-0">
                      <i className="bi bi-chat-left-text me-2"></i>
                      {order.notes}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Order Items */}
          <div className="col-12">
            <Card title="Order Items">
              <div className="row g-4">
                {orderItems.map((item) => {
                  const product = item.product_id ? productDetails[item.product_id] : null;
                  const images = product?.images || [];
                  
                  return (
                    <div key={item.id} className="col-12">
                      <div className="card shadow-sm">
                        <div className="card-body">
                          <div className="row g-3">
                            {/* Product Images Carousel */}
                            <div className="col-md-3">
                              {images.length > 0 ? (
                                <div id={`carousel-${item.id}`} className="carousel slide" data-bs-ride="carousel">
                                  <div className="carousel-inner rounded">
                                    {images.map((image, index) => (
                                      <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                                        <img
                                          src={getImageUrl(image)}
                                          className="d-block w-100 rounded"
                                          alt={`${item.product_name} - Image ${index + 1}`}
                                          style={{ 
                                            height: '200px', 
                                            objectFit: 'cover',
                                            backgroundColor: '#f8f9fa'
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  {images.length > 1 && (
                                    <>
                                      <button
                                        className="carousel-control-prev"
                                        type="button"
                                        data-bs-target={`#carousel-${item.id}`}
                                        data-bs-slide="prev"
                                      >
                                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span className="visually-hidden">Previous</span>
                                      </button>
                                      <button
                                        className="carousel-control-next"
                                        type="button"
                                        data-bs-target={`#carousel-${item.id}`}
                                        data-bs-slide="next"
                                      >
                                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span className="visually-hidden">Next</span>
                                      </button>
                                      <div className="carousel-indicators">
                                        {images.map((_, index) => (
                                          <button
                                            key={index}
                                            type="button"
                                            data-bs-target={`#carousel-${item.id}`}
                                            data-bs-slide-to={index}
                                            className={index === 0 ? 'active' : ''}
                                            aria-current={index === 0 ? 'true' : undefined}
                                            aria-label={`Slide ${index + 1}`}
                                          ></button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: '200px' }}
                                >
                                  <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                                </div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="col-md-6">
                              <div className="mb-2">
                                <h5 className="mb-1">{item.product_name}</h5>
                                {item.promo_applied && (
                                  <span className="badge bg-danger me-2">
                                    -{item.promo_applied} OFF
                                  </span>
                                )}
                                {!product && (
                                  <span className="badge bg-secondary">Product Deleted</span>
                                )}
                              </div>
                              
                              {product?.description && (
                                <div className="mb-3">
                                  <label className="text-muted small mb-1">Description</label>
                                  <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>
                                    {product.description}
                                  </p>
                                </div>
                              )}

                              <div className="row g-2 mt-2">
                                <div className="col-6">
                                  <div className="bg-light p-2 rounded">
                                    <small className="text-muted d-block">Quantity</small>
                                    <strong className="text-primary">×{item.quantity}</strong>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="bg-light p-2 rounded">
                                    <small className="text-muted d-block">Unit Price</small>
                                    {item.promo_applied ? (
                                      <div>
                                        <span className="text-decoration-line-through text-muted small">
                                          {item.product_price.toFixed(2)} DH
                                        </span>
                                        <br />
                                        <strong className="text-success">
                                          {calculatePromoPrice(item.product_price, item.promo_applied).toFixed(2)} DH
                                        </strong>
                                      </div>
                                    ) : (
                                      <strong>{item.product_price.toFixed(2)} DH</strong>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Pricing */}
                            <div className="col-md-3">
                              <div className="d-flex flex-column h-100 justify-content-center align-items-end">
                                <label className="text-muted small mb-2">Subtotal</label>
                                <h3 className="mb-0 text-primary">{item.subtotal.toFixed(2)} DH</h3>
                                {item.promo_applied && (
                                  <small className="text-success mt-1">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Promo Applied
                                  </small>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Order Total */}
                <div className="col-12">
                  <div className="card bg-primary bg-opacity-10 border-primary">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1">Total Order Amount</h5>
                          <small className="text-muted">
                            {orderItems.length} item(s) • {orderItems.reduce((sum, item) => sum + item.quantity, 0)} unit(s)
                          </small>
                        </div>
                        <h2 className="mb-0 text-primary">{order.total_amount.toFixed(2)} DH</h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Timeline */}
          <div className="col-12">
            <Card title="Order Timeline">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-clock text-primary fs-5"></i>
                    </div>
                    <div>
                      <small className="text-muted">Created At</small>
                      <div className="fw-medium">{formatDate(order.created_at)}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-arrow-clockwise text-success fs-5"></i>
                    </div>
                    <div>
                      <small className="text-muted">Last Updated</small>
                      <div className="fw-medium">{formatDate(order.updated_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
