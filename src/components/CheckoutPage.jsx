// src/components/CheckoutPage.jsx
/**
 * DeshiMart BD - Dedicated Single-Product Direct Ordering Page (/checkout/:slug)
 * 
 * Features:
 *   1. Distraction-Free High-Converting Funnel Header
 *   2. Pre-Selected Product Lock-in with Interactive Size, Color & Tiered Bundle Selector
 *   3. Zero-Friction 3-Field BD Cash on Delivery Checkout Form
 *   4. Bangla Numeral Sanitization & Operator Detection
 *   5. Real-Time Abandoned Lead Auto-Save (3s Debounce)
 *   6. 15-Minute Duplicate Order Spam Prevention
 *   7. Automatic Redirect to Dedicated Thank You Page (/thank-you/:slug/:orderId)
 */

import React, { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../config/siteConfig';
import { sanitizeBDPhone, isValidBDPhone, getBDOperatorName } from '../utils/phoneSanitizer';
import { trackInitiateCheckout } from '../utils/pixelManager';

export default function CheckoutPage({
  product,
  onOrderSuccess,
  onSaveDraftLead,
  onCleanupDraftLead,
  onCheckDuplicateOrder,
  onNavigateTo,
  onBackToHome
}) {
  if (!product) return null;

  // Read URL search params for initial pre-selections if navigated from product page
  const searchParams = new URLSearchParams(window.location.search);
  const initialBundle = searchParams.get('bundle') || '1';
  const initialSize = searchParams.get('size') || product.sizes?.[0] || 'Standard';
  const initialColor = searchParams.get('color') || product.colors?.[0]?.name || (typeof product.colors?.[0] === 'string' ? product.colors[0] : 'Standard');
  const initialQty = Number(searchParams.get('qty')) || Number(initialBundle) || 1;

  // Product Selection States
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedBundle, setSelectedBundle] = useState(initialBundle);
  const [quantity, setQuantity] = useState(initialQty);

  // Sync product selection state if product changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get('bundle') || '1';
    const s = params.get('size') || product.sizes?.[0] || 'Standard';
    const c = params.get('color') || product.colors?.[0]?.name || (typeof product.colors?.[0] === 'string' ? product.colors[0] : 'Standard');
    const q = Number(params.get('qty')) || Number(b) || 1;
    setSelectedBundle(b);
    setSelectedSize(s);
    setSelectedColor(c);
    setQuantity(q);
  }, [product.id, product.slug]);

  // Form inputs state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('inside'); // 'inside' = 70, 'outside' = 130
  
  // Validation & Submission
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce ref for Abandoned Lead Auto-Save
  const leadDebounceTimer = useRef(null);

  // InitiateCheckout tracked flag (fire once)
  const hasInitiatedCheckout = useRef(false);

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
  const subtotal = Math.max(0, itemsBaseTotal - bundleDiscount);
  const grandTotal = subtotal + deliveryFee;

  // Dynamic SEO & Title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `অর্ডার কনফার্ম করুন - ${product.title} | ${siteConfig.brandName}`;
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Track Meta / TikTok InitiateCheckout on load
    if (!hasInitiatedCheckout.current) {
      hasInitiatedCheckout.current = true;
      trackInitiateCheckout(product, quantity, grandTotal);
    }

    return () => {
      document.title = originalTitle;
    };
  }, [product]);

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
        hasOrderBump: false,
        estimatedTotal: grandTotal,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        status: 'অসম্পূর্ণ (Abandoned Lead)',
        source: 'Dedicated Checkout Page'
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
  }, [customerPhone, customerName, customerAddress, selectedSize, selectedColor, quantity, grandTotal, product]);

  // Handle Order Submit
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

    // 15-Minute Duplicate Order Cooldown Protection
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
      hasOrderBump: false,
      orderBumpItem: null,
      subtotal,
      grandTotal,
      date: now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      statusStep: 1,
      status: 'অর্ডার গৃহীত হয়েছে (Order Placed)',
      courier: 'Steadfast Courier',
      consignmentId: `STF-${Math.floor(100000 + Math.random() * 900000)}`,
      source: 'Dedicated Checkout Page',
      timestamp: Date.now(),
      upsellItems: []
    };

    setTimeout(() => {
      setIsSubmitting(false);

      // Clean up abandoned lead
      if (onCleanupDraftLead) {
        onCleanupDraftLead(cleanedPhone);
      }

      // Add to orders
      if (onOrderSuccess) {
        onOrderSuccess(newOrder);
      }

      // Redirect immediately to Dedicated Thank You Page (Page 3)
      const thankYouUrl = `/thank-you/${product.slug || product.id}/${newOrder.orderId}`;
      if (onNavigateTo) {
        onNavigateTo(thankYouUrl);
      } else {
        window.location.href = thankYouUrl;
      }
    }, 600);
  };

  return (
    <div className="checkout-page-wrapper bg-slate-50 min-h-screen text-slate-800 pb-16 font-sans">
      
      {/* 1. Distraction-Free Header */}
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              D
            </span>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 block leading-tight">
                {siteConfig.brandName}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block">
                সুরক্ষিত ডিরেক্ট চেকআউট (100% COD)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-slate-500">
              হেল্পলাইন: <strong className="text-slate-800 num">{siteConfig.displayHelpline}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTo ? onNavigateTo(`/product/${product.slug || product.id}`) : onBackToHome()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              ← পণ্যের পেজে ফিরুন
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-400">
          <span className="text-slate-600">১. পণ্য নির্বাচন</span>
          <span>→</span>
          <span className="px-3 py-1 rounded-md bg-orange-600 text-white shadow-sm">
            ২. চেকআউট ও ডেলিভারি তথ্য
          </span>
          <span>→</span>
          <span>৩. অর্ডার নিশ্চিত</span>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left 7 Columns: Product Lock-In & Delivery Inputs */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
            
            {/* Pre-Selected Product Lock-In Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 block">
                নির্বাচিত পণ্য:
              </span>
              <div className="flex items-center gap-3">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-16 h-16 object-cover rounded-xl bg-white border border-slate-200 flex-shrink-0"
                />
                <div>
                  <h2 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                    {product.title}
                  </h2>
                  <div className="flex items-baseline gap-2 mt-1 font-mono num">
                    <span className="font-black text-base text-orange-600">৳{product.price}</span>
                    {product.originalPrice && (
                      <del className="text-xs text-slate-400">৳{product.originalPrice}</del>
                    )}
                    <span className="text-rose-700 text-[11px] font-bold">
                      · অফার রেট
                    </span>
                  </div>
                </div>
              </div>

              {/* Variant Selectors inside Lock-in Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                {/* Size Buttons */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">সাইজ:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                            selectedSize === s 
                              ? 'border-orange-500 bg-orange-600 text-white' 
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Buttons */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">কালার:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {product.colors.map(c => {
                        const colorName = typeof c === 'string' ? c : c.name;
                        return (
                          <button
                            key={colorName}
                            type="button"
                            onClick={() => setSelectedColor(colorName)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                              selectedColor === colorName 
                                ? 'border-orange-500 bg-orange-600 text-white' 
                                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                            }`}
                          >
                            {colorName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Tiered Quantity Bundle Discount Selector */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>🎁 বেশি কিনলে বেশি ছাড় (বান্ডেল সিলেক্ট):</span>
                  <span className="text-emerald-700 font-extrabold text-[10px]">অতিরিক্ত ডেলিভারি চার্জ নেই</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* 1 Pc */}
                  <button
                    type="button"
                    onClick={() => handleSelectBundle('1')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      selectedBundle === '1'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-slate-900">১ টি</div>
                    <div className="font-mono text-xs font-black text-orange-600 num">৳{product.price}</div>
                  </button>

                  {/* 2 Pcs */}
                  <button
                    type="button"
                    onClick={() => handleSelectBundle('2')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all relative ${
                      selectedBundle === '2'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="absolute -top-1.5 right-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded">
                      জনপ্রিয়
                    </span>
                    <div className="font-bold text-[11px] text-slate-900">২ টি (Save ৳100)</div>
                    <div className="font-mono text-xs font-black text-orange-600 num">৳{(product.price * 2) - 100}</div>
                  </button>

                  {/* 3 Pcs */}
                  <button
                    type="button"
                    onClick={() => handleSelectBundle('3')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all relative ${
                      selectedBundle === '3'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="absolute -top-1.5 right-1 bg-emerald-600 text-white text-[8px] font-black px-1 rounded">
                      সেরা ছাড়
                    </span>
                    <div className="font-bold text-[11px] text-slate-900">৩ টি (Save ৳250)</div>
                    <div className="font-mono text-xs font-black text-orange-600 num">৳{(product.price * 3) - 250}</div>
                  </button>

                </div>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* 3-Field Customer Delivery Form */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                📦 আপনার ডেলিভারি তথ্য দিন:
              </h3>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none bg-slate-50/50"
                />
              </div>

              {/* Phone Input with Bangla Numeral Sanitizer & Operator Display */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    ১১ ডিজিটের মোবাইল নাম্বার <span className="text-rose-500">*</span>
                  </label>
                  {customerPhone && (
                    <span className="text-[11px] font-mono font-bold text-emerald-600">
                      {isValidBDPhone(customerPhone) ? `✓ ${getBDOperatorName(customerPhone)}` : ''}
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(sanitizeBDPhone(e.target.value))}
                  placeholder="যেমন: 01712345678 বা ০১৭১২৩৪৫৬৭৮"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none font-mono bg-slate-50/50 num"
                />
                <span className="text-[10px] text-slate-500 block">
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
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="বাসা/রোড নং, এলাকা, থানা/উপজেলা এবং জেলার নাম বিস্তারিত লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm outline-none bg-slate-50/50"
                ></textarea>
              </div>

              {/* Delivery Area Selection */}
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
                        name="direct_checkout_delivery_area"
                        checked={deliveryArea === 'inside'}
                        onChange={() => setDeliveryArea('inside')}
                        className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">ঢাকার ভেতরে</span>
                        <span className="text-[11px] text-slate-500">হোম ডেলিভারি (১-২ দিন)</span>
                      </div>
                    </div>
                    <span className="font-black text-orange-600 font-mono text-sm num">৳৭০</span>
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
                        name="direct_checkout_delivery_area"
                        checked={deliveryArea === 'outside'}
                        onChange={() => setDeliveryArea('outside')}
                        className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">ঢাকার বাইরে</span>
                        <span className="text-[11px] text-slate-500">সারা বাংলাদেশে (২-৪ দিন)</span>
                      </div>
                    </div>
                    <span className="font-black text-orange-600 font-mono text-sm num">৳১৩০</span>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* Right 5 Columns: Live Bill Summary & CTA (Yellow Order Bump Removed) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
            
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>🛍️ অর্ডার সামারি ও পেমেন্ট</span>
            </h3>

            {/* Editable Quantity Stepper */}
            <div className="flex items-center justify-between text-xs sm:text-sm py-1">
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
                <span className="w-8 text-center font-bold font-mono num">{quantity}</span>
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

            {/* Bill Calculations */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>পণ্যের মূল্য ({quantity} টি):</span>
                <span className="font-mono font-bold text-slate-900 num">৳{itemsBaseTotal}</span>
              </div>

              {bundleDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>বান্ডেল ডিসকাউন্ট:</span>
                  <span className="font-mono num">-৳{bundleDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-mono font-bold text-slate-900 num">৳{deliveryFee}</span>
              </div>

              <div className="border-t-2 border-slate-100 pt-3 flex justify-between items-center text-sm sm:text-base font-extrabold text-slate-900">
                <span>সর্বমোট প্রদেয় টাকা:</span>
                <span className="text-lg sm:text-xl font-mono text-orange-600 font-black num">
                  ৳{grandTotal}
                </span>
              </div>
            </div>

            {/* 100% Cash on Delivery Assurance Banner */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <span className="text-base leading-none">🛡️</span>
              <div className="leading-relaxed">
                <strong>১ টাকাও অগ্রিম দিতে হবে না!</strong>
                <br />পণ্য হাতে পেয়ে দেখে ডেলিভারি ম্যানকে পেমেন্ট করুন।
              </div>
            </div>

            {/* Primary Order Confirm CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-6 rounded-xl text-white font-extrabold text-base sm:text-lg shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isSubmitting 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>অর্ডার প্রসেস হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>✓ অর্ডার নিশ্চিত করুন (৳{grandTotal})</span>
                </>
              )}
            </button>

            {/* Trust Seals */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-slate-500 pt-1">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                🔒 ১০০% নিরাপদ পেমেন্ট
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                🔄 ৭ দিনের সহজ রিটার্ন
              </div>
            </div>

          </div>

        </form>

      </main>

    </div>
  );
}
