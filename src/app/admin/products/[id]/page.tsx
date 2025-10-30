'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

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
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductViewPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (productData) {
        setProduct(productData);
        // Set first image as selected
        if (productData.images && productData.images.length > 0) {
          setSelectedImage(productData.images[0]);
        }

        // Fetch category if exists
        if (productData.category_id) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name')
            .eq('id', productData.category_id)
            .single();

          if (categoryData) {
            setCategory(categoryData);
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product deleted successfully');
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/assets/placeholder-product.jpg';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imagePath);
    
    return data.publicUrl || '/assets/placeholder-product.jpg';
  };

  if (loading) {
    return (
      <AdminLayout title="Loading Product...">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout title="Product Not Found">
        <div className="text-center py-5">
          <h3>Product not found</h3>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => router.push('/admin/products')}
          >
            Back to Products
          </button>
        </div>
      </AdminLayout>
    );
  }

  const finalPrice = product.promo && product.promo > 0 
    ? product.price - (product.price * product.promo / 100)
    : product.price;

  return (
    <AdminLayout title={`View Product - ${product.name}`}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">{product.name}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/admin/dashboard" className="text-decoration-none">Dashboard</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="/admin/products" className="text-decoration-none">Products</a>
                </li>
                <li className="breadcrumb-item active">{product.name}</li>
              </ol>
            </nav>
          </div>
          <div>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={() => router.push('/admin/products')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back
            </button>
            <button
              className="btn btn-primary me-2"
              onClick={() => router.push(`/admin/products/${productId}/edit`)}
            >
              <i className="bi bi-pencil me-2"></i>
              Edit
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
            >
              <i className="bi bi-trash me-2"></i>
              Delete
            </button>
          </div>
        </div>

        <div className="row">
          {/* Product Images */}
          <div className="col-lg-5">
            <div className="card mb-4">
              <div className="card-body">
                {/* Main Image */}
                <div className="mb-3">
                  <img
                    src={getImageUrl(selectedImage || product.images[0] || '')}
                    alt={product.name}
                    className="img-fluid rounded"
                    style={{ 
                      width: '100%', 
                      height: '400px', 
                      objectFit: 'cover',
                      border: '1px solid #dee2e6'
                    }}
                  />
                </div>

                {/* Image Thumbnails */}
                {product.images && product.images.length > 1 && (
                  <div className="d-flex gap-2 flex-wrap">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(image)}
                        style={{
                          cursor: 'pointer',
                          border: selectedImage === image ? '2px solid #0d6efd' : '1px solid #dee2e6',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          width: '80px',
                          height: '80px'
                        }}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`${product.name} ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {(!product.images || product.images.length === 0) && (
                  <div className="text-center text-muted">
                    <i className="bi bi-image" style={{ fontSize: '48px' }}></i>
                    <p className="mt-2 mb-0">No images available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="col-lg-7">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">Product Information</h5>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Product Name</label>
                    <p className="mb-0 fw-semibold">{product.name}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Category</label>
                    <p className="mb-0">
                      {category ? (
                        <span className="badge bg-primary">{category.name}</span>
                      ) : (
                        <span className="text-muted">Uncategorized</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Price</label>
                    <p className="mb-0">
                      {product.promo && product.promo > 0 ? (
                        <>
                          <span className="text-decoration-line-through text-muted me-2">
                            {product.price.toFixed(2)} MAD
                          </span>
                          <span className="text-success fw-bold">
                            {finalPrice.toFixed(2)} MAD
                          </span>
                          <span className="badge bg-danger ms-2">-{product.promo}%</span>
                        </>
                      ) : (
                        <span className="fw-bold">{product.price.toFixed(2)} MAD</span>
                      )}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Stock</label>
                    <p className="mb-0">
                      <span className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                        {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-muted small mb-1">Description</label>
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {product.description || <span className="text-muted">No description provided</span>}
                  </p>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Best Seller</label>
                    <p className="mb-0">
                      {product.is_best_seller ? (
                        <span className="badge bg-success">
                          <i className="bi bi-star-fill me-1"></i>
                          Yes
                        </span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Product ID</label>
                    <p className="mb-0">
                      <code className="text-muted small">{product.id}</code>
                    </p>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="row">
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Created At</label>
                    <p className="mb-0">
                      {new Date(product.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small mb-1">Last Updated</label>
                    <p className="mb-0">
                      {new Date(product.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <i className="bi bi-currency-dollar text-primary" style={{ fontSize: '24px' }}></i>
                    <h6 className="mt-2 mb-0">Price</h6>
                    <p className="mb-0 fw-bold">{finalPrice.toFixed(2)} MAD</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <i className="bi bi-box-seam text-success" style={{ fontSize: '24px' }}></i>
                    <h6 className="mt-2 mb-0">Stock</h6>
                    <p className="mb-0 fw-bold">{product.stock} units</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <i className="bi bi-images text-info" style={{ fontSize: '24px' }}></i>
                    <h6 className="mt-2 mb-0">Images</h6>
                    <p className="mb-0 fw-bold">{product.images?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
