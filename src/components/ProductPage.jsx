// src/components/ProductPage.jsx
/**
 * Dedicated Single-Product Page & High-Conversion Ad Landing Page
 * 
 * Features:
 *   - Interactive Multi-Image Gallery & Variant/Bundle Selectors
 *   - Direct Navigation to Per-Product Dedicated Ordering Page (/checkout/:slug)
 *   - Detailed Specifications, Customer Reviews & Delivery Policies
 *   - Precision-Formatted Relevant Products Showcase (Uniform Aspect Ratio, Aligned Baselines, Tabular Numerals)
 */

import React, { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../config/siteConfig';
import { products as defaultCatalog } from '../data/products';
import { trackViewContent, trackInitiateCheckout } from '../utils/pixelManager';

export default function ProductPage({
  product,
  allProducts = defaultCatalog,
  isAdMode = false,
  onBackToHome,
  onAddToCart,
  onViewProduct,
  onOrderProduct,
  onNavigateTo
}) {
  if (!product) return null;

  // Gallery state
  const galleryImages = (product.gallery && product.gallery.length > 0) 
    ? product.gallery 
    : [product.image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = galleryImages[activeImageIndex] || product.image;

  // Variants state
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.[0]?.name || (typeof product.colors?.[0] === 'string' ? product.colors[0] : 'Standard')
  );
  
  // Tiered Quantity Bundle state: '1', '2', '3'
  const [selectedBundle, setSelectedBundle] = useState('1');
  const [quantity, setQuantity] = useState(1);

  // Active tab in details section
  const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'reviews', 'shipping'

  // Category filter for Relevant Products section ('related' vs 'popular')
  const [relatedFilter, setRelatedFilter] = useState('all');

  // InitiateCheckout tracked flag (fire once per session)
  const hasInitiatedCheckout = useRef(false);

  // Reset local variant selections when switching between products
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(product.sizes?.[0] || 'Standard');
    setSelectedColor(
      product.colors?.[0]?.name ||
      (typeof product.colors?.[0] === 'string' ? product.colors[0] : 'Standard')
    );
    setSelectedBundle('1');
    setQuantity(1);
    setRelatedFilter('all');
    hasInitiatedCheckout.current = false;
  }, [product.id, product.slug]);

  // Bundle Discount Calculation
  let bundleDiscount = 0;
  if (selectedBundle === '2') bundleDiscount = 100;
  if (selectedBundle === '3') bundleDiscount = 250;

  // Handle bundle selection
  const handleSelectBundle = (bundleKey) => {
    setSelectedBundle(bundleKey);
    const qty = Number(bundleKey);
    setQuantity(qty);
  };

  // Pricing calculations
  const itemsBaseTotal = product.price * quantity;
  const subtotal = Math.max(0, itemsBaseTotal - bundleDiscount);

  // Navigate directly to the dedicated ordering page for this product
  const goToCheckoutPage = () => {
    if (!hasInitiatedCheckout.current) {
      hasInitiatedCheckout.current = true;
      trackInitiateCheckout(product, quantity, subtotal);
    }

    const checkoutUrl = `/checkout/${product.slug || product.id}?size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor)}&qty=${quantity}&bundle=${selectedBundle}`;
    if (onNavigateTo) {
      onNavigateTo(checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  // Dynamic SEO, OpenGraph Meta tags & Pixel ViewContent
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${product.title} - সেরা দামে কিনুন | ${siteConfig.brandName}`;

    const setMetaTag = (attrType, attrName, content) => {
      let meta = document.querySelector(`meta[${attrType}="${attrName}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrType, attrName);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('name', 'description', product.description?.slice(0, 160) || product.title);
    setMetaTag('property', 'og:title', product.title);
    setMetaTag('property', 'og:description', product.description?.slice(0, 160) || product.title);
    setMetaTag('property', 'og:image', product.image);
    setMetaTag('property', 'og:url', window.location.href);
    setMetaTag('property', 'og:type', 'product');
    setMetaTag('property', 'og:price:amount', String(product.price));
    setMetaTag('property', 'og:price:currency', 'BDT');

    // Scroll to top on route load
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Fire Meta / TikTok Pixel ViewContent
    trackViewContent(product);

    return () => {
      document.title = originalTitle;
    };
  }, [product]);

  // WhatsApp order link with pre-filled message
  const whatsappCleanNumber = siteConfig.whatsappNumber ? siteConfig.whatsappNumber.replace(/[^0-9]/g, '') : '1700000000';
  const whatsappMessage = encodeURIComponent(
    `আসসালামু আলাইকুম! আমি এই প্রোডাক্টটি অর্ডার করতে আগ্রহী:\n\n` +
    `📌 পণ্য: ${product.title}\n` +
    `🏷️ সাইজ: ${selectedSize}\n` +
    `🎨 কালার: ${selectedColor}\n` +
    `🔢 পরিমাণ: ${quantity}টি\n` +
    `💰 মূল্য: ৳${subtotal}\n\n` +
    `🔗 লিংক: ${window.location.href}\n\n` +
    `অনুগ্রহ করে আমার অর্ডারটি কনফার্ম করুন।`
  );
  const whatsappUrl = `https://wa.me/88${whatsappCleanNumber}?text=${whatsappMessage}`;

  // =========================================================================
  // RELEVANT PRODUCTS ENGINE:
  // Same-category products first, with fallback to bestsellers (8 cards)
  // =========================================================================
  const catalogSource = Array.isArray(allProducts) && allProducts.length > 0 ? allProducts : defaultCatalog;
  const otherProducts = catalogSource.filter(
    p => p.id !== product.id && p.slug !== product.slug
  );

  const sameCategoryProducts = otherProducts.filter(
    p =>
      (product.category && p.category === product.category) ||
      (product.categoryName && p.categoryName === product.categoryName)
  );

  const bestsellerFallbacks = otherProducts
    .filter(p => !sameCategoryProducts.some(sc => sc.id === p.id))
    .sort((a, b) => (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0));

  const combinedRelevant = [...sameCategoryProducts, ...bestsellerFallbacks].slice(0, 8);
  const displayedRelevantProducts =
    relatedFilter === 'category' && sameCategoryProducts.length > 0
      ? sameCategoryProducts.slice(0, 8)
      : combinedRelevant;

  const handleSelectRelatedProduct = (relProd) => {
    if (onViewProduct) {
      onViewProduct(relProd);
    } else if (onNavigateTo) {
      onNavigateTo(`/product/${relProd.slug || relProd.id}`);
    }
  };

  const handleOrderRelatedProduct = (relProd) => {
    if (onOrderProduct) {
      onOrderProduct(relProd);
    } else if (onNavigateTo) {
      onNavigateTo(`/checkout/${relProd.slug || relProd.id}`);
    }
  };

  return (
    <div className={`product-page-wrapper bg-slate-50 min-h-screen text-slate-800 ${isAdMode ? 'ad-mode-layout' : ''}`}>
      
      {/* 1. Header Mode: Ad Funnel minimal header vs standard storefront bar */}
      {isAdMode ? (
        <header className="sticky top-0 z-40 bg-white border-b border-orange-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center text-lg shadow-sm">D</span>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">{siteConfig.brandName}</span>
                <span className="text-[11px] block text-emerald-600 font-semibold leading-none">যাচাইকৃত স্পেশাল অফার</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <span>💬 WhatsApp</span>
              </a>
              <button 
                type="button"
                onClick={goToCheckoutPage}
                className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs sm:text-sm font-black rounded-lg shadow hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer"
              >
                ⚡ অর্ডার করুন (COD)
              </button>
            </div>
          </div>
          {/* Urgency flash bar */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-center py-1.5 px-3 text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
            <span>🔥 মেগা ধামাকা অফার: ক্যাশ অন ডেলিভারিতে পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন!</span>
          </div>
        </header>
      ) : (
        <div className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <button 
                type="button"
                onClick={onBackToHome}
                className="text-orange-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                ← হোমপেজে ফিরুন
              </button>
              <span>/</span>
              <span className="text-slate-500 whitespace-nowrap">{product.categoryName || 'পণ্য'}</span>
              <span>/</span>
              <span className="text-slate-800 font-medium truncate max-w-[180px] sm:max-w-sm">{product.title}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        
        {/* ============================================================ */}
        {/* SECTION 1: HERO SHOWCASE (Above The Fold)                   */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* Left: Interactive Multi-Image Gallery */}
            <div className="product-gallery-pane space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                <img 
                  src={activeImage} 
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
                {product.discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-md shadow-sm num">
                    -{product.discountPercent}% ছাড়
                  </span>
                )}
              </div>

              {/* Clickable Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 bg-slate-50 transition-all cursor-pointer ${
                        activeImageIndex === idx 
                          ? 'border-orange-500 ring-2 ring-orange-200 shadow' 
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantees banner under image */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs font-semibold text-slate-600">
                <div className="p-2.5 rounded-lg bg-orange-50/70 border border-orange-100 flex items-center justify-center gap-1.5">
                  <span>🛡️ ১০০% অরিজিনাল পণ্য</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-center gap-1.5 text-emerald-800">
                  <span>📦 দেখে নিয়ে মূল্য পরিশোধ</span>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Fast Buy CTA */}
            <div className="product-summary-pane space-y-5">
              
              {/* Category & SKU metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-orange-700">
                  {product.categoryName || 'প্রিমিয়াম কালেকশন'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-600">
                  SKU: {product.sku || `BBZ-${product.id}`}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold">
                  স্টকে এভেইলেবল
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
                {product.title}
              </h1>

              {/* Verified Rating & Reviews */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex text-amber-500 text-base">
                  {'★'.repeat(5)}
                </div>
                <span className="font-bold text-slate-800 num">{Number(product.rating || 4.9).toFixed(1)}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 num">({product.reviewsCount || 120} যাচাইকৃত কাস্টমার রিভিউ)</span>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-orange-600 font-mono tracking-tight num">
                  {siteConfig.currencySymbol}{product.price}
                </span>
                {product.originalPrice > product.price && (
                  <del className="text-lg text-slate-400 font-mono num">
                    {siteConfig.currencySymbol}{product.originalPrice}
                  </del>
                )}
                {product.discountPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-xs shadow-sm num">
                    {product.discountPercent}% ছাড়
                  </span>
                )}
              </div>

              {/* Stock Urgency Indicator Bar */}
              <div className="space-y-1.5 p-3 rounded-lg bg-amber-50 border border-amber-200/70">
                <div className="flex justify-between text-xs font-bold text-amber-900">
                  <span>🔥 স্টকে সীমিত সংখ্যক রয়েছে!</span>
                  <span className="num">মাত্র {product.stockLeft || 9} টি বাকি</span>
                </div>
                <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-rose-500 h-full w-3/4 rounded-full"></div>
                </div>
              </div>

              {/* Interactive Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    সাইজ নির্বাচন করুন: <span className="text-orange-600">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          selectedSize === s
                            ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-200'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-orange-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    কালার নির্বাচন করুন: <span className="text-orange-600">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c, idx) => {
                      const colorName = typeof c === 'string' ? c : c.name;
                      const colorHex = typeof c === 'object' ? c.hex : '#0f172a';
                      const isSelected = selectedColor === colorName;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColor(colorName)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 text-orange-900 border-orange-500 ring-2 ring-orange-200 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/20" 
                            style={{ backgroundColor: colorHex }}
                          />
                          <span>{colorName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Bundle Selector */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>🎁 বান্ডেল অফার নির্বাচন করুন:</span>
                  <span className="text-emerald-600 font-bold text-[11px]">বেশি কিনলে বেশি ছাড়</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  
                  {/* 1 Pc */}
                  <button
                    type="button"
                    onClick={() => handleSelectBundle('1')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedBundle === '1'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">১ টি কিনুন</div>
                    <div className="font-mono text-xs font-extrabold text-orange-600 mt-0.5 num">৳{product.price}</div>
                    <div className="text-[10px] text-slate-500">স্ট্যান্ডার্ড রেট</div>
                  </button>

                  {/* 2 Pcs (Popular) */}
                  <button
                    type="button"
                    onClick={() => handleSelectBundle('2')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative overflow-hidden ${
                      selectedBundle === '2'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl">
                      জনপ্রিয়
                    </span>
                    <div className="font-bold text-xs text-slate-900">২ টি কিনুন</div>
                    <div className="font-mono text-xs font-extrabold text-orange-600 mt-0.5 num">৳{(product.price * 2) - 100}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">৳১০০ ছাড়!</div>
                  </button>

                  {/* 3 Pcs (Super Saver) */}
                  <button
                    type="button"
                    onClick={() => handleSelectBundle('3')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative overflow-hidden ${
                      selectedBundle === '3'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl">
                      সেরা ডিল
                    </span>
                    <div className="font-bold text-xs text-slate-900">৩ টি কিনুন</div>
                    <div className="font-mono text-xs font-extrabold text-orange-600 mt-0.5 num">৳{(product.price * 3) - 250}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">৳২৫০ ছাড়!</div>
                  </button>

                </div>
              </div>

              {/* Primary Action Buttons -> Routes directly to Dedicated Ordering Page (/checkout/:slug) */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={goToCheckoutPage}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-base sm:text-lg shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚡ অর্ডার করতে ক্লিক করুন (Proceed to Order) →</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>💬 WhatsApp অর্ডার</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onAddToCart && onAddToCart({ ...product, selectedSize, selectedColor, quantity })}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🛒 কার্টে যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Delivery & Trust Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-base">🚚</span>
                  <div>
                    <span className="font-bold text-slate-900">ঢাকার ভেতরে ডেলিভারি চার্জ: ৳৭০</span> (১-২ কার্যদিবস)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🚚</span>
                  <div>
                    <span className="font-bold text-slate-900">ঢাকার বাইরে সারাদেশে: ৳১৩০</span> (২-৪ কার্যদিবস)
                  </div>
                </div>
                <div className="flex items-start gap-2 text-emerald-800 font-semibold">
                  <span className="text-base">🛡️</span>
                  <div>১০০% ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন</div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: PRODUCT HIGHLIGHTS & SPECS                        */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 mb-8 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-4 sm:gap-8 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm sm:text-base font-extrabold cursor-pointer transition-colors whitespace-nowrap relative ${
                activeTab === 'specs' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 বিস্তারিত বিবরণ ও বৈশিষ্ট্য
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm sm:text-base font-extrabold cursor-pointer transition-colors whitespace-nowrap relative ${
                activeTab === 'reviews' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⭐ কাস্টমার রিভিউ ({product.reviews?.length || 4})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 text-sm sm:text-base font-extrabold cursor-pointer transition-colors whitespace-nowrap relative ${
                activeTab === 'shipping' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛡️ ডেলিভারি ও রিটার্ন পলিসি
            </button>
          </div>

          {/* Tab 1: Detailed Specifications */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              
              {/* Description Paragraph */}
              <div className="prose max-w-none text-slate-700 leading-relaxed text-sm sm:text-base">
                <p>{product.description}</p>
              </div>

              {/* Key Specs Table */}
              {product.specs && product.specs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>✨ মূল স্পেসিফিকেশন ও ফিচারসমূহ:</span>
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <tbody>
                        {product.specs.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="py-2.5 px-4 font-bold text-slate-700 border-b border-slate-200/70 w-1/3">
                              {typeof item.key === 'object' ? (item.key?.key || item.key?.value || '') : String(item.key || '')}
                            </td>
                            <td className="py-2.5 px-4 text-slate-800 border-b border-slate-200/70">
                              {typeof item.value === 'object' ? (item.value?.value || item.value?.key || '') : String(item.value || '')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Direct Checkout Callout inside Description */}
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="font-bold text-orange-950 text-sm block">পণ্যটি আপনার পছন্দ হয়েছে?</span>
                  <span className="text-xs text-orange-800">এখনই ডেডিকেটেড অর্ডার পেজে গিয়ে ডেলিভারি বুকিং সম্পন্ন করুন!</span>
                </div>
                <button
                  type="button"
                  onClick={goToCheckoutPage}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-lg shadow transition-colors cursor-pointer whitespace-nowrap"
                >
                  ⚡ অর্ডার পেজে যান →
                </button>
              </div>

            </div>
          )}

          {/* Tab 2: Customer Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">১০০% যাচাইকৃত ক্রেতাদের মতামত</span>
                <span className="text-xs font-bold text-emerald-700">
                  ✓ Verified Purchases
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(product.reviews || [
                  { author: "Tanvir Ahmed", location: "ধানমন্ডি, ঢাকা", rating: 5, date: "২ দিন আগে", comment: "আলহামদুলিল্লাহ, ছবির মতোই হুবহু প্রোডাক্ট পেয়েছি। কোয়ালিটি অনেক ভালো।" },
                  { author: "Mahmudul Hasan", location: "জিইসি, চট্টগ্রাম", rating: 5, date: "৪ দিন আগে", comment: "খুব দ্রুত ডেলিভারি পেয়েছি। প্যাকেজিং ও ফিনিশিং দারুণ। ১০০% সন্তুষ্ট।" },
                  { author: "Rakibul Islam", location: "ময়মনসিংহ সদর", rating: 5, date: "১ সপ্তাহ আগে", comment: "হাতে পেয়ে চেক করে টাকা দিয়েছি। সাইজ এবং ফিনিশিং একদম পারফেক্ট হয়েছে।" },
                  { author: "Nusrat Jahan", location: "উত্তরা, ঢাকা", rating: 5, date: "২ সপ্তাহ আগে", comment: "কালারটা বাস্তবে দেখতে আরও সুন্দর। কাস্টমার সার্ভিস বেশ আন্তরিক।" }
                ]).map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{rev.author}</span>
                        <span className="text-xs text-slate-500">{rev.location}</span>
                      </div>
                      <div className="text-amber-500 text-sm">
                        {'★'.repeat(rev.rating || 5)}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic">"{rev.comment}"</p>
                    <div className="text-[11px] text-slate-400 text-right">{rev.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Shipping & Return Policy */}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">🚚 ক্যাশ অন ডেলিভারি সুবিধা</h4>
                <p>আমরা সমগ্র বাংলাদেশে ক্যাশ অন ডেলিভারি (Cash on Delivery) প্রদান করি। ডেলিভারি ম্যান পণ্য নিয়ে গেলে আপনি প্যাকেট খুলে চেক করে দেখে নিতে পারবেন এবং সন্তুষ্ট হলে মূল্য পরিশোধ করবেন।</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">🔄 সহজ ৭ দিনের রিটার্ন পলিসি</h4>
                <p>পণ্য কোনো কারণে ভাঙা, ত্রুটিযুক্ত বা বর্ণনার সাথে অমিল থাকলে সাথে সাথে ডেলিভারি ম্যানের কাছে ফেরত দিতে পারেন অথবা আমাদের হেল্পলাইনে জানালে ফ্রিতে এক্সচেঞ্জ বা রিফান্ড প্রদান করা হবে।</p>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* SECTION 3: PRECISION-FORMATTED RELEVANT PRODUCTS SHOWCASE    */}
        {/* Equal-height flex cards, 4:3/1:1 neutral image frames,       */}
        {/* aligned price baselines, tabular numerals, single-line CTAs  */}
        {/* ============================================================ */}
        {displayedRelevantProducts.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-8">
            
            {/* Section Header & Segmented Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200/80">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-orange-600">{product.categoryName || 'ক্যাটাগরি'}</span>
                  <span aria-hidden="true">·</span>
                  <span>কিউরেটেড কালেকশন</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  সম্পর্কিত ও জনপ্রিয় পণ্যসমূহ
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {sameCategoryProducts.length > 0 && (
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRelatedFilter('all')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        relatedFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      সেরা সুপারিশ ({combinedRelevant.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRelatedFilter('category')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        relatedFilter === 'category'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      একই ক্যাটাগরি ({sameCategoryProducts.slice(0, 8).length})
                    </button>
                  </div>
                )}

                {onBackToHome && (
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    সকল পণ্য দেখুন →
                  </button>
                )}
              </div>
            </div>

            {/* 4-Column Desktop / 2-Column Mobile Uniform Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
              {displayedRelevantProducts.map((relProduct) => {
                const discount =
                  relProduct.discountPercent ||
                  (relProduct.originalPrice > relProduct.price
                    ? Math.round(((relProduct.originalPrice - relProduct.price) / relProduct.originalPrice) * 100)
                    : 0);

                return (
                  <article
                    key={relProduct.id}
                    className="group bg-white rounded-xl border border-slate-200/90 hover:border-orange-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col overflow-hidden"
                  >
                    {/* 1. Uniform Square Image Container */}
                    <div
                      onClick={() => handleSelectRelatedProduct(relProduct)}
                      className="relative aspect-square w-full bg-slate-50 border-b border-slate-100 overflow-hidden cursor-pointer flex items-center justify-center p-3"
                    >
                      <img
                        src={relProduct.image}
                        alt={relProduct.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />

                      {discount > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded shadow-sm num">
                          -{discount}%
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRelatedProduct(relProduct);
                        }}
                        title="বিস্তারিত দেখুন"
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-white/90 hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200/80 flex items-center justify-center text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        👁️
                      </button>
                    </div>

                    {/* 2. Card Body with Strict Baseline Alignment */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                      <div className="space-y-1.5">
                        {/* Category & Rating inline metadata */}
                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500">
                          <span className="truncate font-semibold text-slate-500">
                            {relProduct.categoryName || 'কালেকশন'}
                          </span>
                          <span className="flex items-center gap-0.5 font-bold text-slate-700 shrink-0 num">
                            <span className="text-amber-500">★</span>
                            <span>{Number(relProduct.rating || 4.8).toFixed(1)}</span>
                          </span>
                        </div>

                        {/* Fixed 2-line Title Height so all cards align across the row */}
                        <h3
                          onClick={() => handleSelectRelatedProduct(relProduct)}
                          title={relProduct.title}
                          className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem] leading-snug cursor-pointer"
                        >
                          {relProduct.title}
                        </h3>
                      </div>

                      {/* Price & Action Footer */}
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-1.5 font-mono num">
                            <span className="text-base sm:text-lg font-black text-orange-600">
                              {siteConfig.currencySymbol}{relProduct.price}
                            </span>
                            {relProduct.originalPrice > relProduct.price && (
                              <del className="text-xs text-slate-400">
                                {siteConfig.currencySymbol}{relProduct.originalPrice}
                              </del>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700 whitespace-nowrap hidden sm:inline">
                            COD সুবিধা
                          </span>
                        </div>

                        {/* Action Row: Primary Order Button + Compact Add-to-Cart */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOrderRelatedProduct(relProduct)}
                            className="flex-1 py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap shadow-sm"
                          >
                            <span>⚡ অর্ডার করুন</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddToCart && onAddToCart(relProduct)}
                            title="কার্টে যোগ করুন"
                            className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 text-xs font-bold transition-colors cursor-pointer shrink-0"
                          >
                            🛒+
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

          </section>
        )}

      </main>
    </div>
  );
}
