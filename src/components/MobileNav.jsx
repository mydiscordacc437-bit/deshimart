// src/components/MobileNav.jsx
import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function MobileNav({ 
  cartCount, 
  onOpenCart, 
  onToggleCategories 
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="মোবাইল নেভিগেশন">
      <button 
        type="button" 
        className="mobile-nav-item"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-text">হোম</span>
      </button>

      <button 
        type="button" 
        className="mobile-nav-item"
        onClick={onToggleCategories}
      >
        <span className="nav-icon">☰</span>
        <span className="nav-text">ক্যাটাগরি</span>
      </button>

      <button 
        type="button" 
        className="mobile-nav-item cart-nav-item"
        onClick={onOpenCart}
      >
        <div className="nav-icon-wrap">
          <span className="nav-icon">🛒</span>
          {cartCount > 0 && (
            <span className="mobile-cart-badge num">{cartCount}</span>
          )}
        </div>
        <span className="nav-text">কার্ট</span>
      </button>

      <a 
        href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি অর্ডার সংক্রান্ত তথ্য জানতে চাই।')}`}
        target="_blank" 
        rel="noopener noreferrer"
        className="mobile-nav-item whatsapp-nav-item"
      >
        <span className="nav-icon">💬</span>
        <span className="nav-text">হোয়াটসঅ্যাপ</span>
      </a>
    </nav>
  );
}
