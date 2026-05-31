import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  return (
    <button
      type={type}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className,
      ].join(' ')}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? <span className={styles.spinner} /> : children}
    </button>
  );
};

export default Button;