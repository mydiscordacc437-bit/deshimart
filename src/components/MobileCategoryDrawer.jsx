// src/components/MobileCategoryDrawer.jsx
import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function MobileCategoryDrawer({
  isOpen,
  onClose,
  categories,
  activeCategory,
  onSelectCategory
}) {
  if (!isOpen) return null;

  return (
    <div className="category-drawer-overlay fade-in" onClick={onClose}>
      <div className="category-drawer-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="drawer-header">
          <div className="drawer-title-box">
            <span className="drawer-icon">☰</span>
            <h3 className="drawer-title">ক্যাটাগরি সমূহ</h3>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="বন্ধ করুন">
            ✕
          </button>
        </div>

        <div className="category-drawer-list">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`drawer-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                onSelectCategory(cat.id);
                onClose();
                const target = document.getElementById('product-catalog-section');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="cat-btn-left">
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-title">{cat.name}</span>
              </div>
              <span className="cat-badge-count num">{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="drawer-bottom-info">
          <p>📞 হেল্পলাইন: <span className="num">{siteConfig.displayHelpline}</span></p>
          <p>🚚 সারাদেশে ক্যাশ অন ডেলিভারি</p>
        </div>

      </div>
    </div>
  );
}
