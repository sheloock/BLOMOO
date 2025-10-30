'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { auth } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Button from './Button';
import Card from './Card';

export default function AuthComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Get initial user
    auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Check your email to confirm your account!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Successfully signed in!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    
    try {
      const { error } = await auth.signOut();
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Successfully signed out!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title="Authentication">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (user) {
    return (
      <Card title="Welcome Back!">
        <div className="text-center">
          <p className="mb-3">
            <i className="bi bi-person-circle fs-1 text-primary"></i>
          </p>
          <p className="mb-3">Signed in as: <strong>{user.email}</strong></p>
          <Button variant="danger" onClick={handleSignOut} disabled={loading}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Sign Out
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Authentication">
      <form onSubmit={handleSignIn}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="d-grid gap-2">
          <Button type="submit" disabled={loading}>
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Sign In
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleSignUp({ preventDefault: () => {} } as React.FormEvent)} 
            disabled={loading}
          >
            <i className="bi bi-person-plus me-2"></i>
            Sign Up
          </Button>
        </div>
      </form>
    </Card>
  );
}