// src/components/QuickViewModal.jsx
import React, { useRef, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';

export default function QuickViewModal({ 
  product, 
  isOpen, 
  onClose, 
  onOrderNow, 
  onAddToCart 
}) {
  const dialogRef = useRef(null);

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

  const whatsappMsg = `আসসালামু আলাইকুম ${siteConfig.storeName},\nআমি এই পণ্যটির বিস্তারিত জানতে ও অর্ডার করতে চাই:\n📦 ${product.title}\n💰 মূল্য: ${siteConfig.currencySymbol}${product.price}`;
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <dialog ref={dialogRef} className="quickview-dialog" onClose={onClose}>
      <div className="quickview-content">
        
        <button type="button" className="dialog-close-btn" onClick={onClose} aria-label="বন্ধ করুন">
          ✕
        </button>

        <div className="quickview-grid">
          
          {/* Image */}
          <div className="quickview-image-wrap">
            <img src={product.image} alt={product.title} className="quickview-img" />
            {product.discountPercent && (
              <span className="quickview-discount-badge num">-{product.discountPercent}% OFF</span>
            )}
          </div>

          {/* Details */}
          <div className="quickview-details">
            <span className="quickview-category-pill">{product.categoryName}</span>
            <h2 className="quickview-title">{product.title}</h2>

            <div className="quickview-price-box">
              <span className="quickview-current-price num">{siteConfig.currencySymbol}{product.price}</span>
              {product.originalPrice && (
                <span className="quickview-orig-price num">~{siteConfig.currencySymbol}{product.originalPrice}~</span>
              )}
              <span className="quickview-save-tag">সাশ্রয় {siteConfig.currencySymbol}{product.originalPrice - product.price}</span>
            </div>

            <div className="quickview-rating-row">
              <span className="quickview-stars">★ {product.rating?.toFixed(1) || '4.8'}</span>
              <span className="quickview-reviews num">({product.reviewsCount || 85} রিভিউ)</span>
              <span className="quickview-stock-tag">✅ ইন স্টক ({product.stockLeft || 15}টি অবশিষ্ট)</span>
            </div>

            <p className="quickview-desc">{product.description || "১০০% প্রিমিয়াম কোয়ালিটি এবং দীর্ঘস্থায়ী ফিনিশিং।"}</p>

            <div className="quickview-guarantees">
              <div className="guarantee-item">
                <span className="g-icon">🛡️</span>
                <span>ক্যাশ অন ডেলিভারি (হাতে পেয়ে মূল্য পরিশোধ)</span>
              </div>
              <div className="guarantee-item">
                <span className="g-icon">🚚</span>
                <span>দ্রুততম হোম ডেলিভারি</span>
              </div>
              <div className="guarantee-item">
                <span className="g-icon">🔄</span>
                <span>৭ দিনের সহজ রিপ্লেসমেন্ট সুবিধা</span>
              </div>
            </div>

            <div className="quickview-actions">
              <button 
                type="button" 
                className="btn-modal-order-now"
                onClick={() => {
                  onClose();
                  onOrderNow(product);
                }}
              >
                <span className="btn-icon">🛒</span>
                <span>এখনই অর্ডার করুন (ক্যাশ অন ডেলিভারি)</span>
              </button>

              <div className="secondary-actions-row">
                <button 
                  type="button" 
                  className="btn-modal-add-cart"
                  onClick={() => {
                    onAddToCart(product);
                  }}
                >
                  <span>+ কার্টে যোগ করুন</span>
                </button>

                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-modal-whatsapp"
                >
                  <span>💬 WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </dialog>
  );
}
