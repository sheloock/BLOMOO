'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Category, Product } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          description: data.description || '',
          price: data.price.toString(),
          stock: data.stock.toString(),
          promo: data.promo || '',
          is_best_seller: data.is_best_seller,
          category_id: data.category_id || '',
          is_active: data.is_active,
        });
        setExistingImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // No limit - unlimited images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
    setImageFiles([...imageFiles, ...files]);
  };

  const removeNewImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
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
      setSaving(true);

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

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const loadingToast = toast.loading('Uploading new images...');
        try {
          newImageUrls = await uploadImages();
          toast.dismiss(loadingToast);
        } catch (error) {
          toast.dismiss(loadingToast);
          throw new Error('Failed to upload images');
        }
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        promo: formData.promo.trim() || null,
        is_best_seller: formData.is_best_seller,
        category_id: formData.category_id || null,
        images: allImages,
        is_active: formData.is_active,
      };

      // Update product
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product updated successfully!');
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Product">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <Button 
              variant="secondary"
              onClick={() => router.back()}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Products
            </Button>
          </div>
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
                    <label htmlFor="description" className="form-label">Description</label>
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
                    <input
                      type="number"
                      className="form-control"
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
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
                      placeholder="0"
                      min="0"
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
                    <label htmlFor="category" className="form-label">Category</label>
                    <select
                      className="form-select"
                      id="category"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">No Category</option>
                      {categories.map((category) => (
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
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active (Visible to customers)
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Image Upload */}
            <div className="col-lg-4">
              <Card title="Product Images">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <label className="form-label fw-bold text-success">
                      <i className="bi bi-check-circle me-2"></i>Current Images
                    </label>
                    <div className="row g-2">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="col-6">
                          <div className="position-relative">
                            <img
                              src={imageUrl}
                              alt={`Current ${index + 1}`}
                              className="img-thumbnail w-100"
                              style={{ height: '150px', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/placeholder-product.jpg';
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                              onClick={() => removeExistingImage(index)}
                              title="Remove image"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            {index === 0 && (
                              <span className="badge bg-success position-absolute bottom-0 start-0 m-2">
                                Main Image
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                <div className="mb-3">
                  <label htmlFor="images" className="form-label fw-bold">
                    {existingImages.length > 0 ? 'Add More Images' : 'Upload Images'}
                  </label>
                  <div className="border border-2 border-dashed rounded p-3 text-center">
                    <input
                      type="file"
                      className="form-control"
                      id="images"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleImageChange}
                    />
                    <div className="mt-2">
                      <i className="bi bi-cloud-upload fs-4 text-muted"></i>
                      <p className="mb-0 mt-2 small text-muted">
                        Select images to upload
                      </p>
                    </div>
                  </div>
                  <small className="text-muted d-block mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    {existingImages.length + imageFiles.length} image(s) total. Unlimited images allowed.
                  </small>
                </div>

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-bold text-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>New Images (Not saved yet)
                    </label>
                    <div className="row g-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="col-6">
                          <div className="position-relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="img-thumbnail w-100 border-warning"
                              style={{ height: '150px', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                              onClick={() => removeNewImage(index)}
                              title="Remove new image"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            <span className="badge bg-warning text-dark position-absolute bottom-0 start-0 m-2">
                              New
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {existingImages.length === 0 && imagePreviews.length === 0 && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-image display-4"></i>
                    <p className="mt-2">No images</p>
                  </div>
                )}
              </Card>

              {/* Submit Buttons */}
              <div className="mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
