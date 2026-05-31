import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './AuthPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.password) errs.password = 'Password is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginApi(form.email, form.password);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      if (err.response?.status === 403) {
        toast.error('Please verify your email before logging in.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
  };

  return (
    <div className={styles.page}>
      {/* Left panel — decorative */}
      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>PlumPad</span>
          </div>
          <p className={styles.tagline}>Your thoughts,<br />beautifully organised.</p>
          <div className={styles.decorCircle1} />
          <div className={styles.decorCircle2} />
        </div>
      </div>

      {/* Right panel — form */}
      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <h1 className={styles.heading}>Welcome back</h1>
          <p className={styles.subheading}>Sign in to your notes</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              error={errors.password}
              autoComplete="current-password"
              required
            />

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Sign In
            </Button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button className={styles.googleButton} onClick={handleGoogleLogin} type="button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className={styles.switchLink}>
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;