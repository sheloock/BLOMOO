'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { auth, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [formData, setFormData] = useState({
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user }, error } = await auth.getUser();
      if (error) throw error;
      
      if (user?.email) {
        setCurrentEmail(user.email);
        setFormData(prev => ({ ...prev, newEmail: user.email || '' }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.newEmail || !formData.currentPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.newEmail === currentEmail) {
      toast.error('New email is the same as current email');
      return;
    }

    try {
      setLoading(true);

      // Verify current password by attempting to sign in
      const { error: signInError } = await auth.signInWithPassword({
        email: currentEmail,
        password: formData.currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // Update email
      const { error: updateError } = await auth.updateUser({
        email: formData.newEmail
      });

      if (updateError) throw updateError;

      toast.success('Email updated successfully! Please check your new email to confirm.');
      setCurrentEmail(formData.newEmail);
      setFormData(prev => ({ ...prev, currentPassword: '' }));
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast.error(error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);

      // Verify current password by attempting to sign in
      const { error: signInError } = await auth.signInWithPassword({
        email: currentEmail,
        password: formData.currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-1">Account Settings</h5>
            <p className="text-muted mb-0">Manage your account email and password</p>
          </div>
        </div>

        <div className="row g-4">
          {/* Update Email Section */}
          <div className="col-lg-6">
            <Card title="Update Email">
              <form onSubmit={handleUpdateEmail}>
                <div className="mb-3">
                  <label htmlFor="currentEmail" className="form-label">Current Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="currentEmail"
                    value={currentEmail}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                  <small className="text-muted">This is your current login email</small>
                </div>

                <div className="mb-3">
                  <label htmlFor="newEmail" className="form-label">New Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    id="newEmail"
                    value={formData.newEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder="Enter new email address"
                    required
                  />
                  <small className="text-muted">You'll need to confirm this email</small>
                </div>

                <div className="mb-4">
                  <label htmlFor="emailPassword" className="form-label">Current Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    id="emailPassword"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                    required
                  />
                  <small className="text-muted">Required to verify your identity</small>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating Email...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-envelope me-2"></i>
                      Update Email
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Update Password Section */}
          <div className="col-lg-6">
            <Card title="Update Password">
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-3">
                  <label htmlFor="currentPasswordField" className="form-label">Current Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPasswordField"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                  <small className="text-muted">Must be at least 6 characters</small>
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                  <small className={`${
                    formData.newPassword && formData.confirmPassword
                      ? formData.newPassword === formData.confirmPassword
                        ? 'text-success'
                        : 'text-danger'
                      : 'text-muted'
                  }`}>
                    {formData.newPassword && formData.confirmPassword
                      ? formData.newPassword === formData.confirmPassword
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'
                      : 'Re-enter your new password'
                    }
                  </small>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading || (formData.newPassword !== formData.confirmPassword)}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-lock me-2"></i>
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* Security Tips */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="alert alert-info">
              <h6 className="alert-heading">
                <i className="bi bi-info-circle me-2"></i>
                Security Tips
              </h6>
              <ul className="mb-0 small">
                <li>Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols</li>
                <li>Never share your password with anyone</li>
                <li>Change your password regularly for better security</li>
                <li>If you change your email, you'll need to confirm it before you can log in with the new address</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
