import React from 'react';
import styles from './Input.module.css';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  autoComplete,
  name,
}) => {
  return (
    <div className={styles.group}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={[styles.input, error ? styles.hasError : ''].join(' ')}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default Input;