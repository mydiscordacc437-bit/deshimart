// src/components/SocialProofToast.jsx
import React, { useState, useEffect } from 'react';
import { recentPurchaseNotifications } from '../data/products';

export default function SocialProofToast({ isEnabled = true }) {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setIsVisible(false);
      return;
    }

    let hideTimer = null;

    // Trigger notification every 25 seconds
    const intervalTimer = setInterval(() => {
      // Pick random notification
      const randomIndex = Math.floor(Math.random() * recentPurchaseNotifications.length);
      const item = recentPurchaseNotifications[randomIndex];
      
      setCurrentNotification(item);
      setIsVisible(true);

      // Dismiss after 4 seconds per prompt
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);

    }, 25000);

    // Initial trigger after 4 seconds on page load
    const initialTimer = setTimeout(() => {
      const item = recentPurchaseNotifications[0];
      setCurrentNotification(item);
      setIsVisible(true);
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    }, 4000);

    return () => {
      clearInterval(intervalTimer);
      clearTimeout(initialTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isEnabled]);

  if (!isEnabled || !isVisible || !currentNotification) return null;

  return (
    <div className="social-proof-toast fade-in" role="status">
      <div className="toast-pulse-dot"></div>
      <div className="toast-content">
        <p className="toast-text">
          <span className="celebration">🎉</span> এইমাত্র <strong>{currentNotification.city}</strong> থেকে <strong>{currentNotification.customer}</strong> '{currentNotification.product}' অর্ডার করেছেন!
        </p>
        <span className="toast-time">কয়েক সেকেন্ড আগে • ক্যাশ অন ডেলিভারি</span>
      </div>
      <button 
        type="button" 
        className="toast-dismiss-btn" 
        onClick={() => setIsVisible(false)}
        aria-label="বিজ্ঞপ্তি বন্ধ করুন"
      >
        ✕
      </button>
    </div>
  );
}
