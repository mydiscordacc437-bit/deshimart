// src/components/CartDrawer.jsx
import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckoutCart 
}) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const remainingForFreeShipping = Math.max(0, siteConfig.freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / siteConfig.freeDeliveryThreshold) * 100));

  return (
    <div className="cart-drawer-overlay fade-in" onClick={onClose}>
      <div className="cart-drawer-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-box">
            <span className="drawer-icon">🛒</span>
            <h3 className="drawer-title">আপনার শপিং কার্ট ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</h3>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="কার্ট বন্ধ করুন">
            ✕
          </button>
        </div>

        {/* Free Shipping Progress bar */}
        <div className="free-shipping-bar-box">
          <div className="free-shipping-text">
            {remainingForFreeShipping === 0 ? (
              <span className="free-success">🎉 অভিনন্দন! আপনি সারাদেশে ফ্রি ডেলিভারি পেয়েছেন!</span>
            ) : (
              <span>
                আর মাত্র <strong className="num">{siteConfig.currencySymbol}{remainingForFreeShipping}</strong> টাকার কেনাকাটা করলে <strong>ফ্রি ডেলিভারি</strong>!
              </span>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* Cart Items List */}
        {cartItems.length > 0 ? (
          <div className="drawer-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-row">
                <img src={item.image} alt={item.title} className="cart-item-img" />
                <div className="cart-item-info">
                  <h4 className="cart-item-title">{item.title}</h4>
                  <div className="cart-item-price num">
                    {siteConfig.currencySymbol}{item.price}
                  </div>
                  
                  {/* Quantity controls */}
                  <div className="cart-qty-row">
                    <div className="qty-pill">
                      <button 
                        type="button" 
                        className="qty-action-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        aria-label="কমান"
                      >
                        -
                      </button>
                      <span className="qty-number num">{item.quantity}</span>
                      <button 
                        type="button" 
                        className="qty-action-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        aria-label="বাড়ান"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      type="button" 
                      className="cart-item-remove-btn"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-cart-state">
            <span className="empty-cart-icon">🛍️</span>
            <h4>আপনার কার্ট বর্তমানে খালি আছে</h4>
            <p>আপনার পছন্দের সেরা প্রোডাক্টগুলো কার্টে যোগ করুন</p>
            <button type="button" className="btn-start-shopping" onClick={onClose}>
              কেনাকাটা শুরু করুন
            </button>
          </div>
        )}

        {/* Drawer Footer & Checkout */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-subtotal-row">
              <span className="subtotal-label">সাবটোটাল:</span>
              <strong className="subtotal-amount num">{siteConfig.currencySymbol}{subtotal}</strong>
            </div>
            <p className="drawer-tax-note">ডেলিভারি চার্জ চেকআউটের সময় যুক্ত হবে। ১০০% ক্যাশ অন ডেলিভারি।</p>
            
            <button 
              type="button" 
              className="drawer-checkout-btn"
              onClick={onCheckoutCart}
            >
              <span className="btn-icon">⚡</span>
              <span>ক্যাশ অন ডেলিভারিতে অর্ডার করুন</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
