// src/components/FlashSale.jsx
import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

export default function FlashSale({ 
  products, 
  onOrderProduct, 
  onAddToCart, 
  onQuickView,
  onViewAll 
}) {
  // Flash sale countdown timer state (Hours: 04, Minutes: 42, Seconds: 19 as in wireframe)
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to a new cycle so it stays active
          return { hours: 6, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num) => String(num).padStart(2, '0');

  // Filter flash sale products (the 4 specified in wireframe)
  const flashSaleProducts = products.filter(p => p.isFlashSale).slice(0, 4);

  return (
    <section id="flash-sale-section" className="flash-sale-section">
      <div className="container">
        
        {/* Flash Sale Header Bar per wireframe */}
        <div className="flash-sale-header">
          
          <div className="flash-sale-title-group">
            <span className="flash-icon-zap">⚡</span>
            <h2 className="flash-sale-title">
              ফ্ল্যাশ সেল <span className="flash-en">(FLASH SALE)</span>
            </h2>
          </div>

          {/* Countdown Timer: [ Ends in: [04] : [42] : [19] ] */}
          <div className="countdown-timer-box" aria-label="ফ্ল্যাশ সেল সমাপ্তির বাকি সময়">
            <span className="timer-label">Ends in:</span>
            <div className="timer-digits-row">
              <span className="digit-block num">{formatDigit(timeLeft.hours)}</span>
              <span className="digit-colon">:</span>
              <span className="digit-block num">{formatDigit(timeLeft.minutes)}</span>
              <span className="digit-colon">:</span>
              <span className="digit-block num">{formatDigit(timeLeft.seconds)}</span>
            </div>
          </div>

          {/* [ সব দেখুন -> ] */}
          <button 
            type="button" 
            className="flash-view-all-btn"
            onClick={onViewAll}
          >
            <span>সব দেখুন</span>
            <span className="arrow-sym">→</span>
          </button>

        </div>

        {/* 4 Product Cards Grid per wireframe */}
        <div className="flash-products-grid">
          {flashSaleProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onOrderNow={onOrderProduct}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
