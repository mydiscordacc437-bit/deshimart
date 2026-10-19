// src/components/Toast.jsx
import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification ${type} fade-in`} role="alert">
      <span className="toast-icon">
        {type === 'success' ? '✅' : type === 'info' ? 'ℹ️' : '⚠️'}
      </span>
      <span className="toast-text">{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="বন্ধ করুন">
        ✕
      </button>
    </div>
  );
}
