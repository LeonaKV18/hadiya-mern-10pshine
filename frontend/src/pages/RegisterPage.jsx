import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerApi } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PlumPadIcon } from '../components/ui/Icons';
import styles from './AuthPage.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required.';
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
      const res = await registerApi(form.username, form.email, form.password);
      setSuccess(true);
      toast.success(res.data.message || 'Check your email to verify your account.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}><PlumPadIcon size={26} /></span>
            <div className={styles.brandLockup}>
              <span className={styles.logoText}>PlumPad</span>
              <span className={styles.brandSub}>Your virtual notebook</span>
            </div>
          </div>
          <p className={styles.tagline}>Capture every idea<br />in one place.</p>
          <div className={styles.decorCircle1} />
          <div className={styles.decorCircle2} />
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          {success ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✉</div>
              <h2>Check your inbox</h2>
              <p>We've sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.</p>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <h1 className={styles.heading}>Create Account</h1>
              <p className={styles.subheading}>Start your note-taking journey</p>

              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. jane_smith"
                  error={errors.username}
                  required
                />
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
                  placeholder="Min 8 chars, uppercase, number"
                  error={errors.password}
                  autoComplete="new-password"
                  required
                />

                <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                  Create Account
                </Button>
              </form>

              <p className={styles.switchLink}>
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;