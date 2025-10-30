'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Category } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string; productCount: number } | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCategories(data || []);

      // Fetch product counts for each category
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        
        for (const category of data) {
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          if (!countError && count !== null) {
            counts[category.id] = count;
          }
        }
        
        setProductCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (categoryId: string) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => 
        prev.map(c => 
          c.id === categoryId 
            ? { ...c, is_active: !c.is_active }
            : c
        )
      );
      toast.success('Category status updated');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category status');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // First, check how many products are in this category
      const { count: productCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (countError) throw countError;

      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      // If there are products in this category, show custom modal
      if (productCount && productCount > 0) {
        setCategoryToDelete({ 
          id: categoryId, 
          name: category.name,
          productCount 
        });
        setShowDeleteModal(true);
      } else {
        // No products, just confirm deletion
        if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
          await performCategoryDeletion(categoryId, 0, false);
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('❌ Failed to delete category');
    }
  };

  const performCategoryDeletion = async (categoryId: string, productCount: number, deleteProducts: boolean) => {
    try {
      // If user chose to delete products, delete them first
      if (deleteProducts) {
        const { error: deleteProductsError } = await supabase
          .from('products')
          .delete()
          .eq('category_id', categoryId);

        if (deleteProductsError) throw deleteProductsError;
      } else if (productCount > 0) {
        // Otherwise, set products' category_id to null
        const { error: updateError } = await supabase
          .from('products')
          .update({ category_id: null })
          .eq('category_id', categoryId);

        if (updateError) throw updateError;
      }

      // Now delete the category
      const { error: deleteCategoryError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteCategoryError) throw deleteCategoryError;

      setCategories(prev => prev.filter(category => category.id !== categoryId));
      setProductCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[categoryId];
        return newCounts;
      });
      
      if (deleteProducts && productCount > 0) {
        toast.success(`✅ Category and ${productCount} product${productCount > 1 ? 's' : ''} deleted successfully`);
      } else if (productCount > 0) {
        toast.success(`✅ Category deleted. ${productCount} product${productCount > 1 ? 's are' : ' is'} now uncategorized`);
      } else {
        toast.success('✅ Category deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('❌ Failed to delete category');
    }
  };

  const handleDeleteWithProducts = async () => {
    if (!categoryToDelete) return;
    setShowDeleteModal(false);
    await performCategoryDeletion(categoryToDelete.id, categoryToDelete.productCount, true);
    setCategoryToDelete(null);
  };

  const handleDeleteCategoryOnly = async () => {
    if (!categoryToDelete) return;
    setShowDeleteModal(false);
    await performCategoryDeletion(categoryToDelete.id, categoryToDelete.productCount, false);
    setCategoryToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!newCategory.name.trim()) {
        toast.error('Category name is required');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name,
          description: newCategory.description || null
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [data, ...prev]);
      setProductCounts(prev => ({ ...prev, [data.id]: 0 }));
      setNewCategory({ name: '', description: '' });
      setShowAddForm(false);
      toast.success('Category added successfully');
    } catch (error: any) {
      console.error('Error adding category:', error);
      if (error.code === '23505') {
        toast.error('A category with this name already exists');
      } else {
        toast.error('Failed to add category');
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowAddForm(false);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;

    try {
      if (!editingCategory.name.trim()) {
        toast.error('Category name is required');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          description: editingCategory.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCategory.id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => cat.id === editingCategory.id ? data : cat)
      );
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === '23505') {
        toast.error('A category with this name already exists');
      } else {
        toast.error('Failed to update category');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  return (
    <AdminLayout title="Categories Management">
      {loading && categories.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h5 className="mb-1">Product Categories</h5>
                <p className="text-muted mb-0">{categories.length} categories total</p>
              </div>
              <Button 
                variant="primary"
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingCategory(null);
                }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Add Category
              </Button>
            </div>
          </div>
        </div>

        {/* Add Category Form */}
        {showAddForm && (
          <div className="row mb-4">
            <div className="col-12">
              <Card title="Add New Category">
                <form onSubmit={handleAddCategory}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="name" className="form-label">Category Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="description" className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        id="description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Category description"
                      />
                    </div>
                    <div className="col-12">
                      <div className="d-flex gap-2">
                        <Button type="submit" variant="success" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Adding...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-lg me-2"></i>
                              Add Category
                            </>
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={() => {
                            setShowAddForm(false);
                            setNewCategory({ name: '', description: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* Edit Category Form */}
        {editingCategory && (
          <div className="row mb-4">
            <div className="col-12">
              <Card title="Edit Category">
                <form onSubmit={handleUpdateCategory}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="edit-name" className="form-label">Category Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit-name"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                        placeholder="Enter category name"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-description" className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit-description"
                        value={editingCategory.description || ''}
                        onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                        placeholder="Category description"
                      />
                    </div>
                    <div className="col-12">
                      <div className="d-flex gap-2">
                        <Button type="submit" variant="primary" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-lg me-2"></i>
                              Update Category
                            </>
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* Categories List */}
        <Card title="All Categories">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Category</th>
                  <th>Products Count</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr 
                    key={category.id}
                    className={editingCategory?.id === category.id ? 'table-active' : ''}
                    style={editingCategory?.id === category.id ? { backgroundColor: '#e7f3ff' } : {}}
                  >
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          <i className="bi bi-tags text-muted"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{category.name}</h6>
                          {category.description && (
                            <small className="text-muted">{category.description}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${productCounts[category.id] > 0 ? 'bg-primary' : 'bg-secondary'}`}>
                        {productCounts[category.id] || 0} product{productCounts[category.id] !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={category.is_active}
                          onChange={() => handleToggleStatus(category.id)}
                          disabled={loading}
                        />
                        <label className="form-check-label">
                          {category.is_active ? 'Active' : 'Inactive'}
                        </label>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(category.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => handleEditCategory(category)}
                          disabled={loading}
                          title="Edit category"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={loading}
                          title="Delete category"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {categories.length === 0 && (
              <div className="text-center py-4">
                <i className="bi bi-tags display-4 text-muted mb-3"></i>
                <h5 className="text-muted">No categories found</h5>
                <p className="text-muted mb-3">Create your first category to organize products</p>
                <Button 
                  variant="primary"
                  onClick={() => setShowAddForm(true)}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add First Category
                </Button>
              </div>
            )}
          </div>
        </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
        <>
          <div 
            className="modal show d-block" 
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Delete Category
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={handleCancelDelete}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    This category contains <strong>{categoryToDelete.productCount} product{categoryToDelete.productCount > 1 ? 's' : ''}</strong>!
                  </div>
                  
                  <p className="mb-3">
                    You are about to delete the category <strong>"{categoryToDelete.name}"</strong>.
                  </p>
                  
                  <p className="mb-3">What would you like to do?</p>
                  
                  <div className="d-grid gap-3">
                    <button 
                      className="btn btn-danger btn-lg text-start"
                      onClick={handleDeleteWithProducts}
                    >
                      <i className="bi bi-trash-fill me-2"></i>
                      <strong>Delete Category + {categoryToDelete.productCount} Product{categoryToDelete.productCount > 1 ? 's' : ''}</strong>
                      <div className="small mt-1">
                        Permanently delete the category and all its products
                      </div>
                    </button>
                    
                    <button 
                      className="btn btn-warning btn-lg text-start"
                      onClick={handleDeleteCategoryOnly}
                    >
                      <i className="bi bi-folder-x me-2"></i>
                      <strong>Delete Only Category</strong>
                      <div className="small mt-1">
                        Keep products but make them uncategorized
                      </div>
                    </button>
                    
                    <button 
                      className="btn btn-secondary btn-lg"
                      onClick={handleCancelDelete}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}