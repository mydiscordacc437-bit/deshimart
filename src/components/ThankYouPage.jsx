// src/components/ThankYouPage.jsx
/**
 * DeshiMart BD - Dedicated Thank You & Order Confirmation Page (/thank-you/:slug/:orderId)
 * 
 * Features:
 *   1. Strict Meta Purchase Pixel Deduplication via localStorage (pixel_fired_{orderId})
 *   2. Reassurance Hero with animated checkmark and customer care callback notice
 *   3. Digital Cash Memo / Invoice Card with print & download receipt action
 *   4. Direct WhatsApp Helpline button pre-filled with Order ID
 *   5. Live Order Tracking Modal launcher
 *   6. Post-Purchase VIP Upsell Offer (10-minute countdown, 1-click Free Delivery Add-on)
 */

import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import { trackPurchase } from '../utils/pixelManager';

export default function ThankYouPage({
  product,
  orderId,
  orders = [],
  allProducts = [],
  onAddUpsellToOrder,
  onOpenTracking,
  onBackToHome,
  showToast
}) {
  // Find order from state or localStorage
  const [currentOrder, setCurrentOrder] = useState(() => {
    const found = orders.find(o => o.orderId === orderId);
    if (found) return found;

    try {
      const savedOrders = JSON.parse(localStorage.getItem('deshimart_orders') || '[]');
      const inLocal = savedOrders.find(o => o.orderId === orderId);
      if (inLocal) return inLocal;
    } catch (e) {
      console.error(e);
    }

    // High-Converting Demo/Fallback Order if previewed directly from Admin
    const now = new Date();
    return {
      orderId: orderId || `INV-${now.getFullYear()}-8492`,
      customerName: 'সম্মানিত গ্রাহক (Admin Preview)',
      customerPhone: '01712345678',
      customerAddress: 'হাউজ ১২, রোড ৫, ধানমন্ডি, ঢাকা',
      deliveryArea: 'ঢাকার ভেতরে',
      deliveryFee: 70,
      product: product || allProducts[0],
      selectedSize: 'Standard',
      selectedColor: 'Standard',
      quantity: 1,
      hasOrderBump: false,
      grandTotal: (product?.price || 950) + 70,
      date: now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      statusStep: 1,
      status: 'অর্ডার গৃহীত হয়েছে (Order Placed)',
      courier: 'Steadfast Courier',
      consignmentId: `STF-${Math.floor(100000 + Math.random() * 900000)}`,
      upsellItems: []
    };
  });

  // Keep synced if orders update (e.g. when an upsell is added)
  useEffect(() => {
    const found = orders.find(o => o.orderId === orderId);
    if (found) {
      setCurrentOrder(found);
    }
  }, [orders, orderId]);

  // =========================================================================
  // 1. STRICT META PURCHASE PIXEL DEDUPLICATION
  // Checks localStorage('pixel_fired_{orderId}') so page refreshes or link shares
  // NEVER fire duplicate Purchase events in Facebook / Meta Ads Manager!
  // =========================================================================
  useEffect(() => {
    if (!currentOrder || !currentOrder.orderId) return;

    const storageKey = `pixel_fired_${currentOrder.orderId}`;
    const alreadyFired = localStorage.getItem(storageKey);

    if (!alreadyFired && !orderId?.includes('PREVIEW') && !orderId?.includes('SAMPLE')) {
      try {
        localStorage.setItem(storageKey, 'true');
        trackPurchase(currentOrder);
        console.log(`🎯 Meta Purchase Pixel fired deduplicated for Order: ${currentOrder.orderId}`);
      } catch (err) {
        console.warn('Pixel firing error:', err);
      }
    }
  }, [currentOrder, orderId]);

  // Set document title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `অর্ডার সফল #${orderId} - ধন্যবাদ | ${siteConfig.brandName}`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      document.title = originalTitle;
    };
  }, [orderId]);

  // 10-Minute VIP Upsell Countdown Timer
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes = 600s

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatCountdown = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Complementary VIP Upsell Products (excluding current product)
  const upsellCandidates = allProducts
    .filter(p => p.id !== product?.id && p.slug !== product?.slug)
    .slice(0, 3)
    .map(p => {
      const discountedPrice = Math.round((p.price || 850) * 0.78); // 22% VIP discount
      return {
        ...p,
        vipPrice: discountedPrice,
        savings: (p.price || 850) - discountedPrice
      };
    });

  // Handle adding a VIP upsell item directly to this order
  const handleAddUpsell = (upsellItem) => {
    if (onAddUpsellToOrder) {
      onAddUpsellToOrder(currentOrder.orderId, upsellItem);
    } else {
      // Local fallback updater
      setCurrentOrder(prev => {
        const existingUpsells = prev.upsellItems || [];
        const updatedUpsells = [...existingUpsells, upsellItem];
        const newTotal = prev.grandTotal + upsellItem.vipPrice;
        const updated = {
          ...prev,
          upsellItems: updatedUpsells,
          grandTotal: newTotal
        };
        try {
          const savedOrders = JSON.parse(localStorage.getItem('deshimart_orders') || '[]');
          const idx = savedOrders.findIndex(o => o.orderId === prev.orderId);
          if (idx >= 0) {
            savedOrders[idx] = updated;
            localStorage.setItem('deshimart_orders', JSON.stringify(savedOrders));
          }
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
    }

    if (showToast) {
      showToast(`🎉 "${upsellItem.title.slice(0, 20)}..." আপনার অর্ডারে যুক্ত হয়েছে (ফ্রি ডেলিভারি)!`);
    } else {
      alert(`"${upsellItem.title}" সফলভাবে আপনার পার্সেল এ যোগ করা হয়েছে!`);
    }
  };

  // WhatsApp Helpline link with pre-filled Order ID
  const cleanPhone = siteConfig.whatsappNumber ? siteConfig.whatsappNumber.replace(/[^0-9]/g, '') : '1700000000';
  const whatsappMsg = encodeURIComponent(
    `আসসালামু আলাইকুম! আমার অর্ডার আইডি: #${currentOrder?.orderId || orderId}\n` +
    `পণ্য: ${currentOrder?.product?.title || product?.title}\n\n` +
    `আমি আমার অর্ডারটি দ্রুত ডেলিভারি নিশ্চিত করতে / সাইজ পরিবর্তন করতে চাই। অনুগ্রহ করে সহায়তা করুন।`
  );
  const whatsappUrl = `https://wa.me/88${cleanPhone}?text=${whatsappMsg}`;

  // Handle browser print receipt
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="thank-you-page-wrapper bg-slate-50 min-h-screen text-slate-800 pb-16 font-sans">
      
      {/* 1. Minimal Funnel Header (Print Hidden) */}
      <header className="bg-white border-b border-orange-100 shadow-sm print:hidden sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              D
            </span>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 block leading-tight">
                {siteConfig.brandName}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                অর্ডার কনফার্মেশন ও ক্যাশ মেমো
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>💬 হেল্পলাইন</span>
            </a>
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              🏠 শপে ফিরুন
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8 space-y-6">

        {/* 2. Success Hero Banner with Animated Checkmark (Print Hidden) */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 text-center shadow-sm relative overflow-hidden print:hidden">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner ring-8 ring-emerald-50 animate-bounce">
            ✓
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 leading-snug">
            🎉 ধন্যবাদ <span className="text-orange-600">{currentOrder?.customerName || 'সম্মানিত গ্রাহক'}</span>!
            <br />আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে।
          </h1>

          <div className="max-w-xl mx-auto mt-3 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-xs sm:text-sm text-emerald-900 leading-relaxed">
            <span className="font-bold block text-emerald-800">
              📞 কাস্টমার কেয়ার কল নোটিফিকেশন:
            </span>
            আমাদের প্রতিনিধি শীঘ্রই আপনার <strong>{currentOrder?.customerPhone}</strong> নাম্বারে কল করে অর্ডারটি ভেরিফাই করবেন। অনুগ্রহ করে ফোনটি রিসিভ করার জন্য সচল রাখুন।
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 font-mono">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              ইনভয়েস: <strong className="text-slate-800 font-bold">{currentOrder?.orderId}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              তারিখ: <strong className="text-slate-800">{currentOrder?.date}</strong> ({currentOrder?.time})
            </span>
          </div>
        </div>

        {/* 3. Official Digital Cash Memo / Invoice Card (Print-Optimized) */}
        <div id="printable-invoice" className="bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-7 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
          
          {/* Invoice Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-orange-600 text-white font-black flex items-center justify-center text-sm">
                  D
                </span>
                <span className="font-black text-base sm:text-lg text-slate-900">
                  {siteConfig.brandName}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                অফিসিয়াল ক্যাশ মেমো ও পার্সেল চালান
              </span>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold block mb-1">
                ক্যাশ অন ডেলিভারি (COD)
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 block">
                #{currentOrder?.orderId}
              </span>
            </div>
          </div>

          {/* Customer & Logistics Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">গ্রাহকের ডেলিভারি তথ্য:</span>
              <strong className="text-sm text-slate-900 block">{currentOrder?.customerName}</strong>
              <div className="text-slate-700 font-mono">📞 {currentOrder?.customerPhone}</div>
              <div className="text-slate-600 leading-relaxed mt-1">📍 {currentOrder?.customerAddress}</div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">শিপিং ও কুরিয়ার তথ্য:</span>
              <div className="text-slate-700 font-bold">
                কুরিয়ার: <span className="text-orange-600">{currentOrder?.courier || 'Steadfast Courier'}</span>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                কনসাইনমেন্ট আইডি: <strong>{currentOrder?.consignmentId || 'STF-849201'}</strong>
              </div>
              <div className="text-slate-600">
                ডেলিভারি এলাকা: <strong>{currentOrder?.deliveryArea || 'ঢাকার ভেতরে'}</strong>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                  ⚡ অর্ডার গৃহীত হয়েছে (প্যাকিং চলছে)
                </span>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
              অর্ডারের বিবরণ:
            </span>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">আইটেম</th>
                    <th className="p-3 text-center">পরিমাণ</th>
                    <th className="p-3 text-right">মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  
                  {/* Primary Product */}
                  <tr>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {currentOrder?.product?.image && (
                          <img 
                            src={currentOrder.product.image} 
                            alt="" 
                            className="w-10 h-10 object-cover rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0"
                          />
                        )}
                        <div>
                          <strong className="text-slate-900 block line-clamp-1">{currentOrder?.product?.title}</strong>
                          <span className="text-[11px] text-slate-500">
                            সাইজ: {currentOrder?.selectedSize} | কালার: {currentOrder?.selectedColor}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      {currentOrder?.quantity || 1}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ৳{(currentOrder?.product?.price || 0) * (currentOrder?.quantity || 1)}
                    </td>
                  </tr>

                  {/* Order Bump Item (if checked) */}
                  {currentOrder?.hasOrderBump && currentOrder?.orderBumpItem && (
                    <tr className="bg-amber-50/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 text-base">🎁</span>
                          <div>
                            <strong className="text-slate-900 text-xs block">{currentOrder.orderBumpItem.title}</strong>
                            <span className="text-[10px] text-amber-700 font-semibold">অর্ডার বাম্প স্পেশাল অ্যাড-অন (ফ্রি ডেলিভারি)</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">1</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-800">
                        ৳{currentOrder.orderBumpItem.bumpPrice || 290}
                      </td>
                    </tr>
                  )}

                  {/* VIP Post-Purchase Upsell Items */}
                  {currentOrder?.upsellItems && currentOrder.upsellItems.map((u, idx) => (
                    <tr key={idx} className="bg-emerald-50/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600 text-base">🔥</span>
                          <div>
                            <strong className="text-slate-900 text-xs block">{u.title}</strong>
                            <span className="text-[10px] text-emerald-700 font-semibold">ভিআইপি পার্সেল অ্যাড-অন (ফ্রি ডেলিভারি সুবিধা)</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">1</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-800">
                        ৳{u.vipPrice}
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="border-t-2 border-slate-100 pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>পণ্য ও অ্যাড-অন সাবটোটাল:</span>
              <span className="font-mono font-bold">
                ৳{(currentOrder?.grandTotal || 0) - (currentOrder?.deliveryFee || 70)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ডেলিভারি চার্জ ({currentOrder?.deliveryArea}):</span>
              <span className="font-mono font-bold">৳{currentOrder?.deliveryFee || 70}</span>
            </div>
            
            {/* Grand Total Highlight */}
            <div className="flex justify-between items-center text-sm sm:text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>সর্বমোট প্রদেয় টাকা (COD):</span>
              <span className="text-lg sm:text-xl font-mono text-orange-600 font-black">
                ৳{currentOrder?.grandTotal}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block text-right pt-0.5">
              ✓ পণ্য হাতে পেয়ে দেখে ডেলিভারি ম্যানকে এই টাকা পরিশোধ করবেন
            </span>
          </div>

          {/* Invoice Footer Seal */}
          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>কাস্টমার সাপোর্ট: {siteConfig.displayHelpline} • {siteConfig.brandName}</span>
            <span className="font-mono text-slate-500">Official Computerized Cash Memo</span>
          </div>

        </div>

        {/* 4. Action Buttons (Print Hidden) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
          
          {/* Download / Print Receipt */}
          <button
            type="button"
            onClick={handlePrint}
            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow flex items-center justify-center gap-1.5"
          >
            <span>📥 ক্যাশ মেমো ডাউনলোড / প্রিন্ট</span>
          </button>

          {/* Live Order Tracker */}
          <button
            type="button"
            onClick={onOpenTracking}
            className="py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow flex items-center justify-center gap-1.5"
          >
            <span>📦 অর্ডার ট্র্যাক করুন</span>
          </button>

          {/* Urgent WhatsApp Support */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm text-center transition-all shadow flex items-center justify-center gap-1.5"
          >
            <span>💬 জরুরি প্রয়োজনে WhatsApp</span>
          </a>

        </div>

        {/* ================================================================ */}
        {/* 5. POST-PURCHASE VIP UPSELL OFFER (BONUS PROFIT MAKER)           */}
        {/* ================================================================ */}
        <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-gradient-to-b from-amber-50 to-orange-50/40 p-5 sm:p-6 shadow-sm space-y-4 print:hidden">
          
          {/* Upsell Header with Live 10-Minute Countdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                EXCLUSIVE VIP DEAL
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                🔥 এই পার্সেলের সাথেই আরও ১টি পণ্য নিন (জিরো ডেলিভারি চার্জ)!
              </h3>
              <p className="text-xs text-slate-600">
                আপনার বর্তমান অর্ডার #{currentOrder?.orderId}-এর সাথে নিচের যেকোনো পণ্য যোগ করুন — এক্সট্রা কোনো ডেলিভারি চার্জ লাগবে না!
              </p>
            </div>

            {/* Live Countdown Badge */}
            <div className="flex-shrink-0 text-center px-3 py-1.5 rounded-xl bg-slate-900 text-white border border-slate-700">
              <span className="text-[10px] text-amber-400 block font-bold">অফার শেষ হতে বাকি:</span>
              <span className="font-mono font-black text-base text-white tracking-widest">
                {formatCountdown(secondsLeft)}
              </span>
            </div>
          </div>

          {/* Upsell Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upsellCandidates.map((item) => {
              const alreadyAdded = currentOrder?.upsellItems?.some(u => u.id === item.id);

              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-xl border border-amber-200 p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow space-y-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={item.image} 
                      alt="" 
                      className="w-14 h-14 object-cover rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <strong className="text-xs text-slate-900 line-clamp-2 leading-tight">
                        {item.title}
                      </strong>
                      <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                        <span className="font-black text-sm text-orange-600">৳{item.vipPrice}</span>
                        <del className="text-[10px] text-slate-400">৳{item.price}</del>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        ৳{item.savings} ছাড় + ফ্রি ডেলিভারি!
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => handleAddUpsell(item)}
                    className={`w-full py-2 px-3 rounded-lg font-extrabold text-xs transition-all cursor-pointer shadow flex items-center justify-center gap-1 ${
                      alreadyAdded 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                    }`}
                  >
                    <span>{alreadyAdded ? '✓ পার্সেল এ যুক্ত হয়েছে' : `➕ পার্সেল এ যোগ করুন (+৳${item.vipPrice})`}</span>
                  </button>
                </div>
              );
            })}
          </div>

        </div>

      </main>

    </div>
  );
}
