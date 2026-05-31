import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import styles from './VerifyEmailPage.module.css';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. You can now log in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.logoIcon}>✦</span>
        <h1 className={styles.appName}>PlumPad</h1>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p>Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.iconSuccess}>✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <Link to="/login" className={styles.loginLink}>Sign In</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.iconError}>✕</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <Link to="/login" className={styles.loginLink}>Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;