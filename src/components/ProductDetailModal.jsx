// src/components/ProductDetailModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../config/siteConfig';

export default function ProductDetailModal({ 
  product, 
  allProducts,
  isOpen, 
  onClose, 
  onOrderNow, 
  onAddToCart,
  onSelectProduct 
}) {
  const dialogRef = useRef(null);

  // States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' or 'reviews'
  const [validationError, setValidationError] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedColor(product.colors?.[0] || null);
      setQuantity(1);
      setActiveTab('specs');
      setValidationError('');
    }
  }, [product]);

  // Dialog open / close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  if (!product) return null;

  const images = product.gallery && product.gallery.length > 0 
    ? product.gallery 
    : [product.image];

  const currentImage = images[activeImageIndex] || product.image;

  // Related products from same category or popular
  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category || p.isPopular))
    .slice(0, 4);

  // Handle Zoom on mouse move
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Validate variant selection
  const validateVariants = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setValidationError('অনুগ্রহ করে পণ্যের সাইজ (Size) নির্বাচন করুন');
      return false;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setValidationError('অনুগ্রহ করে পণ্যের কালার (Color) নির্বাচন করুন');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleOrderClick = () => {
    if (!validateVariants()) return;
    const orderItem = {
      ...product,
      selectedSize,
      selectedColor: selectedColor?.name || '',
      quantity
    };
    onOrderNow(orderItem);
  };

  const handleAddToCartClick = () => {
    if (!validateVariants()) return;
    const cartItem = {
      ...product,
      selectedSize,
      selectedColor: selectedColor?.name || '',
      quantity
    };
    onAddToCart(cartItem);
  };

  // WhatsApp Message
  const whatsappMsg = `আসসালামু আলাইকুম ${siteConfig.storeName},\nআমি এই পণ্যটি অর্ডার করতে চাই:\n📦 ${product.title}\n🎨 কালার: ${selectedColor?.name || 'স্ট্যান্ডার্ড'}\n📏 সাইজ: ${selectedSize || 'স্ট্যান্ডার্ড'}\n🔢 পরিমাণ: ${quantity} টি\n💰 মূল্য: ${siteConfig.currencySymbol}${product.price * quantity}\n\nদয়া করে আমার অর্ডারটি কনফার্ম করুন।`;
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <dialog ref={dialogRef} className="product-detail-dialog" onClose={onClose}>
      <div className="product-detail-modal-wrapper">
        
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-floating-close" 
          onClick={onClose} 
          aria-label="বন্ধ করুন"
        >
          ✕
        </button>

        <div className="product-detail-scroll-content">
          
          {/* Main 3-Column Top Section: Gallery | Main Info | Daraz-Style Delivery Sidebar */}
          <div className="detail-top-grid">
            
            {/* 1. INTERACTIVE IMAGE GALLERY */}
            <div className="detail-gallery-col">
              <div 
                className="main-preview-box"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <img 
                  src={currentImage} 
                  alt={product.title} 
                  className={`main-preview-img ${isZoomed ? 'zoomed' : ''}`}
                  style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                />
                
                {product.discountPercent && (
                  <span className="gallery-discount-tag num">-{product.discountPercent}% OFF</span>
                )}
                
                <div className="zoom-hint">
                  <span>🔍 জুম করতে মাউস রাখুন</span>
                </div>
              </div>

              {/* Clickable Thumbnail Strip */}
              {images.length > 1 && (
                <div className="thumbnail-strip">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                      onMouseEnter={() => setActiveImageIndex(idx)}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. PRODUCT INFO & VARIANT SELECTOR */}
            <div className="detail-info-col">
              
              <div className="detail-header-group">
                <span className="detail-category-badge">{product.categoryName}</span>
                <h1 className="detail-product-title">{product.title}</h1>
                
                {/* Rating & Review Counter */}
                <div className="detail-rating-line">
                  <div className="stars-fill">
                    {'★'.repeat(Math.floor(product.rating || 5))}
                    <span className="rating-score num"> {product.rating?.toFixed(1)}</span>
                  </div>
                  <span className="rating-dot">•</span>
                  <a href="#reviews-section" className="review-count-link" onClick={() => setActiveTab('reviews')}>
                    <span className="num">{product.reviewsCount || 85}</span> টি কাস্টমার রিভিউ
                  </a>
                  <span className="rating-dot">•</span>
                  <span className="orders-count-tag">৩৫০+ অর্ডার সফল হয়েছে</span>
                </div>
              </div>

              {/* Price Box */}
              <div className="detail-price-box">
                <div className="price-main-wrap">
                  <span className="detail-current-price num">
                    <span className="sym">{siteConfig.currencySymbol}</span>{product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="detail-original-price num">
                      ~{siteConfig.currencySymbol}{product.originalPrice}~
                    </span>
                  )}
                  {product.discountPercent && (
                    <span className="detail-saved-badge">
                      সাশ্রয় {siteConfig.currencySymbol}{product.originalPrice - product.price} (-{product.discountPercent}%)
                    </span>
                  )}
                </div>
                <div className="detail-cod-pill">
                  <span>🛡️ ১০০% ক্যাশ অন ডেলিভারি (হাতে পেয়ে মূল্য পরিশোধ)</span>
                </div>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="variant-validation-alert fade-in">
                  <span>⚠️ {validationError}</span>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="variant-group">
                  <div className="variant-label-row">
                    <label className="variant-label">
                      সাইজ (Size): <strong className="selected-variant-name">{selectedSize || 'নির্বাচন করুন'}</strong>
                    </label>
                    <button 
                      type="button" 
                      className="size-guide-link"
                      onClick={() => setActiveTab('specs')}
                    >
                      📏 সাইজ চার্ট দেখুন
                    </button>
                  </div>
                  <div className="size-pills-row">
                    {product.sizes.map((sz) => {
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          className={`size-pill-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedSize(sz);
                            setValidationError('');
                          }}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Swatches */}
              {product.colors && product.colors.length > 0 && (
                <div className="variant-group">
                  <div className="variant-label-row">
                    <label className="variant-label">
                      কালার (Color): <strong className="selected-variant-name">{selectedColor?.name || 'নির্বাচন করুন'}</strong>
                    </label>
                  </div>
                  <div className="color-swatches-row">
                    {product.colors.map((c, i) => {
                      const isSelected = selectedColor?.name === c.name;
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`color-swatch-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedColor(c);
                            setValidationError('');
                          }}
                        >
                          <span className="color-dot" style={{ backgroundColor: c.hex }}></span>
                          <span className="color-name">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Real-time Stock Indicator */}
              <div className="quantity-stock-section">
                <div className="qty-picker-wrap">
                  <label className="variant-label">পরিমাণ:</label>
                  <div className="stepper-box">
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="কমান"
                    >
                      -
                    </button>
                    <span className="stepper-val num">{quantity}</span>
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="বাড়ান"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Real-time Stock Indicator per prompt */}
                <div className="stock-alert-pill">
                  <span className="fire-icon">🔥</span>
                  <span>
                    মাত্র <strong className="num">{product.stockLeft || 7}টি</strong> পণ্য স্টকে বাকি আছে!
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="detail-actions-row">
                <button 
                  type="button" 
                  className="btn-detail-order-now"
                  onClick={handleOrderClick}
                >
                  <span className="btn-icon">⚡</span>
                  <span>এখনই অর্ডার করুন (Buy Now)</span>
                </button>

                <button 
                  type="button" 
                  className="btn-detail-add-cart"
                  onClick={handleAddToCartClick}
                >
                  <span className="btn-icon">🛒</span>
                  <span>কার্টে রাখুন</span>
                </button>

                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-detail-whatsapp"
                >
                  <span className="btn-icon">💬</span>
                  <span>WhatsApp এ কথা বলুন</span>
                </a>
              </div>

            </div>

            {/* 3. DELIVERY & RETURN ESTIMATOR SIDEBAR (DARAZ STYLE) */}
            <div className="detail-sidebar-col">
              
              <div className="daraz-delivery-card">
                <h4 className="sidebar-card-title">🚚 ডেলিভারি ও সার্ভিস অপশন</h4>
                
                <div className="delivery-perk-item">
                  <span className="perk-emoji">📍</span>
                  <div className="perk-info">
                    <strong>হোম ডেলিভারি সময়:</strong>
                    <p className="perk-desc">{siteConfig.estimatedDelivery.insideDhaka}</p>
                    <p className="perk-desc">{siteConfig.estimatedDelivery.outsideDhaka}</p>
                  </div>
                </div>

                <div className="delivery-perk-item">
                  <span className="perk-emoji">💵</span>
                  <div className="perk-info">
                    <strong>ডেলিভারি ফি:</strong>
                    <p className="perk-highlight">
                      ঢাকার ভিতরে: <strong className="num">{siteConfig.currencySymbol}{siteConfig.deliveryCharges.insideDhaka}</strong> | ঢাকার বাইরে: <strong className="num">{siteConfig.currencySymbol}{siteConfig.deliveryCharges.outsideDhaka}</strong>
                    </p>
                    <span className="free-shipping-tag">৳২৫০০+ অর্ডারে সারাদেশে ফ্রি ডেলিভারি</span>
                  </div>
                </div>

                <div className="delivery-perk-item">
                  <span className="perk-emoji">🛡️</span>
                  <div className="perk-info">
                    <strong>ক্যাশ অন ডেলিভারি:</strong>
                    <p className="perk-desc">হাতে পেয়ে চেক করে পেমেন্ট করার ১০০% সুবিধা</p>
                  </div>
                </div>

                <div className="delivery-perk-item">
                  <span className="perk-emoji">🔄</span>
                  <div className="perk-info">
                    <strong>৭ দিনের রিটার্ন গ্যারান্টি:</strong>
                    <p className="perk-desc">ত্রুটিযুক্ত পণ্য পরিবর্তন বা ১০০% মূল্য ফেরত</p>
                  </div>
                </div>

                <div className="delivery-perk-item">
                  <span className="perk-emoji">💯</span>
                  <div className="perk-info">
                    <strong>১০০% অরিজিনাল ওয়ারেন্টি:</strong>
                    <p className="perk-desc">প্রিমিয়াম ব্র্যান্ড কোয়ালিটি যাচাইকৃত</p>
                  </div>
                </div>

                <div className="helpline-quick-box">
                  <span>সহায়তার জন্য কল করুন:</span>
                  <a href={`tel:${siteConfig.helpline}`} className="num helpline-direct">
                    📞 {siteConfig.displayHelpline}
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* 4. TABBED BOTTOM SECTION: SPECIFICATIONS & VERIFIED REVIEWS */}
          <div className="detail-bottom-section">
            
            {/* Tabs Header */}
            <div className="detail-tabs-header">
              <button 
                type="button" 
                className={`tab-toggle-btn ${activeTab === 'specs' ? 'active' : ''}`}
                onClick={() => setActiveTab('specs')}
              >
                📋 পণ্যের বিবরণ ও স্পেসিফিকেশন
              </button>
              
              <button 
                type="button" 
                className={`tab-toggle-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                ⭐ কাস্টমার রিভিউ ({product.reviews?.length || 4})
              </button>
            </div>

            {/* Tab 1: Specifications & Size Chart */}
            {activeTab === 'specs' && (
              <div className="tab-pane-content fade-in">
                
                <div className="specs-description-box">
                  <h3 className="pane-section-title">পণ্য পরিচিতি</h3>
                  <p className="pane-desc-text">{product.description}</p>
                </div>

                {/* Specs Table */}
                {product.specs && (
                  <div className="specs-table-box">
                    <h3 className="pane-section-title">টেকনিক্যাল স্পেসিফিকেশন</h3>
                    <table className="specs-table">
                      <tbody>
                        {product.specs.map((item, i) => (
                          <tr key={i}>
                            <td className="spec-key">{typeof item.key === 'object' ? (item.key?.key || item.key?.value || '') : String(item.key || '')}</td>
                            <td className="spec-val">{typeof item.value === 'object' ? (item.value?.value || item.value?.key || '') : String(item.value || '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Size Chart Guide */}
                {product.sizeChart && (
                  <div className="size-chart-box">
                    <h3 className="pane-section-title">📏 সাইজ চার্ট ও পরিমাপ গাইড</h3>
                    <div className="table-responsive">
                      <table className="size-chart-table">
                        <thead>
                          <tr>
                            {Object.keys(product.sizeChart[0]).map((colKey, idx) => (
                              <th key={idx}>{colKey.toUpperCase()}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {product.sizeChart.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="num">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Tab 2: Verified Buyer Reviews */}
            {activeTab === 'reviews' && (
              <div className="tab-pane-content fade-in">
                <div className="reviews-summary-header">
                  <div className="reviews-overall-score">
                    <span className="big-rating num">{product.rating?.toFixed(1) || '4.9'}</span>
                    <div className="stars-box">
                      {'★'.repeat(5)}
                    </div>
                    <span className="total-reviews-count">মোট {product.reviewsCount || 120} টি ভেরিফাইড রিভিউ</span>
                  </div>

                  <div className="verified-badge-pill">
                    <span>✅ ১০০% যাচাইকৃত ক্রেতার মতামত</span>
                  </div>
                </div>

                <div className="reviews-list-grid">
                  {(product.reviews || []).map((rev) => (
                    <div key={rev.id} className="review-card">
                      <div className="review-card-top">
                        <div className="author-avatar">
                          {rev.author.charAt(0)}
                        </div>
                        <div className="author-details">
                          <strong className="author-name">{rev.author}</strong>
                          <span className="author-location">📍 {rev.location}</span>
                        </div>
                        <div className="review-date-badge num">{rev.date}</div>
                      </div>

                      <div className="review-rating-row">
                        <div className="stars-gold">{'★'.repeat(rev.rating)}</div>
                        {rev.verified && (
                          <span className="badge-verified-buyer">
                            ✓ Verified Purchase (যাচাইকৃত ক্রেতা)
                          </span>
                        )}
                      </div>

                      <p className="review-comment-text">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* 5. RELATED / UPSELL PRODUCTS ("আপনার আরও পছন্দ হতে পারে") */}
          {relatedProducts.length > 0 && (
            <div className="related-products-section">
              <div className="related-header">
                <span className="related-icon">✨</span>
                <h3 className="related-title">আপনার আরও পছন্দ হতে পারে (Related Items)</h3>
              </div>
              <div className="related-products-grid">
                {relatedProducts.map((rel) => (
                  <div 
                    key={rel.id} 
                    className="related-item-card"
                    onClick={() => {
                      onSelectProduct(rel);
                      const wrapper = document.querySelector('.product-detail-scroll-content');
                      if (wrapper) wrapper.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <img src={rel.image} alt={rel.title} className="related-thumb" />
                    <div className="related-info">
                      <h4 className="related-item-title">{rel.title}</h4>
                      <div className="related-price-line">
                        <span className="related-price num">{siteConfig.currencySymbol}{rel.price}</span>
                        {rel.originalPrice && (
                          <span className="related-orig num">~{siteConfig.currencySymbol}{rel.originalPrice}~</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 6. FLOATING MOBILE STICKY BAR PER PROMPT */}
        <div className="mobile-product-sticky-bar">
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mobile-sticky-wa-btn"
            title="WhatsApp"
          >
            <span className="wa-icon">💬</span>
          </a>

          <button 
            type="button" 
            className="mobile-sticky-cart-btn"
            onClick={handleAddToCartClick}
          >
            <span>🛒 কার্টে রাখুন</span>
          </button>

          <button 
            type="button" 
            className="mobile-sticky-order-btn"
            onClick={handleOrderClick}
          >
            <span>⚡ অর্ডার করুন</span>
          </button>
        </div>

      </div>
    </dialog>
  );
}
