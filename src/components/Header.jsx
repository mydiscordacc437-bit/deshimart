// src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';

export default function Header({ 
  cartCount, 
  onOpenCart, 
  searchTerm, 
  onSearchChange, 
  products, 
  onSelectProduct,
  onToggleMobileMenu 
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Filter matched products for instant auto-complete
  const filteredProducts = searchTerm.trim().length > 0 
    ? products.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearchOpen(false);
  };

  return (
    <header className="main-header">
      <div className="container header-container">
        
        {/* Mobile menu trigger */}
        <button 
          className="mobile-menu-btn" 
          onClick={onToggleMobileMenu}
          aria-label="ক্যাটাগরি মেনু খুলুন"
        >
          <span className="hamburger-icon">☰</span>
        </button>

        {/* Brand Logo */}
        <div className="brand-logo-wrap">
          <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="logo-icon-badge">🛒</span>
            <span className="logo-text">
              {siteConfig.logoText} <span className="logo-highlight">{siteConfig.logoHighlight}</span>
            </span>
          </a>
          <span className="brand-subtext desktop-only">{siteConfig.tagline}</span>
        </div>

        {/* Live Search Bar */}
        <div className="search-bar-wrap" ref={searchRef}>
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="আপনার পছন্দের পণ্য খুঁজুন (Search products...)"
                value={searchTerm}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  className="search-clear-btn" 
                  onClick={() => onSearchChange('')}
                  aria-label="মুছে ফেলুন"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="search-submit-btn">
              <span>খুঁজুন</span>
            </button>
          </form>

          {/* Instant Auto-complete Dropdown */}
          {isSearchOpen && filteredProducts.length > 0 && (
            <div className="search-results-dropdown fade-in">
              <div className="dropdown-header">পাওয়া গেছে ({filteredProducts.length} টি পণ্য):</div>
              <ul className="dropdown-list">
                {filteredProducts.map(item => (
                  <li 
                    key={item.id} 
                    className="dropdown-item"
                    onClick={() => {
                      onSelectProduct(item);
                      setIsSearchOpen(false);
                    }}
                  >
                    <img src={item.image} alt={item.title} className="dropdown-item-thumb" />
                    <div className="dropdown-item-info">
                      <h4 className="dropdown-item-title">{item.title}</h4>
                      <div className="dropdown-item-meta">
                        <span className="dropdown-price">{siteConfig.currencySymbol}{item.price}</span>
                        {item.originalPrice && (
                          <span className="dropdown-original-price">~{siteConfig.currencySymbol}{item.originalPrice}~</span>
                        )}
                        <span className="dropdown-category">{item.categoryName}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* WhatsApp Direct Help */}
          <a 
            href={`https://wa.me/${siteConfig.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-whatsapp-btn desktop-only"
            title="সরাসরি হোয়াটসঅ্যাপে কথা বলুন"
          >
            <span className="wa-icon">💬</span>
            <div className="wa-text-box">
              <span className="wa-small">প্রয়োজনে কল/মেসেজ</span>
              <span className="wa-number num">{siteConfig.displayHelpline}</span>
            </div>
          </a>

          {/* Cart Button per wireframe: [🛒 2] */}
          <button 
            type="button" 
            className="cart-trigger-btn"
            onClick={onOpenCart}
            aria-label="শপিং কার্ট খুলুন"
          >
            <div className="cart-icon-wrapper">
              <span className="cart-symbol">🛒</span>
              <span className="cart-badge-count num">{cartCount}</span>
            </div>
            <div className="cart-label-box desktop-only">
              <span className="cart-title">আমার কার্ট</span>
              <span className="cart-subtitle">চেকআউট করুন</span>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}
