'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Category } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    promo: '',
    is_best_seller: false,
    category_id: '',
    is_active: true,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // No limit - unlimited images
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validation
      if (!formData.name.trim()) {
        toast.error('Product name is required');
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error('Valid price is required');
        return;
      }

      if (!formData.stock || parseInt(formData.stock) < 0) {
        toast.error('Valid stock quantity is required');
        return;
      }

      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const loadingToast = toast.loading('Uploading images...');
        try {
          imageUrls = await uploadImages();
          toast.dismiss(loadingToast);
        } catch (error) {
          toast.dismiss(loadingToast);
          throw new Error('Failed to upload images');
        }
      }

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        promo: formData.promo.trim() || null,
        is_best_seller: formData.is_best_seller,
        category_id: formData.category_id || null,
        images: imageUrls,
        is_active: formData.is_active,
      };

      // Insert product
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add New Product">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">Add New Product</h5>
                <p className="text-muted mb-0">Fill in the details to create a new product</p>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/admin/products')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Products
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Main Product Info */}
                <div className="col-lg-8">
                  <Card title="Product Information">
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="name" className="form-label">
                          Product Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter product name"
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="description" className="form-label">
                          Description
                        </label>
                        <textarea
                          className="form-control"
                          id="description"
                          rows={4}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter product description"
                        />
                      </div>

                      <div className="col-md-4">
                        <label htmlFor="price" className="form-label">
                          Price (MAD) <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">MAD</span>
                          <input
                            type="number"
                            className="form-control"
                            id="price"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label htmlFor="stock" className="form-label">
                          Stock Quantity <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="stock"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          min="0"
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label htmlFor="promo" className="form-label">
                          Promo (e.g., 15%, 20%)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="promo"
                          value={formData.promo}
                          onChange={(e) => setFormData({ ...formData, promo: e.target.value })}
                          placeholder="e.g., 15%"
                        />
                        <small className="text-muted">Leave empty for no promotion</small>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="category_id" className="form-label">
                          Category
                        </label>
                        <select
                          className="form-select"
                          id="category_id"
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        >
                          <option value="">No Category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Options</label>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="is_best_seller"
                            checked={formData.is_best_seller}
                            onChange={(e) => setFormData({ ...formData, is_best_seller: e.target.checked })}
                          />
                          <label className="form-check-label" htmlFor="is_best_seller">
                            Mark as Best Seller
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Product Images */}
                  <Card title="Product Images" className="mt-4">
                    <div className="mb-3">
                      <label htmlFor="images" className="form-label">
                        Upload Images (Unlimited)
                      </label>
                      <div className="border border-2 border-dashed rounded p-4 text-center">
                        <input
                          type="file"
                          className="form-control"
                          id="images"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          multiple
                          onChange={handleImageChange}
                        />
                        <div className="mt-2">
                          <i className="bi bi-cloud-upload fs-3 text-muted"></i>
                          <p className="mb-0 mt-2 text-muted">
                            Select images to upload
                          </p>
                        </div>
                      </div>
                      <small className="text-muted d-block mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        {imageFiles.length} image(s) selected. Supported: JPG, PNG, GIF, WebP (Max 5MB each)
                      </small>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div>
                        <label className="form-label fw-bold">Selected Images</label>
                        <div className="row g-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="col-md-4 col-6">
                              <div className="position-relative">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="img-thumbnail w-100"
                                  style={{ height: '150px', objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                  onClick={() => removeImage(index)}
                                  title="Remove image"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                                {index === 0 && (
                                  <span className="badge bg-primary position-absolute bottom-0 start-0 m-2">
                                    Main Image
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imagePreviews.length === 0 && (
                      <div className="text-center text-muted py-4">
                        <i className="bi bi-image display-4"></i>
                        <p className="mt-2">No images selected</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                  <Card title="Product Settings">
                    <div className="mb-3">
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active Product
                        </label>
                      </div>
                      <small className="text-muted">
                        Inactive products won't be visible to customers
                      </small>
                    </div>
                  </Card>

                  {/* Actions */}
                  <Card title="Actions">
                    <div className="d-grid gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Creating...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            Create Product
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/admin/products')}
                        disabled={loading}
                      >
                        <i className="bi bi-x-lg me-2"></i>
                        Cancel
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}