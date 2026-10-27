// src/components/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';

const bannerSlides = [
  {
    id: 1,
    tag: "🔥 মেগা ধামাকা অফার (MEGA DHAMAKA)",
    title: "সেরা কালেকশনে সর্বোচ্চ ৫০% পর্যন্ত ছাড়!",
    subtitle: "ক্যাশ অন ডেলিভারি ও দ্রুততম হোম ডেলিভারি সহ সেরা কোয়ালিটির নিশ্চয়তা।",
    cta: "এখনই কিনুন (Shop)",
    badge: "🚚 সারাদেশে ফ্রি ডেলিভারি (৳২৫০০+ অর্ডারে)",
    bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #c2410c 100%)",
    accentColor: "#fb923c",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 2,
    tag: "⚡ সুপার ফ্ল্যাশ সেল (FLASH SALE)",
    title: "স্মার্ট গ্যাজেট ও ঘড়িতে অবিশ্বাস্য মূল্যছাড়!",
    subtitle: "১০০% প্রিমিয়াম কোয়ালিটি ও অফিসিয়াল টেস্টেড প্রোডাক্ট। হাতে পেয়ে পেমেন্ট।",
    cta: "ডিলগুলো দেখুন",
    badge: "🛡️ ৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #0369a1 50%, #0d9488 100%)",
    accentColor: "#38bdf8",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 3,
    tag: "👗 ফ্যাশন ও লাইফস্টাইল কালেকশন",
    title: "নতুন ট্রেন্ডি ডিজাইন ও ঐতিহ্যবাহী পোশাক",
    subtitle: "হাতে বোনা সুতি ও জর্জেট পোশাকে নিজেকে সাজান অনন্য সাজে।",
    cta: "পছন্দ করুন",
    badge: "💯 ১০০% কালার ও ফেব্রিক গ্যারান্টি",
    bgGradient: "linear-gradient(135deg, #4c0519 0%, #881337 50%, #ea580c 100%)",
    accentColor: "#f43f5e",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=80"
  }
];

