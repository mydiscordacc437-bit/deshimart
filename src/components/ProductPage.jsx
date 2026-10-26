// src/components/ProductPage.jsx
/**
 * Dedicated Single-Product Landing Page & High-Conversion Facebook/Instagram Ad Funnel
 * 
 * Phase 4 Enhancements:
 *   - Strict BD Mobile Sanitization (Bangla numeral conversion, +88 stripping, 01[3-9] prefix)
 *   - Real-Time Abandoned Checkout Lead Capture (3-second debounce auto-save)
 *   - Auto-Cleanup on Purchase
 *   - 15-Minute Duplicate Order Shield
 *   - Tiered Quantity Bundle Discount Selector (1 pc vs 2 pcs - ৳100 off vs 3 pcs - ৳250 off)
 *   - 1-Click Order Bump Checkbox (Yellow dashed box #FEFCE8 with complementary item)
 *   - Dynamic Meta (Facebook) & TikTok Pixel tracking (ViewContent, InitiateCheckout, Purchase)
 */

import React, { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../config/siteConfig';
import { sanitizeBDPhone, isValidBDPhone, getBDOperatorName } from '../utils/phoneSanitizer';
import { trackViewContent, trackInitiateCheckout, trackPurchase } from '../utils/pixelManager';

export default function ProductPage({
  product,
  isAdMode = false,
  onBackToHome,
  onOrderSuccess,
  onAddToCart,
  onOpenTracking,
  cartCount = 0,
  onSaveDraftLead,
  onCleanupDraftLead,
  onCheckDuplicateOrder,
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
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || 'Standard');
  
  // Tiered Quantity Bundle state: '1', '2', '3'
  const [selectedBundle, setSelectedBundle] = useState('1');
  const [quantity, setQuantity] = useState(1);

  // 1-Click Order Bump State
  const [hasOrderBump, setHasOrderBump] = useState(false);

  // Form inputs state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('inside'); // 'inside' = 70, 'outside' = 130
  
  // Submission & validation state
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteData, setOrderCompleteData] = useState(null);

  // Active tab in details section
  const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'reviews', 'shipping'

  // Scroll to order section reference
  const orderSectionRef = useRef(null);

  // Debounce ref for Abandoned Lead Auto-Save
  const leadDebounceTimer = useRef(null);

  // InitiateCheckout tracked flag (fire once per session)
  const hasInitiatedCheckout = useRef(false);

  const scrollToOrder = () => {
    if (!hasInitiatedCheckout.current) {
      hasInitiatedCheckout.current = true;
      trackInitiateCheckout(product, quantity, grandTotal);
    }

    const el = document.getElementById('order-form') || document.getElementById('order-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (orderSectionRef.current) {
      orderSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Complementary Order Bump Item based on product category
  const orderBumpItem = {
    title: product.category === 'gadgets' || product.category === 'watches-accessories'
      ? 'হ্যান্ডবস মাল্টি-পারপাস হাই-পাওয়ার ক্লিনিং ফোম ও ব্রাশ কিট (650ml)'
      : product.category === 'shoes'
      ? 'প্রিমিয়াম অ্যান্টি-ব্যাকটেরিয়াল সিলিকন কুশন ইনসোল ও মোজা পেয়ার'
      : 'ম্যাজিক লিন্ট রিমুভার ও প্রিমিয়াম ফেব্রিক রিফ্রেশার কিট',
    originalPrice: 480,
    bumpPrice: 290,
    image: product.category === 'shoes'
      ? 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80'
      : 'https://bbazar.com.bd/backend/product/IL7qtGmgb1yQ4KnzGTBQwx7Poaro2tpswlcXvXfr.jpg'
  };

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
  const deliveryFee = deliveryArea === 'inside' ? 70 : 130;
  const itemsBaseTotal = product.price * quantity;
  const bumpTotal = hasOrderBump ? orderBumpItem.bumpPrice : 0;
  const subtotal = Math.max(0, itemsBaseTotal - bundleDiscount + bumpTotal);
  const grandTotal = subtotal + deliveryFee;

  // Real-Time Abandoned Lead Auto-Save (3-Second Debounce)
  useEffect(() => {
    const cleanedPhone = sanitizeBDPhone(customerPhone);
    if (!isValidBDPhone(cleanedPhone)) return;

    if (leadDebounceTimer.current) {
      clearTimeout(leadDebounceTimer.current);
    }

    leadDebounceTimer.current = setTimeout(() => {
      const now = new Date();
      const draftLead = {
        leadId: `LEAD-${cleanedPhone}-${product.id}`,
        customerName: customerName.trim() || 'অসম্পূর্ণ নাম',
        customerPhone: cleanedPhone,
        customerAddress: customerAddress.trim() || 'ঠিকানা দেওয়া হয়নি',
        operator: getBDOperatorName(cleanedPhone),
        product: {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          sku: product.sku || `BBZ-${product.id}`
        },
        selectedSize,
        selectedColor,
        quantity,
        hasOrderBump,
        estimatedTotal: grandTotal,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        status: 'অসম্পূর্ণ (Abandoned Lead)',
        source: isAdMode ? 'Facebook Ad Funnel' : 'Standard Product Page'
      };

      if (onSaveDraftLead) {
        onSaveDraftLead(draftLead);
      }
    }, 3000);

    return () => {
      if (leadDebounceTimer.current) {
        clearTimeout(leadDebounceTimer.current);
      }
    };
  }, [customerPhone, customerName, customerAddress, selectedSize, selectedColor, quantity, hasOrderBump, grandTotal, product]);

  // Track InitiateCheckout on field focus
  const handleFieldFocus = () => {
    if (!hasInitiatedCheckout.current) {
      hasInitiatedCheckout.current = true;
      trackInitiateCheckout(product, quantity, grandTotal);
    }
  };

  // WhatsApp order link with pre-filled message
  const whatsappCleanNumber = siteConfig.whatsappNumber ? siteConfig.whatsappNumber.replace(/[^0-9]/g, '') : '1700000000';
  const whatsappMessage = encodeURIComponent(
    `আসসালামু আলাইকুম! আমি এই প্রোডাক্টটি অর্ডার করতে আগ্রহী:\n\n` +
    `📌 পণ্য: ${product.title}\n` +
    `🏷️ সাইজ: ${selectedSize}\n` +
    `🎨 কালার: ${selectedColor}\n` +
    `🔢 পরিমাণ: ${quantity}টি\n` +
    (hasOrderBump ? `🎁 সাথে অ্যাড-অন: ${orderBumpItem.title} (+৳${orderBumpItem.bumpPrice})\n` : '') +
    `💰 সর্বমোট মূল্য: ৳${grandTotal}\n\n` +
    `🔗 লিংক: ${window.location.href}\n\n` +
    `অনুগ্রহ করে আমার অর্ডারটি কনফার্ম করুন।`
  );
  const whatsappUrl = `https://wa.me/88${whatsappCleanNumber}?text=${whatsappMessage}`;

  // Handle embedded checkout order submission
  const handleSubmitOrder = (e) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।');
      return;
    }

    const cleanedPhone = sanitizeBDPhone(customerPhone);
    if (!cleanedPhone) {
      setFormError('অনুগ্রহ করে আপনার মোবাইল নাম্বার লিখুন।');
      return;
    }

    if (!isValidBDPhone(cleanedPhone)) {
      setFormError('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX বা 019XXXXXXXX)');
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 8) {
      setFormError('অনুগ্রহ করে আপনার পূর্ণ ডেলিভারি ঠিকানা (বাসা নং, রোড, থানা/উপজেলা, জেলা) বিস্তারিত লিখুন।');
      return;
    }

    // 15-Minute Duplicate Order Prevention
    if (onCheckDuplicateOrder && onCheckDuplicateOrder(cleanedPhone, product.id)) {
      setFormError('⚠️ আপনার অর্ডারটি ইতিমধ্যে গ্রহণ করা হয়েছে! আমাদের প্রতিনিধি শীঘ্রই আপনাকে কল করবেন। (অতিরিক্ত অর্ডারের প্রয়োজন হলে হেল্পলাইনে কল করুন)');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const orderId = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      orderId,
      customerName: customerName.trim(),
      customerPhone: cleanedPhone,
      customerAddress: customerAddress.trim(),
      operator: getBDOperatorName(cleanedPhone),
      deliveryArea: deliveryArea === 'inside' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে',
      deliveryFee,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        sku: product.sku || `BBZ-${product.id}`
      },
      selectedSize,
      selectedColor,
      quantity,
      bundleOption: selectedBundle,
      bundleDiscount,
      hasOrderBump,
      orderBumpItem: hasOrderBump ? orderBumpItem : null,
      subtotal,
      grandTotal,
      date: now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      statusStep: 1, // Step 1: অর্ডার রিসিভড
      status: 'অর্ডার রিসিভড (Order Placed)',
      courier: 'Steadfast Courier',
      consignmentId: `STF-${Math.floor(100000 + Math.random() * 900000)}`,
      source: isAdMode ? 'Facebook Ad Funnel' : 'Standard Product Page',
      timestamp: Date.now()
    };

    setTimeout(() => {
      setIsSubmitting(false);

      // Auto-Cleanup from Abandoned Leads
      if (onCleanupDraftLead) {
        onCleanupDraftLead(cleanedPhone);
      }

      // Add to confirmed orders
      if (onOrderSuccess) {
        onOrderSuccess(newOrder);
      }

      // Redirect immediately to Dedicated Thank You Page (Page 3 of funnel)
      const thankYouUrl = `/thank-you/${product.slug || product.id}/${newOrder.orderId}`;
      if (onNavigateTo) {
        onNavigateTo(thankYouUrl);
      } else {
        setOrderCompleteData(newOrder);
      }
    }, 600);
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
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <span>💬 WhatsApp</span>
              </a>
              <button 
                onClick={scrollToOrder}
                className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs sm:text-sm font-black rounded-full shadow hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer animate-pulse"
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
                onClick={onBackToHome}
                className="text-orange-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← হোমপেজে ফিরুন
              </button>
              <span>/</span>
              <span className="text-slate-500">{product.categoryName || 'পণ্য'}</span>
              <span>/</span>
              <span className="text-slate-800 font-medium truncate max-w-[180px] sm:max-w-sm">{product.title}</span>
            </div>
            <div className="flex items-center gap-3">
              
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
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
                {product.discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                    -{product.discountPercent}% ছাড়
                  </span>
                )}
                {product.isFlashSale && (
                  <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    ⚡ ফ্ল্যাশ ডিল
                  </span>
                )}
              </div>

              {/* Clickable Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 bg-slate-50 transition-all cursor-pointer ${
                        activeImageIndex === idx 
                          ? 'border-orange-500 ring-2 ring-orange-200 shadow' 
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
              
              {/* Category & SKU badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold text-xs">
                  {product.categoryName || 'প্রিমিয়াম কালেকশন'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs">
                  SKU: {product.sku || `BBZ-${product.id}`}
                </span>
                <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
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
                <span className="font-bold text-slate-800">{Number(product.rating || 4.9).toFixed(1)}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 underline">({product.reviewsCount || 120} যাচাইকৃত কাস্টমার রিভিউ)</span>
              </div>

              {/* Pricing Box with High Urgency */}
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-orange-600 font-mono tracking-tight">
                  {siteConfig.currencySymbol}{product.price}
                </span>
                {product.originalPrice > product.price && (
                  <del className="text-lg text-slate-400 font-mono font-medium">
                    {siteConfig.currencySymbol}{product.originalPrice}
                  </del>
                )}
                {product.discountPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-sm">
                    {product.discountPercent}% ছাড়
                  </span>
                )}
              </div>

              {/* Stock Urgency Indicator Bar */}
              <div className="space-y-1.5 p-3 rounded-lg bg-amber-50 border border-amber-200/70">
                <div className="flex justify-between text-xs font-bold text-amber-900">
                  <span>🔥 স্টকে সীমিত সংখ্যক রয়েছে!</span>
                  <span>মাত্র {product.stockLeft || 9} টি বাকি</span>
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

              {/* Quantity Bundle Selector Pills (Profit Booster) */}
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
                    <div className="font-mono text-xs font-extrabold text-orange-600 mt-0.5">৳{product.price}</div>
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
                    <div className="font-mono text-xs font-extrabold text-orange-600 mt-0.5">৳{(product.price * 2) - 100}</div>
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
                    <div className="font-mono text-xs font-extrabold text-orange-600 mt-0.5">৳{(product.price * 3) - 250}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">৳২৫০ ছাড়!</div>
                  </button>

                </div>
              </div>

              {/* High-Converting Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={scrollToOrder}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-extrabold text-base sm:text-lg shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 group animate-bounce"
                >
                  <span>⚡ অর্ডার করতে ক্লিক করুন (Proceed to Order)</span>
                </button>

                {/* Direct Checkout Page Link */}
                <button
                  type="button"
                  onClick={() => {
                    const checkoutUrl = `/checkout/${product.slug || product.id}?size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor)}&qty=${quantity}&bundle=${selectedBundle}`;
                    if (onNavigateTo) onNavigateTo(checkoutUrl);
                    else window.location.href = checkoutUrl;
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm cursor-pointer"
                >
                  <span>🛒 সরাসরি চেকআউট পেজে যান (Direct Checkout Page) →</span>
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
        {/* SECTION 2: PRODUCT HIGHLIGHTS & SPECS (Ad Funnel Style)     */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 mb-8 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-4 sm:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm sm:text-base font-extrabold cursor-pointer transition-colors relative ${
                activeTab === 'specs' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 বিস্তারিত বিবরণ ও বৈশিষ্ট্য
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm sm:text-base font-extrabold cursor-pointer transition-colors relative ${
                activeTab === 'reviews' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⭐ কাস্টমার রিভিউ ({product.reviews?.length || 4})
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 text-sm sm:text-base font-extrabold cursor-pointer transition-colors relative ${
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

              {/* Fast Scroll to Order Bar inside Description */}
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="font-bold text-orange-950 text-sm block">পণ্যটি আপনার পছন্দ হয়েছে?</span>
                  <span className="text-xs text-orange-800">দেরি না করে এখনই অর্ডার কনফার্ম করে ডেলিভারি বুকিং সম্পন্ন করুন!</span>
                </div>
                <button
                  type="button"
                  onClick={scrollToOrder}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-lg shadow transition-colors cursor-pointer"
                >
                  ⚡ সরাসরি অর্ডার করুন
                </button>
              </div>

            </div>
          )}

          {/* Tab 2: Customer Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">১০০% যাচাইকৃত ক্রেতাদের মতামত</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
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
        {/* SECTION 3: DEDICATED ON-PAGE CHECKOUT BOX (#order-section)  */}
        {/* Built directly into the bottom of EVERY single product page! */}
        {/* ============================================================ */}
        <div id="order-form" className="scroll-mt-8"></div>
        <section 
          id="order-section" 
          ref={orderSectionRef} 
          className="scroll-mt-6 bg-gradient-to-b from-orange-50 via-white to-orange-50/50 rounded-2xl border-2 border-orange-500 shadow-xl overflow-hidden p-4 sm:p-8"
        >
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2">
            <span className="inline-block px-3 py-1 bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-sm">
              দ্রুত অর্ডার কনফার্মেশন
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              অর্ডারটি কনফার্ম করতে নিচের ফর্মটি পূরণ করুন
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 font-bold bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-200">
              🛡️ ১০০% ক্যাশ অন ডেলিভারি — কোনো অগ্রিম টাকা দেওয়ার প্রয়োজন নেই!
            </p>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <div className="max-w-2xl mx-auto mb-6 p-3.5 bg-rose-50 border border-rose-300 text-rose-700 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 animate-shake">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Two-Column Form Layout */}
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Columns: Customer Information Form */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>👤 কাস্টমার ডেলিভারি তথ্য:</span>
              </h3>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onFocus={handleFieldFocus}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none bg-slate-50/50"
                />
              </div>

              {/* 11 Digit BD Mobile Number with Auto-Sanitization */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">
                    ১১ ডিজিটের মোবাইল নাম্বার <span className="text-rose-500">*</span>
                  </label>
                  {customerPhone && (
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">
                      {isValidBDPhone(customerPhone) ? `✓ ${getBDOperatorName(customerPhone)}` : ''}
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  value={customerPhone}
                  onFocus={handleFieldFocus}
                  onChange={(e) => setCustomerPhone(sanitizeBDPhone(e.target.value))}
                  placeholder="যেমন: 01712345678 বা ০১৭১২৩৪৫৬৭৮"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none font-mono bg-slate-50/50"
                />
                <span className="text-[11px] text-slate-500">
                  বাংলা বা ইংরেজি যেকোনো সংখ্যায় টাইপ করতে পারেন (013-019)।
                </span>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={customerAddress}
                  onFocus={handleFieldFocus}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="বাসা/রোড নং, এলাকা, থানা/উপজেলা এবং জেলার নাম বিস্তারিত লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none bg-slate-50/50"
                ></textarea>
              </div>

              {/* Delivery Area Cards */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  ডেলিভারি এরিয়া নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Inside Dhaka */}
                  <div
                    onClick={() => setDeliveryArea('inside')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      deliveryArea === 'inside'
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="delivery_area_radio"
                        checked={deliveryArea === 'inside'}
                        onChange={() => setDeliveryArea('inside')}
                        className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">ঢাকার ভেতরে</span>
                        <span className="text-[11px] text-slate-500">হোম ডেলিভারি (১-২ দিন)</span>
                      </div>
                    </div>
                    <span className="font-black text-orange-600 font-mono text-sm">৳৭০</span>
                  </div>

                  {/* Outside Dhaka */}
                  <div
                    onClick={() => setDeliveryArea('outside')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      deliveryArea === 'outside'
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="delivery_area_radio"
                        checked={deliveryArea === 'outside'}
                        onChange={() => setDeliveryArea('outside')}
                        className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">ঢাকার বাইরে</span>
                        <span className="text-[11px] text-slate-500">সারা বাংলাদেশে (২-৪ দিন)</span>
                      </div>
                    </div>
                    <span className="font-black text-orange-600 font-mono text-sm">৳১৩০</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Right 5 Columns: Live Order Summary & Confirm CTA */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>🛍️ আপনার অর্ডার সামারি:</span>
              </h3>

              {/* Selected Product Card */}
              <div className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-[72px] h-[72px] object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-white"
                />
                <div className="space-y-1 overflow-hidden">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                    {product.title}
                  </h4>
                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-2">
                    <span>সাইজ: <strong>{selectedSize}</strong></span>
                    <span>কালার: <strong>{selectedColor}</strong></span>
                  </div>
                  <div className="font-extrabold text-orange-600 font-mono text-sm">
                    {siteConfig.currencySymbol}{product.price}
                  </div>
                </div>
              </div>

              {/* Editable Quantity Stepper in Summary */}
              <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                <span className="font-bold text-slate-700">অর্ডার পরিমাণ:</span>
                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const newQ = Math.max(1, quantity - 1);
                      setQuantity(newQ);
                      setSelectedBundle(String(newQ));
                    }}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold font-mono">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newQ = quantity + 1;
                      setQuantity(newQ);
                      setSelectedBundle(String(newQ));
                    }}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 1-Click Order Bump Checkbox (High Profit Booster) */}
              <div 
                style={{ background: '#FEFCE8', border: '2px dashed #EAB308' }} 
                className="p-3.5 rounded-xl space-y-2 transition-all"
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOrderBump}
                    onChange={(e) => setHasOrderBump(e.target.checked)}
                    className="w-5 h-5 text-orange-600 rounded mt-0.5 focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <span className="font-black text-slate-900 text-xs sm:text-sm leading-tight block">
                      🎁 হ্যাঁ! এই অর্ডারের সাথে আরও ১টি <strong className="text-orange-700">{orderBumpItem.title}</strong> মাত্র ৳{orderBumpItem.bumpPrice}-এ যোগ করতে চাই
                      <span className="ml-1 text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] inline-block">
                        (এক্সট্রা ডেলিভারি চার্জ লাগবে না!)
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      রেগুলার মূল্য <del className="text-slate-400">৳{orderBumpItem.originalPrice}</del> | শুধুমাত্র আজকের স্পেশাল ডিল মাত্র <strong>৳{orderBumpItem.bumpPrice}</strong>!
                    </span>
                  </div>
                </label>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>পণ্যের মূল্য ({quantity} টি):</span>
                  <span className="font-mono font-bold text-slate-800">{siteConfig.currencySymbol}{itemsBaseTotal}</span>
                </div>

                {bundleDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>বান্ডেল ডিসকাউন্ট:</span>
                    <span className="font-mono">-৳{bundleDiscount}</span>
                  </div>
                )}

                {hasOrderBump && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>অ্যাড-অন প্রডাক্ট (Order Bump):</span>
                    <span className="font-mono">+৳{orderBumpItem.bumpPrice}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-mono font-bold text-slate-800">{siteConfig.currencySymbol}{deliveryFee}</span>
                </div>

                <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>সর্বমোট প্রদেয় টাকা:</span>
                  <span className="font-mono text-orange-600">{siteConfig.currencySymbol}{grandTotal}</span>
                </div>
              </div>

              {/* Payment Method Badge */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <span className="text-base">✅</span>
                <span>ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে ডেলিভারি ম্যানকে টাকা দিন)</span>
              </div>

              {/* Massive Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-black text-base sm:text-lg shadow-xl hover:shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    অর্ডার প্রসেস হচ্ছে...
                  </span>
                ) : (
                  <span>অর্ডার কনফার্ম করুন (Confirm Order - ৳{grandTotal})</span>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <span>🔒</span>
                <span>আপনার তথ্য সম্পূর্ণ নিরাপদ ও সুরক্ষিত থাকবে।</span>
              </div>

            </div>

          </form>

        </section>

      </main>

      {/* ============================================================ */}
      {/* SECTION 4: POST-PURCHASE CASH MEMO / INVOICE MODAL          */}
      {/* ============================================================ */}
      {orderCompleteData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Success Icon */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl flex items-center justify-center mx-auto shadow-inner animate-bounce">
                ✓
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                আলহামদুলিল্লাহ, আপনার অর্ডার কনফার্ম হয়েছে!
              </h3>
              <p className="text-xs text-slate-600">
                আমাদের প্রতিনিধি শীঘ্রই আপনার নাম্বারে কল করে অর্ডারটি ভেরিফাই করবেন।
              </p>
            </div>

            {/* Printable Cash Memo Box */}
            <div id="printable-cash-memo" className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-extrabold text-orange-600">{siteConfig.brandName} - ক্যাশ মেমো</span>
                <span className="font-mono font-bold text-slate-800">#{orderCompleteData.orderId}</span>
              </div>

              <div className="space-y-1 text-slate-600">
                <div><strong>নাম:</strong> {orderCompleteData.customerName}</div>
                <div><strong>মোবাইল:</strong> {orderCompleteData.customerPhone} ({orderCompleteData.operator})</div>
                <div><strong>ঠিকানা:</strong> {orderCompleteData.customerAddress}</div>
                <div><strong>পণ্য:</strong> {orderCompleteData.product?.title}</div>
                <div><strong>সাইজ / কালার:</strong> {orderCompleteData.selectedSize} / {orderCompleteData.selectedColor}</div>
                <div><strong>পরিমাণ:</strong> {orderCompleteData.quantity} টি</div>
                {orderCompleteData.hasOrderBump && (
                  <div className="text-amber-800 font-semibold">
                    <strong>🎁 স্পেশাল অ্যাড-অন:</strong> {orderCompleteData.orderBumpItem?.title} (+৳{orderCompleteData.orderBumpItem?.bumpPrice})
                  </div>
                )}
                <div><strong>কুরিয়ার সার্ভিস:</strong> {orderCompleteData.courier} (কনসাইনমেন্ট: {orderCompleteData.consignmentId})</div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-base text-slate-900">
                <span>সর্বমোট প্রদেয় বিল:</span>
                <span className="font-mono text-orange-600">৳{orderCompleteData.grandTotal} (ক্যাশ অন ডেলিভারি)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🖨️ রসিদ প্রিন্ট করুন</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderCompleteData(null);
                  if (onBackToHome) onBackToHome();
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>হোমপেজে ফিরুন</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
