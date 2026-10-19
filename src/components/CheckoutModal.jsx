// src/components/CheckoutModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../config/siteConfig';
import { sanitizeBDPhone, isValidBDPhone, getBDOperatorName } from '../utils/phoneSanitizer';
import { trackInitiateCheckout, trackPurchase } from '../utils/pixelManager';

export default function CheckoutModal({ 
  product, 
  isOpen, 
  onClose, 
  onOrderSuccess,
  onOpenTracking,
  onSaveDraftLead,
  onCleanupDraftLead,
  onCheckDuplicateOrder
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [hasOrderBump, setHasOrderBump] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('insideDhaka');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteData, setOrderCompleteData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const leadDebounceTimer = useRef(null);
  const hasInitiatedCheckout = useRef(false);

  // Complementary Order Bump Item
  const orderBumpItem = {
    title: product?.category === 'gadgets' || product?.category === 'watches-accessories'
      ? 'হ্যান্ডবস মাল্টি-পারপাস হাই-পাওয়ার ক্লিনিং ফোম ও ব্রাশ কিট (650ml)'
      : product?.category === 'shoes'
      ? 'প্রিমিয়াম অ্যান্টি-ব্যাকটেরিয়াল সিলিকন কুশন ইনসোল ও মোজা পেয়ার'
      : 'ম্যাজিক লিন্ট রিমুভার ও প্রিমিয়াম ফেব্রিক রিফ্রেশার কিট',
    originalPrice: 480,
    bumpPrice: 290
  };

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setQuantity(product.quantity || 1);
        setSelectedSize(product.selectedSize || product.sizes?.[0] || '');
        setSelectedColor(product.selectedColor || product.colors?.[0]?.name || '');
        setHasOrderBump(false);
      }
      setOrderCompleteData(null);
      setErrorMsg('');

      if (!hasInitiatedCheckout.current && product) {
        hasInitiatedCheckout.current = true;
        trackInitiateCheckout(product, quantity, (product.price || 0) * quantity);
      }
    } else {
      hasInitiatedCheckout.current = false;
    }
  }, [isOpen, product]);

  const deliveryFee = deliveryArea === 'insideDhaka' 
    ? siteConfig.deliveryCharges.insideDhaka 
    : siteConfig.deliveryCharges.outsideDhaka;

  const itemTotal = (product?.price || 0) * quantity;
  const bumpPrice = hasOrderBump ? orderBumpItem.bumpPrice : 0;
  const grandTotal = itemTotal + bumpPrice + deliveryFee;

  // Real-Time Abandoned Lead Auto-Save (3-Second Debounce)
  useEffect(() => {
    if (!isOpen || !product) return;
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
        selectedSize: selectedSize || 'স্ট্যান্ডার্ড',
        selectedColor: selectedColor || 'স্ট্যান্ডার্ড',
        quantity,
        hasOrderBump,
        estimatedTotal: grandTotal,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        status: 'অসম্পূর্ণ (Abandoned Lead)',
        source: 'Quick Modal Checkout'
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
  }, [customerPhone, customerName, customerAddress, selectedSize, selectedColor, quantity, hasOrderBump, grandTotal, isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার পুরো নাম লিখুন');
      return;
    }

    const cleanPhone = sanitizeBDPhone(customerPhone);
    if (!isValidBDPhone(cleanPhone)) {
      setErrorMsg('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX বা 019XXXXXXXX)');
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 6) {
      setErrorMsg('অনুগ্রহ করে সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা/জেলা) লিখুন');
      return;
    }

    // 15-Minute Duplicate Order Prevention
    if (onCheckDuplicateOrder && onCheckDuplicateOrder(cleanPhone, product.id)) {
      setErrorMsg('⚠️ আপনার অর্ডারটি ইতিমধ্যে গ্রহণ করা হয়েছে! আমাদের প্রতিনিধি শীঘ্রই আপনাকে কল করবেন। (অতিরিক্ত অর্ডারের প্রয়োজন হলে হেল্পলাইনে কল করুন)');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const trackingNum = Math.floor(1000 + Math.random() * 9000);
      const invoiceId = `INV-2026-${trackingNum}`;
      
      const now = new Date();
      const formattedDate = now.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = now.toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const orderData = {
        orderId: invoiceId,
        product,
        quantity,
        selectedSize: selectedSize || 'স্ট্যান্ডার্ড',
        selectedColor: selectedColor || 'স্ট্যান্ডার্ড',
        hasOrderBump,
        orderBumpItem: hasOrderBump ? orderBumpItem : null,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        operator: getBDOperatorName(cleanPhone),
        customerAddress: customerAddress.trim(),
        deliveryArea: deliveryArea === 'insideDhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে',
        deliveryFee,
        grandTotal,
        date: formattedDate,
        time: formattedTime,
        statusStep: 1, // Step 1: অর্ডার গৃহীত হয়েছে
        status: 'অর্ডার গৃহীত হয়েছে (Order Placed)',
        courier: 'Steadfast Courier',
        consignmentId: `STF-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: Date.now()
      };

      setIsSubmitting(false);
      setOrderCompleteData(orderData);

      // Auto-Cleanup from Abandoned Leads
      if (onCleanupDraftLead) {
        onCleanupDraftLead(cleanPhone);
      }

      // Fire Meta & TikTok Pixel Purchase Event
      trackPurchase(orderData);

      if (onOrderSuccess) {
        onOrderSuccess(orderData);
      }
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm checkout-modal-backdrop">
      <div 
        className="w-full max-w-[540px] max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 relative border border-slate-100 checkout-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 modal-top-header">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-2xl">{orderCompleteData ? '🧾' : '⚡'}</span>
              <span>{orderCompleteData ? 'অর্ডার কনফার্মেশন ও ডিজিটাল ক্যাশ মেমো' : 'সহজ অর্ডার ফর্ম (Quick Cash on Delivery)'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {orderCompleteData 
                ? 'আপনার অর্ডার সফলভাবে সংরক্ষিত হয়েছে। ক্যাশ মেমোটি প্রিন্ট বা সেভ করুন।'
                : 'পণ্য হাতে পেয়ে চেক করে টাকা দিন। কোনো অগ্রিম পেমেন্ট লাগবে না।'}
            </p>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-lg transition-colors modal-close-circle"
            aria-label="বন্ধ করুন"
          >
            ✕
          </button>
        </div>

        {orderCompleteData ? (
          /* ============================================================ */
          /* PRINTABLE DIGITAL CASH MEMO / INVOICE VIEW                   */
          /* ============================================================ */
          <div className="space-y-4">
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-2xl shadow-md">
                ✓
              </div>
              <h4 className="font-extrabold text-emerald-950 text-lg">অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!</h4>
              <p className="text-xs text-emerald-700 mt-1">
                ধন্যবাদ! আমাদের কাস্টমার সাপোর্ট টিম থেকে শীঘ্রই ফোন করে অর্ডার কনফার্ম করা হবে।
              </p>
            </div>

            {/* Cash Memo Box */}
            <div id="printable-cash-memo" className="border-2 border-slate-900 rounded-xl p-4 bg-white space-y-4">
              
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h4 className="font-black text-xl text-slate-900">{siteConfig.brandName}</h4>
                  <p className="text-xs text-slate-500">{siteConfig.tagline}</p>
                  <p className="text-xs font-mono text-slate-600">হেল্পলাইন: {siteConfig.displayHelpline}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                    ক্যাশ মেমো (INVOICE)
                  </span>
                  <div className="text-sm font-black font-mono text-[#F85606] mt-1">
                    #{orderCompleteData.orderId}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    তারিখ: {orderCompleteData.date}
                  </div>
                </div>
              </div>

              {/* Customer Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">গ্রাহকের নাম:</span>
                  <strong className="text-slate-900">{orderCompleteData.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">মোবাইল নম্বর:</span>
                  <strong className="text-slate-900 font-mono">{orderCompleteData.customerPhone} ({orderCompleteData.operator})</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">ডেলিভারি ঠিকানা:</span>
                  <span className="text-slate-800">{orderCompleteData.customerAddress}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse memo-table">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100">
                    <th className="p-2 font-bold text-slate-700">পণ্য বিবরণ</th>
                    <th className="p-2 text-center font-bold text-slate-700">সাইজ/কালার</th>
                    <th className="p-2 text-center font-bold text-slate-700">পরিমাণ</th>
                    <th className="p-2 text-right font-bold text-slate-700">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-semibold text-slate-800">{orderCompleteData.product?.title}</td>
                    <td className="p-2 text-center text-slate-600">{orderCompleteData.selectedSize} / {orderCompleteData.selectedColor}</td>
                    <td className="p-2 text-center font-bold font-mono">x{orderCompleteData.quantity}</td>
                    <td className="p-2 text-right font-bold text-slate-900 font-mono">{siteConfig.currencySymbol}{orderCompleteData.product?.price * orderCompleteData.quantity}</td>
                  </tr>
                  {orderCompleteData.hasOrderBump && (
                    <tr className="bg-amber-50/60">
                      <td className="p-2 font-semibold text-amber-900" colSpan={3}>
                        🎁 স্পেশাল অ্যাড-অন: {orderCompleteData.orderBumpItem?.title}
                      </td>
                      <td className="p-2 text-right font-bold text-amber-900 font-mono">
                        +{siteConfig.currencySymbol}{orderCompleteData.orderBumpItem?.bumpPrice}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Summary Breakdown */}
              <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ ({orderCompleteData.deliveryArea}):</span>
                  <span className="font-mono font-bold text-slate-800">{siteConfig.currencySymbol}{orderCompleteData.deliveryFee}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>সর্বমোট প্রদেয় বিল:</span>
                  <span className="font-mono text-base text-[#F85606]">{siteConfig.currencySymbol}{orderCompleteData.grandTotal}</span>
                </div>
              </div>

              {/* Official Seal / Verification Stamp */}
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-300">
                <div className="text-[10px] text-slate-500">
                  * পণ্য রিসিভ করার সময় চেক করে মূল্য পরিশোধ করুন।
                </div>
                <div className="border border-emerald-600 text-emerald-700 px-2.5 py-1 rounded text-[11px] font-black uppercase font-mono tracking-wider rotate-[-2deg]">
                  ✓ ক্যাশ অন ডেলিভারি
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <span>🖨️ প্রিন্ট করুন</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenTracking) onOpenTracking();
                }}
                className="py-2.5 px-4 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <span>🔍 অর্ডার ট্র্যাক করুন</span>
              </button>
            </div>

          </div>
        ) : (
          /* ============================================================ */
          /* INTERACTIVE ORDER FORM                                       */
          /* ============================================================ */
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            
            {/* 1. Selected Product Card */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-white"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate">{product.title}</h4>
                <div className="text-xs font-mono font-bold text-[#F85606] mt-0.5">
                  {siteConfig.currencySymbol}{product.price}
                </div>
                {product.sizes && product.sizes.length > 0 && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    সাইজ: <span className="font-bold text-slate-800">{selectedSize || product.sizes[0]}</span>
                  </div>
                )}
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <span className="w-7 text-center font-bold text-xs font-mono">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 2. Clean Full-Width Form Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-sm text-[#1E293B] mb-1.5" htmlFor="checkout-name">
                  আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  placeholder="যেমন: মোঃ তানভীর আহমেদ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-3 border-[1.5px] border-[#CBD5E1] rounded-xl text-[15px] outline-none transition-all focus:border-[#F85606] focus:ring-4 focus:ring-orange-500/15"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-sm text-[#1E293B]" htmlFor="checkout-phone">
                    ১১ ডিজিটের মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  {customerPhone && (
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">
                      {isValidBDPhone(customerPhone) ? `✓ ${getBDOperatorName(customerPhone)}` : ''}
                    </span>
                  )}
                </div>
                <input
                  id="checkout-phone"
                  type="tel"
                  placeholder="যেমন: 01712345678 বা ০১৭১২৩৪৫৬৭৮"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(sanitizeBDPhone(e.target.value))}
                  maxLength={11}
                  className="w-full px-3.5 py-3 border-[1.5px] border-[#CBD5E1] rounded-xl text-[15px] font-mono outline-none transition-all focus:border-[#F85606] focus:ring-4 focus:ring-orange-500/15"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-sm text-[#1E293B] mb-1.5" htmlFor="checkout-address">
                  সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="checkout-address"
                  rows="2"
                  placeholder="বাসা নম্বর, রোড নম্বর, এলাকা, থানা ও জেলা উল্লেখ করুন..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3.5 py-3 border-[1.5px] border-[#CBD5E1] rounded-xl text-[15px] outline-none transition-all focus:border-[#F85606] focus:ring-4 focus:ring-orange-500/15 resize-none"
                  required
                />
              </div>
            </div>

            {/* 3. Interactive Delivery Area Cards */}
            <div>
              <label className="block font-semibold text-sm text-[#1E293B] mb-1.5">
                ডেলিভারি এরিয়া নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-2 gap-2.5 delivery-cards-grid">
                
                {/* Inside Dhaka */}
                <div
                  onClick={() => setDeliveryArea('insideDhaka')}
                  className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col justify-between ${
                    deliveryArea === 'insideDhaka'
                      ? 'border-[#F85606] bg-[#FFF7ED] shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={deliveryArea === 'insideDhaka' ? { border: '2px solid #F85606', background: '#FFF7ED' } : { border: '2px solid #E2E8F0', background: '#FFFFFF' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">ঢাকার ভেতরে</span>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      deliveryArea === 'insideDhaka' ? 'border-[#F85606] bg-[#F85606]' : 'border-slate-300'
                    }`}>
                      {deliveryArea === 'insideDhaka' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">সময়: ১-২ দিন</div>
                  <div className="text-sm font-extrabold text-[#F85606] font-mono mt-1.5">
                    {siteConfig.currencySymbol} {siteConfig.deliveryCharges.insideDhaka}
                  </div>
                </div>

                {/* Outside Dhaka */}
                <div
                  onClick={() => setDeliveryArea('outsideDhaka')}
                  className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col justify-between ${
                    deliveryArea === 'outsideDhaka'
                      ? 'border-[#F85606] bg-[#FFF7ED] shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={deliveryArea === 'outsideDhaka' ? { border: '2px solid #F85606', background: '#FFF7ED' } : { border: '2px solid #E2E8F0', background: '#FFFFFF' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">ঢাকার বাইরে</span>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      deliveryArea === 'outsideDhaka' ? 'border-[#F85606] bg-[#F85606]' : 'border-slate-300'
                    }`}>
                      {deliveryArea === 'outsideDhaka' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">সময়: ২-৪ দিন</div>
                  <div className="text-sm font-extrabold text-[#F85606] font-mono mt-1.5">
                    {siteConfig.currencySymbol} {siteConfig.deliveryCharges.outsideDhaka}
                  </div>
                </div>

              </div>
            </div>

            {/* 4. 1-Click Order Bump Checkbox */}
            <div 
              style={{ background: '#FEFCE8', border: '2px dashed #EAB308' }} 
              className="p-3 rounded-xl space-y-1.5"
            >
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOrderBump}
                  onChange={(e) => setHasOrderBump(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded mt-0.5 focus:ring-orange-500 cursor-pointer"
                />
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                    🎁 হ্যাঁ! সাথে আরও ১টি <strong className="text-orange-700">{orderBumpItem.title}</strong> মাত্র ৳{orderBumpItem.bumpPrice}-এ যোগ করতে চাই
                  </span>
                  <span className="text-[11px] text-emerald-800 font-bold block mt-0.5">
                    (কোনো অতিরিক্ত ডেলিভারি চার্জ লাগবে না!)
                  </span>
                </div>
              </label>
            </div>

            {/* 5. Order Bill Box & Summary */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl space-y-2 text-sm order-bill-summary">
              <div className="flex justify-between text-slate-600">
                <span>পণ্যের মূল্য ({quantity} টি):</span>
                <span className="font-bold font-mono text-slate-800">{siteConfig.currencySymbol} {itemTotal}</span>
              </div>

              {hasOrderBump && (
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>স্পেশাল অ্যাড-অন:</span>
                  <span className="font-bold font-mono">+{siteConfig.currencySymbol} {orderBumpItem.bumpPrice}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-bold font-mono text-slate-800">{siteConfig.currencySymbol} {deliveryFee}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-base">সর্বমোট প্রদেয় টাকা:</span>
                <strong className="text-xl font-black text-[#F85606] font-mono">
                  {siteConfig.currencySymbol} {grandTotal}
                </strong>
              </div>
            </div>

            {/* 6. Green Cash on Delivery Assurance Banner */}
            <div className="bg-[#DCFCE7] text-[#166534] p-2.5 rounded-lg text-xs font-semibold text-center border border-emerald-200 flex items-center justify-center gap-1.5">
              <span>🛡️</span>
              <span>১০০% ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে চেক করে টাকা দিন)</span>
            </div>

            {/* 7. Pulsing Confirm Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#F85606] to-[#EA580C] hover:from-[#e04410] hover:to-[#c2410c] text-white text-[17px] font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F85606, #EA580C)',
                color: 'white',
                fontSize: '17px',
                fontWeight: '700',
                padding: '15px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                marginTop: '12px',
                boxShadow: '0 8px 20px rgba(248, 86, 6, 0.35)'
              }}
            >
              {isSubmitting ? (
                <span>অর্ডার প্রসেস হচ্ছে...</span>
              ) : (
                <>
                  <span>🛒</span>
                  <span>অর্ডার নিশ্চিত করুন (Confirm Order - ৳{grandTotal})</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
