'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  promo: number | null;
  is_best_seller: boolean;
  images: string[];
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    loadCartCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => loadCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
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

  const addToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation();

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Stock disponible: ${product.stock}`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({ id: product.id, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartCount();
    toast.success('Ajouté au panier!');
    
    // Trigger event for other components
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const promoProducts = products.filter(p => p.promo && p.promo > 0).slice(0, 5);
  const bestSellers = products.filter(p => p.is_best_seller).slice(0, 6);
  
  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }
    
    // Sort products
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => {
          const priceA = calculateFinalPrice(a.price, a.promo);
          const priceB = calculateFinalPrice(b.price, b.promo);
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        filtered.sort((a, b) => {
          const priceA = calculateFinalPrice(a.price, a.promo);
          const priceB = calculateFinalPrice(b.price, b.promo);
          return priceB - priceA;
        });
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        // Already sorted by created_at from the query
        break;
    }
    
    return filtered;
  };
  
  const allProducts = getFilteredAndSortedProducts();

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
        
        .product-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important;
        }
        
        .elegant-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          font-weight: 600;
        }
        
        .promo-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border: none;
          font-weight: 600;
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
        
        .elegant-header {
          background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
          border-bottom: 1px solid #e9ecef;
        }
        
        .cart-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          border-radius: 10px;
          padding: 0.5rem 1rem;
          transition: all 0.3s ease;
        }
        
        .cart-button:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .bottom-nav {
          background: linear-gradient(to top, #ffffff 0%, #f8f9fa 100%);
          border-top: 1px solid #e9ecef;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }
        
        .nav-link-elegant {
          color: #6c757d;
          transition: all 0.3s ease;
        }
        
        .nav-link-elegant:hover {
          color: #667eea;
          transform: scale(1.1);
        }
        
        .add-to-cart-btn {
          transition: all 0.2s ease;
        }
        
        .add-to-cart-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      `}</style>

      {/* Header */}
      <header className="elegant-header shadow-sm sticky-top">
        <div className="container-fluid px-3 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <Link href="/" className="brand-logo text-decoration-none d-flex align-items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ height: '50px', width: 'auto' }}
              />
            </Link>

            <Link href="/cart" className="cart-button text-decoration-none position-relative">
              <i className="bi bi-bag fs-5"></i>
              {cartCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill promo-badge">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <div className="mt-2 d-flex align-items-center elegant-text" style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            <i className="bi bi-telephone-fill me-2" style={{ color: '#667eea' }}></i>
            <span className="fw-medium">+212 XXX-XXXXXX</span>
            <span className="mx-2">•</span>
            <span className="fw-light">Service Client 24/7</span>
          </div>
        </div>
      </header>

      <main className="pb-5 mb-5">
        {/* Promo Slider */}
        {promoProducts.length > 0 && (
          <section className="bg-white mb-3 py-4" style={{ borderBottom: '1px solid #e9ecef' }}>
            <div className="container-fluid px-3">
              <h5 className="section-title mb-4 d-flex align-items-center">
                <span className="me-2" style={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  width: '4px',
                  height: '24px',
                  borderRadius: '2px',
                  display: 'inline-block'
                }}></span>
                Offres Exclusives
                <i className="bi bi-lightning-charge-fill ms-2" style={{ color: '#f5576c' }}></i>
              </h5>
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={15}
                slidesPerView={2}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                breakpoints={{
                  576: { slidesPerView: 3 },
                  768: { slidesPerView: 4 },
                  992: { slidesPerView: 5 },
                }}
              >
                {promoProducts.map((product) => (
                  <SwiperSlide key={product.id}>
                    <Link href={`/product/${product.id}`} className="text-decoration-none">
                      <div className="card product-card h-100 border-0 shadow-sm">
                        <div className="position-relative">
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="card-img-top"
                            style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                          />
                          <span className="position-absolute top-0 end-0 badge promo-badge m-2">
                            -{product.promo}%
                          </span>
                        </div>
                        <div className="card-body p-3">
                          <h6 className="card-title elegant-text small text-truncate mb-2" style={{ color: '#2c3e50' }}>
                            {product.name}
                          </h6>
                          <div className="d-flex flex-column">
                            <span className="text-decoration-line-through elegant-text" style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
                              {product.price.toFixed(2)} DH
                            </span>
                            <span className="price-promo" style={{ fontSize: '1.1rem' }}>
                              {calculateFinalPrice(product.price, product.promo).toFixed(2)} DH
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Best Sellers Slider */}
        {bestSellers.length > 0 && (
          <section className="bg-white mb-3 py-4" style={{ borderBottom: '1px solid #e9ecef' }}>
            <div className="container-fluid px-3">
              <h5 className="section-title mb-4 d-flex align-items-center">
                <span className="me-2" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: '4px',
                  height: '24px',
                  borderRadius: '2px',
                  display: 'inline-block'
                }}></span>
                Meilleures Ventes
                <i className="bi bi-award-fill ms-2" style={{ color: '#667eea' }}></i>
              </h5>
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={15}
                slidesPerView={2}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                breakpoints={{
                  576: { slidesPerView: 3 },
                  768: { slidesPerView: 4 },
                  992: { slidesPerView: 5 },
                }}
              >
                {bestSellers.map((product) => (
                  <SwiperSlide key={product.id}>
                    <Link href={`/product/${product.id}`} className="text-decoration-none">
                      <div className="card product-card h-100 border-0 shadow-sm">
                        <div className="position-relative">
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="card-img-top"
                            style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                          />
                          <span className="position-absolute top-0 start-0 badge elegant-badge m-2">
                            <i className="bi bi-star-fill"></i>
                          </span>
                        </div>
                        <div className="card-body p-3">
                          <h6 className="card-title elegant-text small text-truncate mb-2" style={{ color: '#2c3e50' }}>
                            {product.name}
                          </h6>
                          <div className="d-flex align-items-center justify-content-between">
                            {product.promo && product.promo > 0 ? (
                              <div className="d-flex flex-column">
                                <span className="text-decoration-line-through elegant-text" style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
                                  {product.price.toFixed(2)} DH
                                </span>
                                <span className="price-promo" style={{ fontSize: '1.1rem' }}>
                                  {calculateFinalPrice(product.price, product.promo).toFixed(2)} DH
                                </span>
                              </div>
                            ) : (
                              <span className="price-text" style={{ fontSize: '1.1rem' }}>
                                {product.price.toFixed(2)} DH
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Filter & Sort Section */}
        <section className="bg-white mb-3 py-3" style={{ borderBottom: '1px solid #e9ecef' }}>
          <div className="container-fluid px-3">
            <div className="row g-2">
              {/* Category Filter */}
              <div className="col-6">
                <label className="elegant-text small fw-medium mb-2 d-block" style={{ color: '#6c757d' }}>
                  <i className="bi bi-funnel me-1"></i>
                  Catégorie
                </label>
                <select 
                  className="form-select elegant-text"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ 
                    borderRadius: '10px',
                    border: '1px solid #e9ecef',
                    fontSize: '0.9rem',
                    padding: '0.6rem'
                  }}
                >
                  <option value="all">Toutes</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Sort */}
              <div className="col-6">
                <label className="elegant-text small fw-medium mb-2 d-block" style={{ color: '#6c757d' }}>
                  <i className="bi bi-sort-down me-1"></i>
                  Trier par
                </label>
                <select 
                  className="form-select elegant-text"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    borderRadius: '10px',
                    border: '1px solid #e9ecef',
                    fontSize: '0.9rem',
                    padding: '0.6rem'
                  }}
                >
                  <option value="newest">Plus récent</option>
                  <option value="price_asc">Prix: Bas → Élevé</option>
                  <option value="price_desc">Prix: Élevé → Bas</option>
                  <option value="name">Nom A-Z</option>
                </select>
              </div>
            </div>

            {/* Active filters display */}
            {(selectedCategory !== 'all' || sortBy !== 'newest') && (
              <div className="mt-3 d-flex align-items-center gap-2 flex-wrap">
                <span className="elegant-text small" style={{ color: '#6c757d' }}>Filtres actifs:</span>
                {selectedCategory !== 'all' && (
                  <span className="badge" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedCategory('all')}>
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <i className="bi bi-x ms-1"></i>
                  </span>
                )}
                {sortBy !== 'newest' && (
                  <span className="badge" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSortBy('newest')}>
                    {sortBy === 'price_asc' ? 'Prix ↑' : sortBy === 'price_desc' ? 'Prix ↓' : 'A-Z'}
                    <i className="bi bi-x ms-1"></i>
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* All Products Grid */}
        <section id="all-products" className="bg-white py-4">
          <div className="container-fluid px-3">
            <h5 className="section-title mb-4 d-flex align-items-center">
              <span className="me-2" style={{ 
                background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                width: '4px',
                height: '24px',
                borderRadius: '2px',
                display: 'inline-block'
              }}></span>
              Notre Collection
            </h5>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: '#667eea' }} role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-3 elegant-text" style={{ color: '#6c757d' }}>Chargement des produits...</p>
              </div>
            ) : allProducts.length === 0 ? (
              <div className="alert" style={{ 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                color: '#6c757d'
              }}>
                <i className="bi bi-info-circle me-2"></i>
                <span className="elegant-text">Aucun produit disponible pour le moment.</span>
              </div>
            ) : (
              <div className="row g-3">
                {allProducts.map((product) => (
                  <div key={product.id} className="col-4 col-md-3 col-lg-2">
                    <div className="card product-card h-100 border-0 shadow-sm position-relative">
                      <Link href={`/product/${product.id}`} className="text-decoration-none">
                        <div className="position-relative">
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="card-img-top"
                            style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                          />
                          {product.promo && product.promo > 0 && (
                            <span className="position-absolute top-0 end-0 badge promo-badge m-2">
                              -{product.promo}%
                            </span>
                          )}
                          {product.is_best_seller && (
                            <span className="position-absolute top-0 start-0 badge elegant-badge m-2">
                              <i className="bi bi-star-fill"></i>
                            </span>
                          )}
                        </div>
                        <div className="card-body p-2">
                          <h6 className="card-title elegant-text small text-truncate mb-2" style={{ color: '#2c3e50', fontWeight: '500' }}>
                            {product.name}
                          </h6>
                          <div className="d-flex flex-column mb-2">
                            {product.promo && product.promo > 0 ? (
                              <>
                                <span className="text-decoration-line-through elegant-text" style={{ fontSize: '0.7rem', color: '#95a5a6' }}>
                                  {product.price.toFixed(2)} DH
                                </span>
                                <span className="price-promo small">
                                  {calculateFinalPrice(product.price, product.promo).toFixed(2)} DH
                                </span>
                              </>
                            ) : (
                              <span className="price-text small">
                                {product.price.toFixed(2)} DH
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="px-2 pb-2">
                        <button
                          onClick={(e) => addToCart(product, e)}
                          className="btn btn-sm w-100 add-to-cart-btn"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            padding: '0.4rem',
                            fontWeight: '600'
                          }}
                        >
                          <i className="bi bi-bag-plus me-1"></i>
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="navbar fixed-bottom bottom-nav d-md-none">
        <div className="container-fluid px-0">
          <div className="d-flex justify-content-around w-100">
            <Link href="/" className="nav-link nav-link-elegant text-center py-2 flex-fill text-decoration-none">
              <i className="bi bi-house-door-fill fs-5 d-block"></i>
              <small className="elegant-text" style={{ fontSize: '0.7rem', fontWeight: '500' }}>Accueil</small>
            </Link>
            <Link href="#all-products" className="nav-link nav-link-elegant text-center py-2 flex-fill text-decoration-none">
              <i className="bi bi-grid-fill fs-5 d-block"></i>
              <small className="elegant-text" style={{ fontSize: '0.7rem', fontWeight: '500' }}>Produits</small>
            </Link>
            <Link href="/cart" className="nav-link nav-link-elegant text-center py-2 flex-fill position-relative text-decoration-none">
              <i className="bi bi-bag-fill fs-5 d-block"></i>
              <small className="elegant-text" style={{ fontSize: '0.7rem', fontWeight: '500' }}>Panier</small>
              {cartCount > 0 && (
                <span className="position-absolute badge promo-badge" 
                  style={{ fontSize: '0.6rem', top: '0', left: '50%', transform: 'translateX(10px)' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