export default function HeroSection({ 
  categories, 
  activeCategory, 
  onSelectCategory,
  onOrderProduct,
  onViewProduct 
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto rotate banner every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = bannerSlides[currentSlide];
  const deal = siteConfig.todaysDeal;

  const scrollToFlashSale = () => {
    const elem = document.getElementById('flash-sale-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section">
      <div className="container hero-grid-container">
        
        {/* COLUMN 1: Categories Sidebar per wireframe */}
        <aside className="hero-sidebar-col">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <span className="sidebar-header-icon">☰</span>
              <h3 className="sidebar-title">ক্যাটাগরি সমূহ</h3>
            </div>
            <nav className="sidebar-nav">
              <ul className="sidebar-menu">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <li key={cat.id} className="sidebar-menu-item">
                      <button 
                        type="button"
                        className={`sidebar-menu-btn ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          onSelectCategory(cat.id);
                          const gridElem = document.getElementById('product-catalog-section');
                          if (gridElem) gridElem.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <span className="cat-icon">{cat.icon}</span>
                        <span className="cat-name">{cat.name}</span>
                        <span className="cat-arrow">›</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="sidebar-footer-note">
              <span>🚚 ঢাকা ও সারা দেশে হোম ডেলিভারি</span>
            </div>
          </div>
        </aside>

        {/* COLUMN 2: Mega Dhamaka Banner with Carousel per wireframe */}
        <div className="hero-banner-col">
          <div 
            className="mega-banner-card"
            style={{ background: slide.bgGradient }}
          >
            <div className="banner-content-wrap">
              <div className="banner-badge-pill" style={{ color: slide.accentColor }}>
                {slide.tag}
              </div>
              <h2 className="banner-title">{slide.title}</h2>
              <p className="banner-subtitle">{slide.subtitle}</p>
              
              <div className="banner-footer-actions">
                <button 
                  type="button" 
                  className="banner-cta-btn"
                  onClick={scrollToFlashSale}
                >
                  <span>{slide.cta}</span>
                  <span className="btn-arrow">→</span>
                </button>
                <div className="banner-cod-pill">
                  <span className="cod-icon">🛡️</span>
                  <span>{slide.badge}</span>
                </div>
              </div>
            </div>

            <div className="banner-visual-wrap">
              <img 
                src={slide.image} 
                alt="Mega Dhamaka Offer" 
                className="banner-hero-img"
                referrerPolicy="no-referrer"
              />
              <div className="banner-float-tag">
                <span className="float-percent">৫০% ছাড়</span>
                <span className="float-sub">ক্যাশ অন ডেলিভারি</span>
              </div>
            </div>

            {/* Carousel Navigation Dots: ( o • o o ) */}
            <div className="carousel-nav-dots" aria-label="ব্যানার স্লাইডার">
              {bannerSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`স্লাইড ${index + 1}`}
                />
              ))}
            </div>

            {/* Carousel Previous / Next Arrows */}
            <button 
              type="button" 
              className="carousel-arrow prev"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
              aria-label="পূর্ববর্তী স্লাইড"
            >
              ‹
            </button>
            <button 
              type="button" 
              className="carousel-arrow next"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)}
              aria-label="পরবর্তী স্লাইড"
            >
              ›
            </button>
          </div>
        </div>

        {/* COLUMN 3: Right Stacked Cards per wireframe */}
        <div className="hero-deals-col">
          
          {/* Card 1: 🔥 আজকের ডিল */}
          <div className="todays-deal-card">
            <div className="deal-header">
              <span className="deal-badge">{deal.badge}</span>
              <span className="deal-discount-tag">-{deal.discountPercent}%</span>
            </div>
            
            <div className="deal-img-wrapper" onClick={() => onViewProduct(deal)}>
              <img
                src={deal.image}
                alt={deal.title}
                className="deal-img"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="deal-stock-bar-wrap">
                <div className="stock-info-row">
                  <span>স্টক সীমিত</span>
                  <span className="stock-count">বাকি ১৮ টি</span>
                </div>
                <div className="stock-track">
                  <div className="stock-progress" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>

            <div className="deal-info">
              <h4 className="deal-title" onClick={() => onViewProduct(deal)}>{deal.title}</h4>
              <div className="deal-price-row">
                <span className="deal-current-price num">{siteConfig.currencySymbol}{deal.price}</span>
                <span className="deal-orig-price num">~{siteConfig.currencySymbol}{deal.originalPrice}~</span>
              </div>
              <div className="deal-actions-row">
                <button 
                  type="button" 
                  className="deal-order-btn"
                  onClick={() => onOrderProduct(deal)}
                >
                  <span className="btn-icon">🛒</span>
                  <span>অর্ডার করুন</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: ✅ ১০০% বিশ্বস্ত (হাতে পেয়ে পেমেন্ট) */}
          <div className="trust-card-mini">
            <div className="trust-mini-header">
              <span className="trust-check-icon">✅</span>
              <div className="trust-mini-titles">
                <h4 className="trust-mini-title">১০০% বিশ্বস্ত প্ল্যাটফর্ম</h4>
                <span className="trust-mini-highlight">হাতে পেয়ে পেমেন্ট</span>
              </div>
            </div>
            <ul className="trust-mini-list">
              <li>
                <span className="check">✔</span>
                <span>অগ্রিম কোনো টাকা দেওয়া লাগবে না</span>
              </li>
              <li>
                <span className="check">✔</span>
                <span>ডেলিভারিম্যানের সামনে চেক করার সুবিধা</span>
              </li>
              <li>
                <span className="check">✔</span>
                <span>পণ্য পছন্দ না হলে ৭ দিনে সহজ রিটার্ন</span>
              </li>
            </ul>
            <div className="trust-bottom-pill">
              <span>🛡️ ১০০% আসল ও যাচাইকৃত পণ্য</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
