import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../api/user';

// This page handles the redirect back from Google OAuth
// The backend redirects to /auth-callback?token=<jwt>
const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Temporarily store the token so the API client can use it
    localStorage.setItem('token', token);

    getProfile()
      .then((res) => {
        login(res.data.user, token);
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=oauth_failed');
      });
  }, [searchParams, login, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: 'var(--color-text-muted)' }}>Signing you in...</p>
    </div>
  );
};

export default AuthCallbackPage;