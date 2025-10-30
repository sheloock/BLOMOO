'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  name: string;
  price: number;
  promo: number | null;
  quantity: number;
  image: string;
  stock: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (cart.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Get product IDs from cart
      const productIds = cart.map((item: any) => item.id);
      
      // Fetch current product data from Supabase
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, promo, images, stock')
        .in('id', productIds);

      if (error) throw error;

      // Merge cart quantities with product data
      const updatedCart: CartItem[] = cart.map((cartItem: any) => {
        const product = products?.find(p => p.id === cartItem.id);
        if (!product) return null;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          promo: product.promo,
          quantity: Math.min(cartItem.quantity, product.stock), // Don't exceed stock
          image: product.images[0] || '',
          stock: product.stock
        };
      }).filter(Boolean) as CartItem[];

      setCartItems(updatedCart);
      
      // Update localStorage with current data
      localStorage.setItem('cart', JSON.stringify(
        updatedCart.map(item => ({ id: item.id, quantity: item.quantity }))
      ));
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/assets/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imagePath);
    
    return data.publicUrl || '/assets/placeholder-product.jpg';
  };

  const calculateFinalPrice = (price: number, promo: number | null) => {
    if (!promo || promo <= 0) return price;
    return price - (price * promo / 100);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const item = cartItems.find(item => item.id === productId);
    if (!item) return;
    
    if (newQuantity > item.stock) {
      toast.error(`Stock disponible: ${item.stock}`);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );

    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(
      updatedCart.map(item => ({ id: item.id, quantity: item.quantity }))
    ));
    
    toast.success('Quantité mise à jour');
  };

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(
      updatedCart.map(item => ({ id: item.id, quantity: item.quantity }))
    ));
    toast.success('Produit retiré du panier');
  };

  const clearCart = () => {
    if (confirm('Voulez-vous vraiment vider le panier?')) {
      setCartItems([]);
      localStorage.removeItem('cart');
      toast.success('Panier vidé');
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const finalPrice = calculateFinalPrice(item.price, item.promo);
      return sum + (finalPrice * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="spinner-border" style={{ color: '#667eea' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 elegant-text" style={{ color: '#6c757d' }}>Chargement du panier...</p>
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
        
        .cart-item {
          transition: all 0.3s ease;
          border-radius: 12px;
          background: white;
        }
        
        .cart-item:hover {
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        
        .quantity-btn {
          width: 35px;
          height: 35px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          background: white;
          color: #667eea;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .quantity-btn:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
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
        
        .elegant-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(33, 150, 243, 0.5);
        }
        
        .price-text {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          color: #2c3e50;
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
          <div className="d-flex align-items-center justify-content-between">
            <Link href="/" className="text-decoration-none d-flex align-items-center">
              <i className="bi bi-arrow-left fs-5 me-2" style={{ color: '#2196F3' }}></i>
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ height: '45px', width: 'auto' }}
              />
            </Link>
            
            {cartItems.length > 0 && (
              <button 
                onClick={clearCart}
                className="btn btn-sm btn-outline-danger"
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-trash me-1"></i>
                Vider
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container-fluid px-3 py-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-bag-x" style={{ fontSize: '5rem', color: '#e9ecef' }}></i>
            </div>
            <h3 className="section-title mb-3">Votre panier est vide</h3>
            <p className="elegant-text text-muted mb-4">
              Découvrez nos produits et ajoutez-les à votre panier
            </p>
            <Link href="/" className="btn elegant-button text-decoration-none">
              <i className="bi bi-shop me-2"></i>
              Continuer mes achats
            </Link>
          </div>
        ) : (
          <div className="row g-3">
            {/* Cart Items */}
            <div className="col-12 col-lg-8">
              <div className="d-flex flex-column gap-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item p-3 shadow-sm">
                    <div className="row g-3 align-items-center">
                      {/* Product Image */}
                      <div className="col-3 col-md-2">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="img-fluid rounded"
                          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="col-9 col-md-10">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <Link href={`/product/${item.id}`} className="text-decoration-none">
                              <h6 className="elegant-text mb-1" style={{ color: '#2c3e50', fontWeight: '600' }}>
                                {item.name}
                              </h6>
                            </Link>
                            
                            <div className="d-flex align-items-center gap-2 mb-2">
                              {item.promo && item.promo > 0 ? (
                                <>
                                  <span className="text-decoration-line-through elegant-text small" style={{ color: '#95a5a6' }}>
                                    {item.price.toFixed(2)} DH
                                  </span>
                                  <span className="price-promo">
                                    {calculateFinalPrice(item.price, item.promo).toFixed(2)} DH
                                  </span>
                                  <span className="badge" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                    -{item.promo}%
                                  </span>
                                </>
                              ) : (
                                <span className="price-text">
                                  {item.price.toFixed(2)} DH
                                </span>
                              )}
                            </div>

                            {item.stock < 5 && (
                              <small className="text-warning elegant-text">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Plus que {item.stock} en stock
                              </small>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="btn btn-sm text-danger"
                            title="Retirer"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="d-flex align-items-center gap-2">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <i className="bi bi-dash"></i>
                          </button>
                          
                          <span className="elegant-text fw-medium px-3" style={{ minWidth: '40px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <i className="bi bi-plus"></i>
                          </button>

                          <span className="ms-auto elegant-text fw-bold" style={{ color: '#2c3e50' }}>
                            {(calculateFinalPrice(item.price, item.promo) * item.quantity).toFixed(2)} DH
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-12 col-lg-4">
              <div className="bg-white p-4 rounded shadow-sm" style={{ position: 'sticky', top: '80px' }}>
                <h5 className="section-title mb-4">Récapitulatif</h5>

                <div className="d-flex justify-content-between mb-3 elegant-text">
                  <span style={{ color: '#6c757d' }}>Articles ({getTotalItems()})</span>
                  <span className="fw-medium" style={{ color: '#2c3e50' }}>
                    {getSubtotal().toFixed(2)} DH
                  </span>
                </div>

                <div className="mb-3">
                  <div className="p-3 rounded d-flex align-items-start gap-2" style={{ backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                    <i className="bi bi-truck" style={{ color: '#2e7d32', fontSize: '1.2rem', marginTop: '2px' }}></i>
                    <small className="elegant-text" style={{ color: '#2e7d32', lineHeight: '1.5' }}>
                      <strong>Livraison gratuite</strong> à Marrakech. Pour les autres villes, <strong>40 DH</strong> de frais de livraison s'appliquent.
                    </small>
                  </div>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-4">
                  <span className="section-title h5 mb-0">Total</span>
                  <span className="price-promo h4 mb-0">
                    {getSubtotal().toFixed(2)} DH
                  </span>
                </div>

                <Link 
                  href="/checkout" 
                  className="btn w-100 text-decoration-none mb-2"
                  style={{ 
                    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                    color: 'white',
                    fontSize: '1.1rem', 
                    padding: '1rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Passer la commande
                </Link>

                <Link 
                  href="/" 
                  className="btn btn-link w-100 text-decoration-none"
                  style={{ color: '#6c757d', fontSize: '0.875rem', padding: '0.5rem' }}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Continuer mes achats
                </Link>

                <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-shield-check" style={{ color: '#2196F3', fontSize: '1.2rem' }}></i>
                    <small className="elegant-text fw-medium" style={{ color: '#2c3e50' }}>
                      Paiement sécurisé à la livraison
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-truck" style={{ color: '#2e7d32', fontSize: '1.2rem' }}></i>
                    <small className="elegant-text fw-medium" style={{ color: '#2c3e50' }}>
                      Livraison gratuite à Marrakech
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
