'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'created_at'>('created_at');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && product.is_active) ||
        (filterStatus === 'inactive' && !product.is_active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const handleToggleStatus = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => 
        prev.map(p => 
          p.id === productId 
            ? { ...p, is_active: !p.is_active }
            : p
        )
      );
      toast.success('Product status updated');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', class: 'danger' };
    if (stock <= 5) return { text: 'Low Stock', class: 'warning' };
    return { text: 'In Stock', class: 'success' };
  };

  return (
    <AdminLayout title="Products Management">
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
        {/* Header Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h5 className="mb-1">All Products</h5>
                <p className="text-muted mb-0">{filteredProducts.length} products found</p>
              </div>
              <Link href="/admin/products/new">
                <Button variant="primary">
                  <i className="bi bi-plus-lg me-2"></i>
                  Add New Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label htmlFor="search" className="form-label">Search Products</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="search"
                  placeholder="Search by name..."
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
                <option value="all">All Products</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
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
                <option value="name">Name A-Z</option>
                <option value="price">Price High-Low</option>
                <option value="stock">Stock High-Low</option>
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

          {/* Products Table */}
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded me-3 overflow-hidden" style={{ width: '50px', height: '50px', minWidth: '50px' }}>
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/placeholder-product.jpg';
                                }}
                              />
                            ) : (
                              <i className="bi bi-image d-flex align-items-center justify-content-center h-100 text-muted"></i>
                            )}
                          </div>
                          <div>
                            <h6 className="mb-1">{product.name}</h6>
                            <small className="text-muted">
                              {product.description?.substring(0, 50)}{product.description && product.description.length > 50 ? '...' : ''}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {product.promo ? (
                            <>
                              <strong className="text-danger">{product.price} MAD</strong>
                              <span className="badge bg-success ms-2">{product.promo} OFF</span>
                            </>
                          ) : (
                            <strong>{product.price} MAD</strong>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${stockStatus.class}`}>
                          {product.stock} - {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={product.is_active}
                            onChange={() => handleToggleStatus(product.id)}
                          />
                          <label className="form-check-label">
                            {product.is_active ? 'Active' : 'Inactive'}
                          </label>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(product.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link href={`/admin/products/${product.id}`}>
                            <button className="btn btn-outline-primary">
                              <i className="bi bi-eye"></i>
                            </button>
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <button className="btn btn-outline-secondary">
                              <i className="bi bi-pencil"></i>
                            </button>
                          </Link>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-4">
                <i className="bi bi-box-seam display-4 text-muted mb-3"></i>
                <h5 className="text-muted">No products found</h5>
                <p className="text-muted mb-3">Try adjusting your search or filters</p>
                <Link href="/admin/products/new">
                  <Button variant="primary">
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
      )}
    </AdminLayout>
  );
}