'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

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

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setProductId(id);
    });
  }, [params]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      if (!productId) return;
      
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError) throw productError;
      if (!productData) {
        toast.error('Produit non trouvé');
        router.push('/');
        return;
      }

      setProduct(productData);

      // Fetch category
      if (productData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('id', productData.category_id)
          .single();
        
        if (categoryData) setCategory(categoryData);

        // Fetch related products from same category
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', productData.category_id)
          .eq('is_active', true)
          .neq('id', productId)
          .limit(4);
        
        if (relatedData) setRelatedProducts(relatedData);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Erreur lors du chargement');
      router.push('/');
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

  const addToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        toast.error(`Stock disponible: ${product.stock}`);
        return;
      }
      existingItem.quantity = newQuantity;
    } else {
      if (quantity > product.stock) {
        toast.error(`Stock disponible: ${product.stock}`);
        return;
      }
      cart.push({ id: product.id, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Ajouté au panier!');
    
    // Trigger cart count update
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const buyNow = () => {
    addToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="spinner-border" style={{ color: '#667eea' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 elegant-text" style={{ color: '#6c757d' }}>Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const finalPrice = calculateFinalPrice(product.price, product.promo);
  const savings = product.promo ? product.price - finalPrice : 0;

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
        
        .elegant-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          border-radius: 10px;
          padding: 0.8rem 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .elegant-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .quantity-btn {
          width: 40px;
          height: 40px;
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
        
        .product-card {
          transition: all 0.3s ease;
          border-radius: 12px;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important;
        }
        
        .swiper-button-next,
        .swiper-button-prev {
          color: #667eea !important;
          background: white;
          width: 40px !important;
          height: 40px !important;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 16px !important;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm sticky-top" style={{ borderBottom: '1px solid #e9ecef' }}>
        <div className="container-fluid px-3 py-3">
          <div className="d-flex align-items-center justify-content-between">
            <Link href="/" className="text-decoration-none d-flex align-items-center">
              <i className="bi bi-arrow-left fs-5 me-2" style={{ color: '#667eea' }}></i>
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ height: '45px', width: 'auto' }}
              />
            </Link>
            
            <Link href="/cart" className="position-relative">
              <i className="bi bi-bag fs-4" style={{ color: '#667eea' }}></i>
            </Link>
          </div>
        </div>
      </header>

      <main className="container-fluid px-3 py-4">
        <div className="row g-4">
          {/* Product Images */}
          <div className="col-12 col-lg-6">
            <div className="bg-white p-3 rounded shadow-sm">
              {product.images && product.images.length > 0 ? (
                <>
                  <Swiper
                    modules={[Navigation, Pagination, Thumbs]}
                    navigation
                    pagination={{ clickable: true }}
                    thumbs={{ swiper: thumbsSwiper }}
                    className="mb-3"
                    style={{ borderRadius: '12px' }}
                  >
                    {product.images.map((image, index) => (
                      <SwiperSlide key={index}>
                        <img
                          src={getImageUrl(image)}
                          alt={`${product.name} ${index + 1}`}
                          className="w-100"
                          style={{ aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px' }}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {product.images.length > 1 && (
                    <Swiper
                      modules={[Thumbs]}
                      onSwiper={setThumbsSwiper}
                      spaceBetween={10}
                      slidesPerView={4}
                      watchSlidesProgress
                    >
                      {product.images.map((image, index) => (
                        <SwiperSlide key={index} style={{ cursor: 'pointer' }}>
                          <img
                            src={getImageUrl(image)}
                            alt={`Thumb ${index + 1}`}
                            className="w-100"
                            style={{ 
                              aspectRatio: '1/1', 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              border: '2px solid #e9ecef'
                            }}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  )}
                </>
              ) : (
                <img
                  src="/assets/placeholder-product.jpg"
                  alt={product.name}
                  className="w-100"
                  style={{ aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px' }}
                />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="col-12 col-lg-6">
            <div className="bg-white p-4 rounded shadow-sm">
              {/* Badges */}
              <div className="mb-3">
                {product.is_best_seller && (
                  <span className="badge me-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <i className="bi bi-star-fill me-1"></i>
                    Meilleure vente
                  </span>
                )}
                {category && (
                  <span className="badge" style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}>
                    {category.name}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h1 className="section-title h3 mb-3">{product.name}</h1>

              {/* Price */}
              <div className="mb-4">
                {product.promo && product.promo > 0 ? (
                  <>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <span className="price-promo h2 mb-0">
                        {finalPrice.toFixed(2)} DH
                      </span>
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        -{product.promo}%
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-decoration-line-through elegant-text" style={{ color: '#95a5a6', fontSize: '1.2rem' }}>
                        {product.price.toFixed(2)} DH
                      </span>
                      <span className="elegant-text text-success">
                        Économisez {savings.toFixed(2)} DH
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="price-text h2 mb-0">
                    {product.price.toFixed(2)} DH
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-4">
                {product.stock > 0 ? (
                  <div className="d-flex align-items-center">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    <span className="elegant-text" style={{ color: '#2c3e50' }}>
                      En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})
                    </span>
                  </div>
                ) : (
                  <div className="d-flex align-items-center">
                    <i className="bi bi-x-circle-fill text-danger me-2"></i>
                    <span className="elegant-text text-danger">
                      Rupture de stock
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="mb-4">
                  <label className="elegant-text fw-medium mb-2 d-block" style={{ color: '#6c757d' }}>
                    Quantité
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <button
                      className="quantity-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    
                    <span className="elegant-text fw-bold fs-5" style={{ minWidth: '40px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    
                    <button
                      className="quantity-btn"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {product.stock > 0 ? (
                <div className="d-flex flex-column gap-2 mb-4">
                  <button 
                    onClick={addToCart}
                    className="btn elegant-button w-100"
                  >
                    <i className="bi bi-bag-plus me-2"></i>
                    Ajouter au panier
                  </button>
                  <button 
                    onClick={buyNow}
                    className="btn btn-outline-secondary w-100"
                    style={{ borderRadius: '10px', fontWeight: '600' }}
                  >
                    <i className="bi bi-lightning-fill me-2"></i>
                    Acheter maintenant
                  </button>
                </div>
              ) : (
                <button className="btn btn-secondary w-100 mb-4" disabled style={{ borderRadius: '10px' }}>
                  <i className="bi bi-x-circle me-2"></i>
                  Produit indisponible
                </button>
              )}

              {/* Features */}
              <div className="border-top pt-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-truck me-2" style={{ color: '#667eea' }}></i>
                  <span className="elegant-text small">Livraison gratuite</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-shield-check me-2" style={{ color: '#667eea' }}></i>
                  <span className="elegant-text small">Paiement sécurisé</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-arrow-return-left me-2" style={{ color: '#667eea' }}></i>
                  <span className="elegant-text small">Retour sous 7 jours</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white p-4 rounded shadow-sm mt-3">
                <h5 className="section-title mb-3">Description</h5>
                <p className="elegant-text" style={{ color: '#6c757d', lineHeight: '1.7' }}>
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-5">
            <h4 className="section-title mb-4">Produits similaires</h4>
            <div className="row g-3">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="col-6 col-md-3">
                  <Link href={`/product/${relatedProduct.id}`} className="text-decoration-none">
                    <div className="card product-card h-100 border-0 shadow-sm">
                      <div className="position-relative">
                        <img
                          src={getImageUrl(relatedProduct.images[0])}
                          alt={relatedProduct.name}
                          className="card-img-top"
                          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                        />
                        {relatedProduct.promo && relatedProduct.promo > 0 && (
                          <span className="position-absolute top-0 end-0 badge m-2" 
                            style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            -{relatedProduct.promo}%
                          </span>
                        )}
                      </div>
                      <div className="card-body p-3">
                        <h6 className="card-title elegant-text small text-truncate mb-2" style={{ color: '#2c3e50' }}>
                          {relatedProduct.name}
                        </h6>
                        <div className="d-flex flex-column">
                          {relatedProduct.promo && relatedProduct.promo > 0 ? (
                            <>
                              <span className="text-decoration-line-through elegant-text" style={{ fontSize: '0.75rem', color: '#95a5a6' }}>
                                {relatedProduct.price.toFixed(2)} DH
                              </span>
                              <span className="price-promo small">
                                {calculateFinalPrice(relatedProduct.price, relatedProduct.promo).toFixed(2)} DH
                              </span>
                            </>
                          ) : (
                            <span className="price-text small">
                              {relatedProduct.price.toFixed(2)} DH
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
