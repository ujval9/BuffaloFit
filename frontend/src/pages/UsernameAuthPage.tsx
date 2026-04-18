import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { usernameLogin } from '../api/auth';
import './Auth.css';

export default function UsernameAuthPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (!user.onboarding_done) {
        // We're skipping onboarding for this demo mode, so we update the user object
        // and navigate directly to home
        const updatedUser = { ...user, onboarding_done: true };
        setUser(updatedUser);
        navigate('/');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dbUser = await usernameLogin(username.trim());
      // Force onboarding to be done for a smoother demo experience
      const userToStore = { ...dbUser, onboarding_done: true };
      setUser(userToStore);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Failed to login / create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo-wrapper">
          <div className="auth-emoji">🦬</div>
        </div>
        
        <h1 className="auth-title">Welcome to BuffaloFit</h1>
        <p className="auth-subtitle">
          Your fast, premium outfit & laundry planner.
          <br/>
          <strong>Enter any username to get started immediately.</strong>
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="e.g. OskiBear"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
