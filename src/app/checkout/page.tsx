'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  promo: number | null;
  quantity: number;
  image: string;
}

const MOROCCO_CITIES = [
  'Casablanca',
  'Rabat',
  'Fès',
  'Marrakech',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kenitra',
  'Tétouan',
  'Safi',
  'El Jadida',
  'Nador',
  'Khouribga',
  'Beni Mellal',
  'Khemisset',
  'Settat'
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    city: '',
    address: '',
    additionalInfo: '',
    notes: ''
  });

  const [errors, setErrors] = useState({
    customerName: '',
    customerPhone: '',
    city: '',
    address: ''
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (cart.length === 0) {
        toast.error('Votre panier est vide');
        router.push('/cart');
        return;
      }

      const productIds = cart.map((item: any) => item.id);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, promo, images')
        .in('id', productIds);

      if (error) throw error;

      const updatedCart: CartItem[] = cart.map((cartItem: any) => {
        const product = products?.find(p => p.id === cartItem.id);
        if (!product) return null;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          promo: product.promo,
          quantity: cartItem.quantity,
          image: product.images[0] || ''
        };
      }).filter(Boolean) as CartItem[];

      setCartItems(updatedCart);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Erreur lors du chargement du panier');
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = (price: number, promo: number | null) => {
    if (!promo || promo <= 0) return price;
    const promoValue = parseFloat(promo.toString().replace('%', ''));
    return price - (price * promoValue / 100);
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => {
      const finalPrice = calculateFinalPrice(item.price, item.promo);
      return sum + (finalPrice * item.quantity);
    }, 0);
  };

  const validateForm = () => {
    const newErrors = {
      customerName: '',
      customerPhone: '',
      city: '',
      address: ''
    };

    let isValid = true;

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Le nom complet est requis';
      isValid = false;
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Le numéro de téléphone est requis';
      isValid = false;
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Format de téléphone invalide';
      isValid = false;
    }

    if (!formData.city) {
      newErrors.city = 'La ville est requise';
      isValid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processOrder();
  };

  const handleButtonClick = async () => {
    await processOrder();
  };

  const processOrder = async () => {
    if (!validateForm()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    try {
      setSubmitting(true);

      const totalAmount = getTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail || null,
          city: formData.city,
          address: formData.address,
          additional_info: formData.additionalInfo || null,
          notes: formData.notes || null,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        promo_applied: item.promo,
        subtotal: calculateFinalPrice(item.price, item.promo) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));

      // Show success message
      toast.success('Commande passée avec succès!');

      // Redirect to confirmation page
      router.push(`/order-confirmation?orderNumber=${order.order_number}`);

    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="spinner-border" style={{ color: '#667eea' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 elegant-text" style={{ color: '#6c757d' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: #2c3e50;
          letter-spacing: -0.5px;
        }
        
        .elegant-text {
          font-family: 'Inter', sans-serif;
        }
        
        .section-title {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          color: #2c3e50;
          letter-spacing: -0.3px;
        }
        
        .elegant-button {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          color: white;
          border-radius: 10px;
          padding: 0.8rem 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .elegant-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(33, 150, 243, 0.5);
        }
        
        .elegant-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .form-control, .form-select {
          border-radius: 10px;
          border: 1px solid #e9ecef;
          padding: 0.75rem 1rem;
          font-family: 'Inter', sans-serif;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .price-promo {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm sticky-top" style={{ borderBottom: '1px solid #e9ecef' }}>
        <div className="container-fluid px-3 py-3">
          <div className="d-flex align-items-center">
            <Link href="/cart" className="text-decoration-none d-flex align-items-center">
              <i className="bi bi-arrow-left fs-5 me-2" style={{ color: '#2196F3' }}></i>
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ height: '45px', width: 'auto' }}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="container-fluid px-3 py-4">
        <div className="row g-4">
          {/* Checkout Form */}
          <div className="col-12 col-lg-7">
            <div className="bg-white p-4 rounded shadow-sm">
              <h5 className="section-title mb-4">
                <i className="bi bi-person-fill me-2" style={{ color: '#667eea' }}></i>
                Informations de livraison
              </h5>

              <form onSubmit={handleSubmit}>
                {/* Customer Name */}
                <div className="mb-3">
                  <label className="form-label elegant-text fw-medium">
                    Nom complet <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.customerName ? 'is-invalid' : ''}`}
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Ex: Ahmed Benali"
                  />
                  {errors.customerName && (
                    <div className="invalid-feedback">{errors.customerName}</div>
                  )}
                </div>

                {/* Phone & Email */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label elegant-text fw-medium">
                      Téléphone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.customerPhone ? 'is-invalid' : ''}`}
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="Ex: +212 6XX-XXXXXX"
                    />
                    {errors.customerPhone && (
                      <div className="invalid-feedback">{errors.customerPhone}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label elegant-text fw-medium">
                      Email (optionnel)
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="Ex: ahmed@example.com"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="mb-3">
                  <label className="form-label elegant-text fw-medium">
                    Ville <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Ex: Marrakech, Casablanca, Rabat..."
                  />
                  {errors.city && (
                    <div className="invalid-feedback">{errors.city}</div>
                  )}
                  <div className="mt-2 p-3 rounded d-flex align-items-start gap-2" style={{ backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                    <i className="bi bi-truck" style={{ color: '#2e7d32', fontSize: '1.2rem', marginTop: '2px' }}></i>
                    <small className="elegant-text" style={{ color: '#2e7d32', lineHeight: '1.5' }}>
                      <strong>Livraison gratuite</strong> à Marrakech. Pour les autres villes, <strong>40 DH</strong> de frais de livraison s'appliquent.
                    </small>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-3">
                  <label className="form-label elegant-text fw-medium">
                    Adresse complète <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Rue, quartier, repère..."
                  />
                  {errors.address && (
                    <div className="invalid-feedback">{errors.address}</div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="mb-3">
                  <label className="form-label elegant-text fw-medium">
                    Informations complémentaires (optionnel)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    placeholder="Numéro d'appartement, étage, nom du bâtiment..."
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="form-label elegant-text fw-medium">
                    Notes sur la commande (optionnel)
                  </label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Instructions spéciales pour la livraison..."
                  />
                </div>

                {/* Submit Button - Mobile */}
                <button
                  type="submit"
                  className="btn elegant-button w-100 d-lg-none"
                  style={{ fontSize: '1.1rem', padding: '1rem 1.5rem' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Passer la commande
                    </>
                  )}
                </button>
                
                <Link 
                  href="/cart" 
                  className="btn btn-link w-100 text-decoration-none d-lg-none mt-2"
                  style={{ color: '#6c757d', fontSize: '0.875rem', padding: '0.5rem' }}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Retour au panier
                </Link>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-12 col-lg-5">
            <div className="bg-white p-4 rounded shadow-sm" style={{ position: 'sticky', top: '80px' }}>
              <h5 className="section-title mb-4">
                <i className="bi bi-bag-check me-2" style={{ color: '#667eea' }}></i>
                Récapitulatif
              </h5>

              {/* Cart Items */}
              <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {cartItems.map(item => (
                  <div key={item.id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                    <img
                      src={item.image || '/assets/placeholder-product.jpg'}
                      alt={item.name}
                      className="rounded"
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                    <div className="ms-3 flex-grow-1">
                      <h6 className="elegant-text mb-1 small" style={{ color: '#2c3e50' }}>
                        {item.name}
                      </h6>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="elegant-text small text-muted">
                          Qté: {item.quantity}
                        </span>
                        <span className="elegant-text fw-bold small" style={{ color: '#667eea' }}>
                          {(calculateFinalPrice(item.price, item.promo) * item.quantity).toFixed(2)} DH
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-top pt-3 mb-3">
                <div className="d-flex justify-content-between mb-2 elegant-text">
                  <span style={{ color: '#6c757d' }}>Sous-total</span>
                  <span className="fw-medium" style={{ color: '#2c3e50' }}>
                    {getTotal().toFixed(2)} DH
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2 elegant-text">
                  <span style={{ color: '#6c757d' }}>Livraison</span>
                  <span className="text-success fw-medium">Gratuite</span>
                </div>
              </div>

              <div className="border-top pt-3 mb-4">
                <div className="d-flex justify-content-between">
                  <span className="section-title h5 mb-0">Total</span>
                  <span className="price-promo h4 mb-0">
                    {getTotal().toFixed(2)} DH
                  </span>
                </div>
              </div>

              {/* Submit Button - Desktop */}
              <button
                type="button"
                onClick={handleButtonClick}
                className="btn elegant-button w-100 d-none d-lg-block mb-2"
                style={{ fontSize: '1.1rem', padding: '1rem 1.5rem' }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Passer la commande
                  </>
                )}
              </button>
              
              <Link 
                href="/cart" 
                className="btn btn-link w-100 text-decoration-none d-none d-lg-block"
                style={{ color: '#6c757d', fontSize: '0.875rem', padding: '0.5rem' }}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Retour au panier
              </Link>

              {/* Security Badge */}
              <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-shield-check" style={{ color: '#667eea', fontSize: '1.2rem' }}></i>
                  <small className="elegant-text fw-medium" style={{ color: '#2c3e50' }}>
                    Paiement à la livraison
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-truck" style={{ color: '#2e7d32', fontSize: '1.2rem' }}></i>
                  <small className="elegant-text fw-medium" style={{ color: '#2c3e50' }}>
                    Livraison gratuite à Marrakech (40 DH ailleurs)
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
