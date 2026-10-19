// src/components/ProductCard.jsx
import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function ProductCard({ 
  product, 
  onOrderNow, 
  onAddToCart, 
  onQuickView 
}) {
  const {
    id,
    title,
    price,
    originalPrice,
    discountPercent,
    rating,
    reviewsCount,
    image,
    stockLeft,
    categoryName
  } = product;

  // Build direct WhatsApp message
  const whatsappMsg = `আসসালামু আলাইকুম ${siteConfig.storeName},\nআমি এই পণ্যটি অর্ডার করতে চাই:\n📦 ${title}\n💰 মূল্য: ${siteConfig.currencySymbol}${price}\n\nদয়া করে ডেলিভারি প্রক্রিয়াটি সম্পন্ন করুন।`;
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="product-card">
      
      {/* Top badges: Discount & Quick View */}
      <div className="product-card-top">
        {discountPercent && (
          <span className="badge-discount num">-{discountPercent}%</span>
        )}
        <button 
          type="button" 
          className="quick-view-btn"
          onClick={() => onQuickView(product)}
          title="দ্রুত বিস্তারিত দেখুন"
          aria-label="কুইক ভিউ"
        >
          👁️
        </button>
      </div>

      {/* Product Image */}
      <div className="product-img-wrap" onClick={() => onQuickView(product)}>
        <img 
          src={image} 
          alt={title} 
          className="product-img" 
          loading="lazy" 
        />
        {stockLeft && stockLeft < 15 && (
          <div className="badge-low-stock">
            <span>মাত্র {stockLeft}টি বাকি!</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="product-details">
        
        {/* Category tag */}
        <span className="product-category-tag">{categoryName}</span>

        {/* Title per wireframe */}
        <h3 className="product-title" onClick={() => onQuickView(product)} title={title}>
          {title}
        </h3>

        {/* Price Row: ৳ 850 ~৳1300~ */}
        <div className="product-price-row">
          <span className="product-price num">
            <span className="curr-sym">{siteConfig.currencySymbol}</span> {price}
          </span>
          {originalPrice && (
            <del className="product-orig-price num">
              {siteConfig.currencySymbol}{originalPrice}
            </del>
          )}
        </div>

        {/* Star Rating: ★ 4.8 (120) */}
        <div className="product-rating-row">
          <div className="stars-box" aria-label={`রেটিং ${rating} তারকা`}>
            <span className="star-icon">★</span>
            <span className="rating-val num">{rating.toFixed(1)}</span>
          </div>
          <span className="reviews-count num">({reviewsCount})</span>
          <span className="cod-available-tag">ক্যাশ অন ডেলিভারি</span>
        </div>

        {/* Action Buttons per wireframe */}
        <div className="product-actions-group">
          
          {/* [🛒 অর্ডার করুন ] */}
          <button 
            type="button" 
            className="btn-order-now"
            onClick={() => onOrderNow(product)}
            title="ক্যাশ অন ডেলিভারিতে অর্ডার করুন"
          >
            <span className="btn-icon">🛒</span>
            <span>অর্ডার করুন</span>
          </button>

          {/* [💬 WhatsApp ] */}
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-order"
            title="হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন"
          >
            <span className="btn-icon">💬</span>
            <span>WhatsApp</span>
          </a>

        </div>

        {/* Secondary Add to Cart button */}
        <button 
          type="button" 
          className="btn-add-to-cart-subtle"
          onClick={() => onAddToCart(product)}
          title="কার্টে যোগ করুন এবং আরো কেনাকাটা করুন"
        >
          <span>+ কার্টে যোগ করুন</span>
        </button>

      </div>
    </div>
  );
}
