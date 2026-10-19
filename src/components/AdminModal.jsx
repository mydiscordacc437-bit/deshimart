// src/components/AdminModal.jsx
/**
 * DeshiMart BD - Store Manager, B-Bazar Live Importer, Meta Pixel & Abandoned Leads Hub
 * 
 * Features:
 *   1. Orders & Logistics Management (Live Status, Steadfast Consignment, Fraud Shield & Courier Lookup)
 *   2. Real-Time Abandoned Checkout / Lead Capture (Recover via WhatsApp, Convert to Order)
 *   3. Meta (Facebook) & TikTok Pixel Tracking Settings & Event Debugger Toast
 *   4. B-Bazar Live Importer (Paste any B-Bazar URL or item ID to fetch and import)
 *   5. Global Profit Markup Config (Fixed BDT or Percentage markup)
 *   6. Products & Facebook Ad Links Hub (Shows Wholesale Base Cost, Profit, "Copy Ad Link")
 */

import React, { useState, useRef, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import { ORDER_STEPS } from '../config/orderSteps';
import { sanitizeBDPhone, getBDOperatorName } from '../utils/phoneSanitizer';
import { getPixelConfig, savePixelConfig, firePixelEvent } from '../utils/pixelManager';

export default function AdminModal({ 
  isOpen, 
  onClose, 
  orders, 
  onUpdateOrderStatus, 
  onUpdateCourierInfo,
  socialProofEnabled, 
  onToggleSocialProof,
  allProducts = [],
  onUpdateProducts,
  onNavigateToProduct,
  showToast,
  abandonedLeads = [],
  onConvertLeadToOrder,
  onDeleteLead,
  pixelConfig,
  onUpdatePixelConfig
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'leads', 'marketing', 'importer', 'products'

  // B-Bazar Importer State
  const [bbazarInputUrl, setBbazarInputUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({ message: '', type: '' });

  // Global Markup State
  const [markupType, setMarkupType] = useState('fixed'); // 'fixed' or 'percent'
  const [markupValue, setMarkupValue] = useState(150); // e.g. 150 Tk or 15%

  // Product search filter in Admin
  const [productSearch, setProductSearch] = useState('');

  // Abandoned leads filter
  const [leadSearch, setLeadSearch] = useState('');

  // Pixel Settings Form State
  const [pixelForm, setPixelForm] = useState(() => pixelConfig || getPixelConfig());

  useEffect(() => {
    if (pixelConfig) {
      setPixelForm(pixelConfig);
    }
  }, [pixelConfig]);


  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const deliveredCount = orders.filter(o => o.statusStep === 5).length;

  // Extract ID from any B-Bazar URL or text input
  // e.g. https://bbazar.com.bd/product/some-slug/item-11764 or 11764
  const extractBbazarId = (input) => {
    const trimmed = input.trim();
    const itemMatch = trimmed.match(/item-(\d+)/i);
    if (itemMatch) return itemMatch[1];
    const numMatch = trimmed.match(/(\d{3,6})/);
    if (numMatch) return numMatch[1];
    return null;
  };

  // Helper to sanitize B-Bazar image URL
  const sanitizeBbazarImg = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';
    if (url.startsWith('http')) return url;
    const clean = url.replace(/^\/+/, '');
    return `https://bbazar.com.bd/${clean}`;
  };

  // Fetch & Import live product directly from B-Bazar API
  const handleImportBbazarProduct = async (e) => {
    e.preventDefault();
    setImportStatus({ message: '', type: '' });

    const productId = extractBbazarId(bbazarInputUrl);
    if (!productId) {
      setImportStatus({
        message: 'ত্রুটি: সঠিক B-Bazar প্রোডাক্ট URL বা প্রোডাক্ট আইডি দিন (যেমন: item-11764 বা 11764)',
        type: 'error'
      });
      return;
    }

    setIsImporting(true);

    try {
      const apiUrl = `https://bbazar.com.bd/api/v3/products/${productId}/data`;
      const res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`B-Bazar সার্ভার থেকে রেসপন্স আসেনি (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data || !data.name) {
        throw new Error('পণ্যটির তথ্য পাওয়া যায়নি। অনুগ্রহ করে আইডি যাচাই করুন।');
      }

      const mainImage = sanitizeBbazarImg(data.image);
      const gallery = [mainImage];
      if (data.gallery_1) gallery.push(sanitizeBbazarImg(data.gallery_1));
      if (data.gallery_2) gallery.push(sanitizeBbazarImg(data.gallery_2));
      if (data.gallery_3) gallery.push(sanitizeBbazarImg(data.gallery_3));

      const basePrice = Number(data.sale_price || 650);
      const wholesalePrice = Number(data.reseller_price || Math.round(basePrice * 0.82));
      
      // Calculate selling price with current markup
      let sellingPrice = basePrice;
      if (markupType === 'fixed') {
        sellingPrice = basePrice + Number(markupValue || 0);
      } else {
        sellingPrice = Math.round(basePrice * (1 + Number(markupValue || 0) / 100));
      }

      const regularPrice = Number(data.regular_price || Math.round(sellingPrice * 1.3));
      const discountPercent = regularPrice > sellingPrice 
        ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100) 
        : 25;

      // Clean specs
      const cleanSpecs = [];
      if (data.description) {
        const textLines = data.description
          .replace(/<[^>]+>/g, '\n')
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 5 && !l.includes('B-Bazar') && !l.includes('bbazar'));

        for (const line of textLines) {
          if (line.includes(':')) {
            const [k, ...v] = line.split(':');
            cleanSpecs.push({ key: k.trim(), value: v.join(':').trim() });
          } else {
            cleanSpecs.push({ key: `বৈশিষ্ট্য ${cleanSpecs.length + 1}`, value: line });
          }
          if (cleanSpecs.length >= 6) break;
        }
      }

      const asciiSlug = data.name.toLowerCase().replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const slug = `${asciiSlug.slice(0, 40)}-bbz${data.id}`;

      const newProduct = {
        id: `bbz-${data.id}`,
        bbazarId: data.id,
        sku: `BBZ-${data.id}`,
        sourceUrl: `https://bbazar.com.bd/product/${data.slug}/item-${data.id}`,
        title: data.name,
        slug: slug,
        image: mainImage,
        gallery: gallery,
        category: "gadgets",
        categoryName: data.category_title || "গ্যাজেট ও ইলেকট্রনিক্স",
        subCategory: data.sub_category_title || "General",
        basePrice: basePrice,
        wholesalePrice: wholesalePrice,
        sellingPrice: sellingPrice,
        price: sellingPrice,
        regularPrice: regularPrice,
        originalPrice: regularPrice,
        discountPercent: discountPercent,
        inStock: true,
        stockLeft: Number(data.quantity || 20),
        description: data.description ? data.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : data.name,
        specs: cleanSpecs.length > 0 ? cleanSpecs : [
          { key: "ব্র্যান্ড কোয়ালিটি", value: "প্রিমিয়াম গ্রেড এক্সক্লুসিভ" },
          { key: "ওয়ারেন্টি", value: "১০০% অরিজিনাল টেস্টেড পণ্য" }
        ],
        sizes: ["Standard"],
        colors: [{ name: "Standard (কালো)", hex: "#0f172a" }],
        rating: 4.9,
        reviewsCount: 78,
        isPopular: true
      };

      if (onUpdateProducts) {
        onUpdateProducts(newProduct);
      }

      setImportStatus({
        message: `✅ সফলভাবে ইমপোর্ট সম্পন্ন হয়েছে: "${newProduct.title.slice(0, 30)}..." (বিক্রয় মূল্য: ৳${sellingPrice}, সাপ্লায়ার রেট: ৳${basePrice})`,
        type: 'success'
      });
      setBbazarInputUrl('');

      if (showToast) {
        showToast(`B-Bazar পণ্য #${data.id} সফলভাবে স্টোরে যোগ হয়েছে!`);
      }

    } catch (err) {
      console.error(err);
      setImportStatus({
        message: `ইমপোর্ট ব্যর্থ হয়েছে: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Apply Global Markup to All Products
  const handleApplyGlobalMarkup = () => {
    if (!allProducts || allProducts.length === 0) return;

    const updated = allProducts.map(p => {
      const base = Number(p.basePrice || p.price);
      let newSelling = base;
      if (markupType === 'fixed') {
        newSelling = base + Number(markupValue || 0);
      } else {
        newSelling = Math.round(base * (1 + Number(markupValue || 0) / 100));
      }
      return {
        ...p,
        sellingPrice: newSelling,
        price: newSelling
      };
    });

    if (onUpdateProducts) {
      onUpdateProducts(updated, true); // true = batch replace
    }

    if (showToast) {
      showToast(`সকল পণ্যে ${markupType === 'fixed' ? `+৳${markupValue}` : `+${markupValue}%`} মার্জিন সফলভাবে যুক্ত হয়েছে!`);
    }
  };

  // Copy Facebook Ad Funnel Link to Clipboard (/offer/:slug)
  const handleCopyAdLink = (product) => {
    const origin = window.location.origin;
    const adUrl = `${origin}/offer/${product.slug || product.id}`;
    
    navigator.clipboard.writeText(adUrl).then(() => {
      if (showToast) {
        showToast(`🔗 ফেসবুক অ্যাড ল্যান্ডিং পেজ লিংক কপি হয়েছে:\n${adUrl}`);
      } else {
        alert(`ফেসবুক অ্যাড লিংক কপি হয়েছে:\n${adUrl}`);
      }
    }).catch(() => {
      prompt('কপি করতে Ctrl+C চাপুন:', adUrl);
    });
  };

  // Copy Direct Checkout URL (/checkout/:slug)
  const handleCopyCheckoutLink = (product) => {
    const origin = window.location.origin;
    const checkoutUrl = `${origin}/checkout/${product.slug || product.id}`;
    
    navigator.clipboard.writeText(checkoutUrl).then(() => {
      if (showToast) {
        showToast(`🛒 ডিরেক্ট চেকআউট লিংক কপি হয়েছে:\n${checkoutUrl}`);
      } else {
        alert(`ডিরেক্ট চেকআউট লিংক কপি হয়েছে:\n${checkoutUrl}`);
      }
    }).catch(() => {
      prompt('কপি করতে Ctrl+C চাপুন:', checkoutUrl);
    });
  };

  // Preview / Open Thank You Page URL (/thank-you/:slug/INV-PREVIEW-8492)
  const handlePreviewThankYou = (product) => {
    const origin = window.location.origin;
    const thankYouUrl = `${origin}/thank-you/${product.slug || product.id}/PREVIEW-INV-8492`;
    
    window.open(thankYouUrl, '_blank');
    if (showToast) {
      showToast(`✅ থ্যাংক ইউ পেজ প্রিভিউ ওপেন করা হয়েছে!`);
    }
  };

  // Save Pixel Configuration
  const handleSavePixelSettings = (e) => {
    e.preventDefault();
    savePixelConfig(pixelForm);
    if (onUpdatePixelConfig) {
      onUpdatePixelConfig(pixelForm);
    }
    if (showToast) {
      showToast('🎯 পিক্সেল সেটিংস সফলভাবে সেভ করা হয়েছে!');
    }
  };

  // Test Pixel Event Trigger
  const handleTestPixelEvent = () => {
    firePixelEvent('ViewContent', {
      content_name: 'টেস্ট প্রিমিয়াম পাঞ্জাবি (Demo Test)',
      content_ids: ['test-demo-101'],
      content_type: 'product',
      value: 850,
      currency: 'BDT'
    });
    if (showToast) {
      showToast('🎯 টেস্ট পিক্সেল ইভেন্ট ফায়ার করা হয়েছে! নিচে বামে সবুজ ডিবাগ টোস্ট দেখুন।');
    }
  };

  // Check Courier Ratio via Steadfast/Pathao lookup
  const handleCheckCourierRatio = (phone) => {
    const clean = sanitizeBDPhone(phone);
    navigator.clipboard.writeText(clean).then(() => {
      if (showToast) {
        showToast(`📋 ${clean} কপি হয়েছে! Steadfast কুরিয়ারে ডেলিভারি হিস্ট্রি চেক করুন।`, 'info');
      }
    }).catch(() => {});
    window.open('https://steadfast.com.bd/', '_blank');
  };

  // Recover Abandoned Lead via WhatsApp with polite Bangla message
  const handleRecoverLeadWhatsApp = (lead) => {
    const cleanPhone = sanitizeBDPhone(lead.customerPhone);
    const message = encodeURIComponent(
      `আসসালামু আলাইকুম ${lead.customerName || ''} ভাই/আপু, আমাদের ওয়েবসাইটে ${lead.product?.title || 'পণ্য'} অর্ডার করার চেষ্টা করেছিলেন। অর্ডারটি কি কনফার্ম করে ডেলিভারিতে পাঠিয়ে দিবো?`
    );
    window.open(`https://wa.me/88${cleanPhone}?text=${message}`, '_blank');
  };

  // Convert Abandoned Lead to Confirmed Order
  const handleConvertLead = (lead) => {
    if (window.confirm(`আপনি কি "${lead.customerName || 'গ্রাহক'}" (${lead.customerPhone}) এর জন্য অর্ডারটি কনফার্ম করতে চান?`)) {
      if (onConvertLeadToOrder) {
        onConvertLeadToOrder(lead);
      }
    }
  };

  // Filter products in Admin products list
  const filteredProducts = allProducts.filter(p => {
    if (!productSearch) return true;
    const term = productSearch.toLowerCase();
    return p.title?.toLowerCase().includes(term) || 
           p.sku?.toLowerCase().includes(term) ||
           p.slug?.toLowerCase().includes(term);
  });

  // Filter abandoned leads
  const filteredLeads = abandonedLeads.filter(l => {
    if (!leadSearch) return true;
    const term = leadSearch.toLowerCase();
    return l.customerName?.toLowerCase().includes(term) ||
           l.customerPhone?.includes(term) ||
           l.product?.title?.toLowerCase().includes(term);
  });

  return (
    <dialog ref={dialogRef} className="admin-dialog" onClose={onClose}>
      <div className="admin-dialog-content max-w-6xl w-full p-4 sm:p-6 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-orange-600 text-white font-mono font-black text-xs uppercase tracking-wider">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                B-Bazar Sync & Ad Engine Connected
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1">
              🛠️ {siteConfig.brandName} - স্টোর অ্যাডমিন, পিক্সেল ও লিড ট্র্যাকিং
            </h2>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-base cursor-pointer transition-colors"
            onClick={onClose} 
            aria-label="বন্ধ করুন"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-4 mt-4 overflow-x-auto text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 font-bold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📝 অর্ডার ও কুরিয়ার</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-orange-400 text-xs font-mono">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3 font-bold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'leads'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🛒 অসম্পূর্ণ অর্ডার (Leads)</span>
            {abandonedLeads.length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold animate-pulse">
                {abandonedLeads.length}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`pb-3 font-bold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'marketing'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎯 পিক্সেল ও মার্কেটিং</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-bold">
              Meta
            </span>
          </button>

          <button
            onClick={() => setActiveTab('importer')}
            className={`pb-3 font-bold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'importer'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🔗 B-Bazar ইমপোর্টার ও প্রফিট</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 text-xs">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 font-bold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📦 প্রডাক্ট ও অ্যাড লিংক</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {allProducts.length}
            </span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ORDERS & COURIER LOGISTICS                            */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="mt-4 space-y-4">
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-slate-400 block text-xs">মোট অর্ডার:</span>
                <strong className="text-lg font-black text-white font-mono">{orders.length} টি</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-slate-400 block text-xs">সর্বমোট সেলস (COD):</span>
                <strong className="text-lg font-black text-orange-400 font-mono">৳{totalRevenue}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-slate-400 block text-xs">ডেলিভারি সম্পন্ন:</span>
                <strong className="text-lg font-black text-emerald-400 font-mono">{deliveredCount} টি</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-xs">সোশ্যাল প্রুফ:</span>
                  <span className="text-xs font-bold text-white">{socialProofEnabled ? 'ON' : 'OFF'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSocialProof(!socialProofEnabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    socialProofEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {socialProofEnabled ? 'চালু' : 'বন্ধ'}
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/60 max-h-[480px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 uppercase font-mono text-[11px] sticky top-0 z-10">
                  <tr>
                    <th className="p-3">অর্ডার আইডি ও তারিখ</th>
                    <th className="p-3">গ্রাহকের তথ্য</th>
                    <th className="p-3">পণ্য ও ভ্যারিয়েন্ট</th>
                    <th className="p-3">মোট টাকা</th>
                    <th className="p-3">কুরিয়ার তথ্য</th>
                    <th className="p-3">লাইভ স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {orders.map((order) => {
                    const currentStep = order.statusStep || 1;
                    const cleanPhone = sanitizeBDPhone(order.customerPhone);
                    const operator = order.operator || getBDOperatorName(cleanPhone);
                    const phoneCountToday = orders.filter(o => sanitizeBDPhone(o.customerPhone) === cleanPhone).length;
                    const isHighRiskDuplicate = phoneCountToday > 1;

                    return (
                      <tr key={order.orderId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono">
                          <strong className="text-orange-400 block font-bold">{order.orderId}</strong>
                          <span className="text-slate-500 text-[11px]">{order.date || 'আজ'}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-white block">{order.customerName}</strong>
                            {operator && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                                {operator}
                              </span>
                            )}
                            {isHighRiskDuplicate && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-900/80 text-rose-300 border border-rose-700 animate-pulse" title="একই ফোন নম্বর দিয়ে আজ একাধিক অর্ডার করা হয়েছে">
                                ⚠️ একাধিক অর্ডার আজ ({phoneCountToday}টি)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-400 font-mono">📞 {order.customerPhone}</span>
                            <button
                              type="button"
                              onClick={() => handleCheckCourierRatio(order.customerPhone)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                              title="নম্বরটি কপি করে Steadfast/Pathao কুরিয়ারে ডেলিভারি হিস্ট্রি চেক করুন"
                            >
                              <span>🔍 Check Courier Ratio</span>
                            </button>
                          </div>

                          <span className="text-slate-500 text-[11px] line-clamp-1 mt-0.5" title={order.customerAddress}>
                            📍 {order.customerAddress}
                          </span>
                          {order.source && (
                            <span className="text-[10px] text-slate-500 block">
                              উৎস: {order.source}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {order.product?.image && (
                              <img src={order.product.image} alt="" className="w-10 h-10 object-cover rounded bg-slate-800" />
                            )}
                            <div>
                              <strong className="text-white line-clamp-1 text-xs">{order.product?.title}</strong>
                              <div className="text-[11px] text-slate-400">
                                {order.selectedSize && <span>{order.selectedSize} | </span>}
                                {order.selectedColor && <span>{order.selectedColor} | </span>}
                                <span className="font-mono text-orange-400">x{order.quantity || 1}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                          ৳{order.grandTotal}
                          <span className="block text-[10px] text-slate-400 font-normal">{order.deliveryArea}</span>
                        </td>
                        <td className="p-3">
                          <select
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"
                            value={order.courier || 'Steadfast Courier'}
                            onChange={(e) => onUpdateCourierInfo(order.orderId, e.target.value, order.consignmentId)}
                          >
                            <option value="Steadfast Courier">Steadfast Courier</option>
                            <option value="Pathao Courier">Pathao</option>
                            <option value="RedX Logistics">RedX</option>
                          </select>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">ID: {order.consignmentId || 'STF-84912'}</span>
                        </td>
                        <td className="p-3">
                          <select
                            className={`px-2 py-1 rounded text-xs font-bold text-white outline-none cursor-pointer ${
                              currentStep === 5 ? 'bg-emerald-600' :
                              currentStep === 4 ? 'bg-indigo-600' :
                              currentStep === 3 ? 'bg-sky-600' :
                              currentStep === 2 ? 'bg-amber-600' : 'bg-slate-700'
                            }`}
                            value={currentStep}
                            onChange={(e) => onUpdateOrderStatus(order.orderId, Number(e.target.value))}
                          >
                            {ORDER_STEPS.map((s) => (
                              <option key={s.step} value={s.step} className="bg-slate-900 text-white">
                                {s.icon} {s.label}
                              </option>
                            ))}
                          </select>
                          <span className="block text-[10px] text-emerald-400 mt-0.5">⚡ ট্র্যাকার পেজে লাইভ</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: ABANDONED CHECKOUT / LEAD CAPTURE                       */}
        {/* ============================================================ */}
        {activeTab === 'leads' && (
          <div className="mt-4 space-y-4">
            
            {/* Abandoned Leads Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-slate-400 block text-xs">মোট অসম্পূর্ণ ড্রাফট লিড:</span>
                <strong className="text-lg font-black text-amber-400 font-mono">{abandonedLeads.length} টি</strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">চেকআউট ফর্ম স্পর্শ করে ড্রপ করেছে</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-slate-400 block text-xs">সম্ভাব্য রিকভারি অ্যামাউন্ট:</span>
                <strong className="text-lg font-black text-emerald-400 font-mono">
                  ৳{abandonedLeads.reduce((sum, l) => sum + (l.estimatedTotal || 0), 0)}
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">সফল রিকভারিতে সরাসরি প্রফিট</span>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-800/80 border border-amber-600/40 flex flex-col justify-center">
                <span className="text-amber-300 font-bold text-xs flex items-center gap-1">
                  💡 প্রো টিপ (BD Conversion Hack):
                </span>
                <span className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  গ্রাহক ড্রপ করার ৩-১০ মিনিটের মধ্যে WhatsApp-এ কল বা মেসেজ দিলে ৬০-৭০% লিড দ্রুত কনফার্ম অর্ডারে রূপান্তর করা সম্ভব!
                </span>
              </div>
            </div>

            {/* Search Filter */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="লিড খুঁজুন (নাম, মোবাইল নম্বর বা পণ্য)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-orange-500"
                />
              </div>
              <span className="text-xs text-slate-400">
                প্রদর্শিত লিড: <strong className="text-white font-mono">{filteredLeads.length}</strong> টি
              </span>
            </div>

            {/* Leads Table */}
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                <span className="text-4xl block mb-2">🎉</span>
                <h4 className="text-base font-bold text-white">বর্তমানে কোনো অসম্পূর্ণ অর্ডার নেই!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  গ্রাহকরা সফলভাবে চেকআউট সম্পন্ন করছেন। কোনো গ্রাহক ১১ ডিজিট মোবাইল নম্বর লিখে ফর্ম বন্ধ করলে তা স্বয়ংক্রিয়ভাবে এখানে ৩ সেকেন্ডের মধ্যে যুক্ত হবে।
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/60 max-h-[480px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 uppercase font-mono text-[11px] sticky top-0 z-10">
                    <tr>
                      <th className="p-3">তারিখ ও সময়</th>
                      <th className="p-3">গ্রাহকের তথ্য ও অপারেটর</th>
                      <th className="p-3">আগ্রহী পণ্য ও ভ্যারিয়েন্ট</th>
                      <th className="p-3">সম্ভাব্য বিল</th>
                      <th className="p-3 text-right">রিকভারি অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredLeads.map((lead) => {
                      const cleanPhone = sanitizeBDPhone(lead.customerPhone);
                      const operator = lead.operator || getBDOperatorName(cleanPhone);
                      return (
                        <tr key={lead.leadId || lead.customerPhone} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono">
                            <span className="text-amber-400 block font-bold text-[11px]">{lead.time || 'এখনই'}</span>
                            <span className="text-slate-500 text-[10px]">{lead.date || 'আজ'}</span>
                            <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px]">
                              {lead.source || 'Ad Funnel'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-white block">{lead.customerName || 'অসম্পূর্ণ নাম'}</strong>
                              {operator && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                                  {operator}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-300 font-mono block text-xs mt-0.5">📞 {lead.customerPhone}</span>
                            <span className="text-slate-500 text-[11px] line-clamp-1 mt-0.5" title={lead.customerAddress}>
                              📍 {lead.customerAddress || 'ঠিকানা লিখেনি'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {lead.product?.image && (
                                <img src={lead.product.image} alt="" className="w-10 h-10 object-cover rounded bg-slate-800" />
                              )}
                              <div>
                                <strong className="text-white line-clamp-1 text-xs">{lead.product?.title || 'পণ্য'}</strong>
                                <div className="text-[11px] text-slate-400">
                                  {lead.selectedSize && <span>{lead.selectedSize} | </span>}
                                  {lead.selectedColor && <span>{lead.selectedColor} | </span>}
                                  <span className="font-mono text-orange-400">x{lead.quantity || 1}</span>
                                </div>
                                {lead.hasOrderBump && (
                                  <span className="text-[10px] text-amber-300 font-semibold block">
                                    + 🎁 অর্ডার বাম্প সিলেক্টেড
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            ৳{lead.estimatedTotal || lead.product?.price || 0}
                            <span className="block text-[10px] text-slate-400 font-normal">সম্ভাব্য মূল্য</span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* 1-Click Recover via WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleRecoverLeadWhatsApp(lead)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                title="গ্রাহকের সাথে সরাসরি WhatsApp-এ কথা বলুন"
                              >
                                <span>💬 Recover via WhatsApp</span>
                              </button>

                              {/* 1-Click Convert to Confirmed Order */}
                              <button
                                type="button"
                                onClick={() => handleConvertLead(lead)}
                                className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                title="অর্ডারটি কনফার্ম করে অ্যাডমিন অর্ডারে যুক্ত করুন"
                              >
                                <span>✅ Convert to Confirmed Order</span>
                              </button>

                              {/* Delete lead */}
                              {onDeleteLead && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteLead(lead.leadId)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: MARKETING & META / TIKTOK PIXEL ENGINE                  */}
        {/* ============================================================ */}
        {activeTab === 'marketing' && (
          <div className="mt-4 space-y-6">
            
            <div className="p-4 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700 space-y-5">
              <div>
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-bold">
                  LIVE AD TRACKING ENGINE
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  🎯 Facebook / Meta Pixel ও TikTok Pixel ট্র্যাকিং ম্যানেজার
                </h3>
                <p className="text-xs text-slate-400">
                  কোনো সোর্স কোড বা থিম ফাইল এডিট না করেই আপনার ফেসবুক অ্যাড অ্যাকাউন্টের পিক্সেল আইডি যুক্ত করুন। ওয়েবসাইট ভিজিটরদের সকল অ্যাকশন রিয়েল-টাইমে ট্র্যাকিং হবে (সকল ইভেন্ট কারেন্সি: <code className="text-amber-400 font-mono">BDT</code>)।
                </p>
              </div>

              <form onSubmit={handleSavePixelSettings} className="space-y-4">
                
                {/* Meta Pixel ID Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">
                    📘 Facebook / Meta Pixel ID:
                  </label>
                  <input
                    type="text"
                    value={pixelForm.fbPixelId || ''}
                    onChange={(e) => setPixelForm({ ...pixelForm, fbPixelId: e.target.value.trim() })}
                    placeholder="যেমন: 1234567890123456"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-orange-500"
                  />
                  <span className="text-[11px] text-slate-400 block">
                    আপনার Facebook Events Manager থেকে পাওয়া ১৫-১৬ ডিজিটের Pixel ID দিন।
                  </span>
                </div>

                {/* TikTok Pixel ID Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">
                    🎵 TikTok Pixel ID (ঐচ্ছিক):
                  </label>
                  <input
                    type="text"
                    value={pixelForm.tiktokPixelId || ''}
                    onChange={(e) => setPixelForm({ ...pixelForm, tiktokPixelId: e.target.value.trim() })}
                    placeholder="যেমন: C1234567890ABCDEF"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-orange-500"
                  />
                  <span className="text-[11px] text-slate-400 block">
                    TikTok Ads Manager এর Pixel ID (প্রযোজ্য হলে)।
                  </span>
                </div>

                {/* Pixel Event Debugger Toast Toggle */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <strong className="text-xs font-bold text-white block flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ভিজ্যুয়াল পিক্সেল ইভেন্ট ডিবাগার টোস্ট (Pixel Debugger Toast)
                    </strong>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      চালু রাখলে প্রতিটি পেজ ভিউ, অফার ভিউ বা অর্ডারে নিচে বামে সবুজ পপআপে ইভেন্ট ও ৳ মান ভেসে উঠবে।
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!pixelForm.isDebuggerActive}
                      onChange={(e) => setPixelForm({ ...pixelForm, isDebuggerActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors shadow flex items-center gap-1.5"
                  >
                    <span>💾 পিক্সেল সেটিংস সেভ করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestPixelEvent}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 border border-slate-600"
                    title="টেস্ট ইভেন্ট ফায়ার করে নিচে বামে সবুজ ডিবাগ টোস্টটি দেখুন"
                  >
                    <span>🎯 টেস্ট পিক্সেল ইভেন্ট ফায়ার করুন</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Auto-Tracked Events Reference Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                ⚡ অটো-ট্র্যাকড স্ট্যান্ডার্ড মেটা পিক্সেল ইভেন্টস (Auto-Fired in BDT)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <strong className="text-emerald-400 font-mono block">1. PageView</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    প্রতিটি পেজ বা অ্যাড ল্যান্ডিং পেজে স্বয়ংক্রিয়ভাবে ফায়ার হয়।
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <strong className="text-emerald-400 font-mono block">2. ViewContent</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    পণ্য ও অফার পেজে (Product Name, ID, SKU, Selling Price & currency: 'BDT' সহ)।
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <strong className="text-emerald-400 font-mono block">3. InitiateCheckout</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    গ্রাহক চেকআউট ফর্ম স্পর্শ করলে বা "অর্ডার করুন" বাটনে ক্লিক করলে ট্র্যাকিং হয়।
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <strong className="text-emerald-400 font-mono block">4. Purchase (Deduplicated)</strong>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ক্যাশ অন ডেলিভারি অর্ডার কনফার্মেশনে Grand Total ও ইউনিক eventID সহ ফায়ার হয়।
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: LIVE B-BAZAR IMPORTER & PROFIT MARGIN CONFIG         */}
        {/* ============================================================ */}
        {activeTab === 'importer' && (
          <div className="mt-4 space-y-6">
            
            {/* Live URL / ID Parser Tool */}
            <div className="p-4 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-orange-600 text-white text-[11px] font-bold">
                  DIRECT SUPPLIER CONNECTION
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  🔗 B-Bazar থেকে সরাসরি প্রোডাক্ট ইমপোর্ট করুন
                </h3>
                <p className="text-xs text-slate-400">
                  যেকোনো B-Bazar প্রোডাক্টের লিংক (যেমন: <code>https://bbazar.com.bd/product/.../item-11764</code>) অথবা প্রোডাক্ট আইডি (যেমন: <code>11764</code>) এখানে পেস্ট করে এক ক্লিকে আপনার স্টোরে যুক্ত করুন।
                </p>
              </div>

              <form onSubmit={handleImportBbazarProduct} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  required
                  value={bbazarInputUrl}
                  onChange={(e) => setBbazarInputUrl(e.target.value)}
                  placeholder="B-Bazar URL বা প্রোডাক্ট আইডি পেস্ট করুন (যেমন: 11764 বা item-11764)..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-orange-500 text-sm text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isImporting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>B-Bazar থেকে আনা হচ্ছে...</span>
                    </>
                  ) : (
                    <span>📥 প্রোডাক্ট ইমপোর্ট করুন</span>
                  )}
                </button>
              </form>

              {importStatus.message && (
                <div className={`p-3 rounded-lg text-xs font-bold ${
                  importStatus.type === 'success' 
                    ? 'bg-emerald-900/50 border border-emerald-500 text-emerald-200' 
                    : 'bg-rose-900/50 border border-rose-500 text-rose-200'
                }`}>
                  {importStatus.message}
                </div>
              )}
            </div>

            {/* Global Profit Margin & Markup Configuration */}
            <div className="p-4 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold">
                  PRICING & PROFIT ENGINE
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  💰 গ্লোবাল প্রফিট মার্জিন / মার্ক-আপ কন্ট্রোল
                </h3>
                <p className="text-xs text-slate-400">
                  B-Bazar-এর বেস প্রাইসের ওপর আপনার কাঙ্ক্ষিত লাভ বা প্রফিট মার্জিন যুক্ত করুন।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                
                {/* Markup Type */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">মার্জিনের ধরন:</label>
                  <select
                    value={markupType}
                    onChange={(e) => setMarkupType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white outline-none"
                  >
                    <option value="fixed">নির্দিষ্ট টাকা (Fixed BDT ৳)</option>
                    <option value="percent">শতাংশ লাভ (Percentage %)</option>
                  </select>
                </div>

                {/* Markup Amount */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-bold">
                    {markupType === 'fixed' ? 'লাভের পরিমাণ (৳ টাকা):' : 'লাভের হার (% পারসেন্টেজ):'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={markupValue}
                    onChange={(e) => setMarkupValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white font-mono outline-none"
                  />
                </div>

                {/* Apply Button */}
                <div className="sm:pt-5">
                  <button
                    type="button"
                    onClick={handleApplyGlobalMarkup}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow"
                  >
                    ⚡ সকল পণ্যে মার্জিন প্রয়োগ করুন
                  </button>
                </div>

              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                💡 <strong>উদাহরণ:</strong> B-Bazar বেস প্রাইস ৳১,০০০ হলে এবং আপনি <strong>+৳১৫০</strong> সেট করলে স্টোরে বিক্রয় মূল্য হবে <strong>৳১,১৫০</strong>। ক্রেতারা B-Bazar এর কোনো তথ্য দেখতে পাবে না।
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PRODUCTS & FACEBOOK AD LINKS HUB                      */}
        {/* ============================================================ */}
        {activeTab === 'products' && (
          <div className="mt-4 space-y-4">
            
            {/* Search Filter & Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="পণ্য বা SKU দিয়ে খুঁজুন (Search catalog)..."
                className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white outline-none focus:border-orange-500"
              />
              <span className="text-xs text-slate-400 font-mono">
                প্রদর্শিত হচ্ছে: {filteredProducts.length} টি পণ্য
              </span>
            </div>

            {/* Products Table with Copy Ad Link & Supplier Cost */}
            <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/60 max-h-[480px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 uppercase font-mono text-[11px] sticky top-0 z-10">
                  <tr>
                    <th className="p-3">পণ্য ও ক্যাটালগ</th>
                    <th className="p-3">SKU / B-Bazar ID</th>
                    <th className="p-3">সাপ্লায়ার বেস রেট</th>
                    <th className="p-3">স্টোর বিক্রয় মূল্য</th>
                    <th className="p-3">আনুমানিক প্রফিট</th>
                    <th className="p-3 text-right">অ্যাকশন ও ফেসবুক অ্যাড</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredProducts.map((p) => {
                    const baseCost = p.wholesalePrice || p.basePrice || p.price;
                    const selling = p.sellingPrice || p.price;
                    const profit = Math.max(0, selling - baseCost);

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        
                        {/* Title & Thumbnail */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={p.image} 
                              alt="" 
                              className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0"
                            />
                            <div>
                              <strong className="text-white line-clamp-1 text-xs max-w-xs">{p.title}</strong>
                              <span className="text-[11px] text-slate-400">{p.categoryName}</span>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="p-3 font-mono text-slate-400">
                          {p.sku || `BBZ-${p.id}`}
                        </td>

                        {/* Supplier Base Cost (Admin Only) */}
                        <td className="p-3 font-mono">
                          <span className="text-slate-400">৳{baseCost}</span>
                          <span className="block text-[10px] text-slate-500">হোলসেল রেট</span>
                        </td>

                        {/* Store Selling Price */}
                        <td className="p-3 font-mono font-bold text-orange-400">
                          ৳{selling}
                        </td>

                        {/* Profit Margin */}
                        <td className="p-3 font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold text-[11px]">
                            +৳{profit} লাভ
                          </span>
                        </td>

                        {/* Action Buttons: 3 Funnel Step Buttons + Supplier Link + Store View */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            
                            {/* 1. Copy Ad Landing URL (/offer/:slug) */}
                            <button
                              type="button"
                              onClick={() => handleCopyAdLink(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition-all cursor-pointer shadow flex items-center gap-1"
                              title="ফেসবুক/ইনস্টাগ্রাম অ্যাড ল্যান্ডিং পেজ লিংক (/offer/:slug) কপি করুন"
                            >
                              <span>🔗 Copy Ad Landing</span>
                            </button>

                            {/* 2. Copy Direct Checkout URL (/checkout/:slug) */}
                            <button
                              type="button"
                              onClick={() => handleCopyCheckoutLink(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all cursor-pointer shadow flex items-center gap-1"
                              title="সরাসরি চেকআউট পেজ লিংক (/checkout/:slug) কপি করুন"
                            >
                              <span>🛒 Direct Checkout</span>
                            </button>

                            {/* 3. Preview Thank You Page (/thank-you/:slug/:orderId) */}
                            <button
                              type="button"
                              onClick={() => handlePreviewThankYou(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow flex items-center gap-1"
                              title="অর্ডার কনফার্মেশন ও থ্যাংক ইউ পেজ প্রিভিউ দেখুন"
                            >
                              <span>✅ Thank You Page</span>
                            </button>

                            {/* Private Supplier Link */}
                            {p.sourceUrl && (
                              <a
                                href={p.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700"
                                title="B-Bazar প্রাইভেট সোর্স পেজ খুলুন"
                              >
                                🔗 B-Bazar
                              </a>
                            )}

                            {/* View Offer / Product */}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onNavigateToProduct) onNavigateToProduct(p);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                              title="স্টোরফ্রন্টে পণ্যটি দেখুন"
                            >
                              👁️
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <span>🔒 B-Bazar সাপ্লায়ারের সকল তথ্য শুধুমাত্র এই অ্যাডমিন প্যানেলে সীমাবদ্ধ। গ্রাহক সম্পূর্ণ হোয়াইট-লেবেল দেখবে।</span>
          <button 
            type="button" 
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold cursor-pointer transition-colors"
            onClick={onClose}
          >
            ড্যাশবোর্ড বন্ধ করুন
          </button>
        </div>

      </div>
    </dialog>
  );
}
