// src/App.jsx
/**
 * DeshiMart BD - Core Application & Routing Controller
 * 
 * Supports:
 *   1. Full E-Commerce Storefront: /
 *   2. Dedicated Daraz-Style Single Product Page: /product/:slug
 *   3. Distraction-Free Facebook/Instagram Ad Landing Funnel: /offer/:slug
 *   4. Instant Live B-Bazar Product Sync & Admin Pricing Engine
 */

import React, { useState, useEffect } from 'react';
import { siteConfig } from './config/siteConfig';
import { categories, products as initialProducts, getProductBySlug } from './data/products';

import TopBar from './components/TopBar';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import TrustBadges from './components/TrustBadges';
import FlashSale from './components/FlashSale';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';

import ProductPage from './components/ProductPage';
import CheckoutPage from './components/CheckoutPage';
import ThankYouPage from './components/ThankYouPage';
import CheckoutModal from './components/CheckoutModal';
import TrackingModal from './components/TrackingModal';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import AdminModal from './components/AdminModal';
import SocialProofToast from './components/SocialProofToast';
import MobileNav from './components/MobileNav';
import MobileCategoryDrawer from './components/MobileCategoryDrawer';
import Toast from './components/Toast';
import PixelDebuggerToast from './components/PixelDebuggerToast';

import { getPixelConfig, savePixelConfig, initMetaPixel, trackPageView } from './utils/pixelManager';
import { sanitizeBDPhone, getBDOperatorName } from './utils/phoneSanitizer';

import './App.css';

// Initial orders seed
const initialSeedOrders = [
  {
    orderId: 'INV-2026-8492',
    customerName: 'তানভীর আহমেদ',
    customerPhone: '01912345678',
    customerAddress: 'হাউজ ১২, রোড ৫, ধানমন্ডি, ঢাকা-১২০৫',
    deliveryArea: 'ঢাকার ভিতরে',
    deliveryFee: 70,
    product: initialProducts[1] || initialProducts[0],
    selectedSize: '41',
    selectedColor: 'Chocolate Brown (চকলেট ব্রাউন)',
    quantity: 1,
    grandTotal: 760,
    date: '১৭ অক্টোবর, ২০২৬',
    time: '০৮:৩০ PM',
    statusStep: 3, // Step 3: কুরিয়ারে দেওয়া হয়েছে
    status: 'কুরিয়ারে দেওয়া হয়েছে (Handed to Courier)',
    courier: 'Steadfast Courier',
    consignmentId: 'STF-782910'
  },
  {
    orderId: 'INV-2026-5120',
    customerName: 'রাকিবুল ইসলাম',
    customerPhone: '01712345670',
    customerAddress: 'টাউন হল মোড়, ময়মনসিংহ সদর',
    deliveryArea: 'ঢাকার বাইরে',
    deliveryFee: 130,
    product: initialProducts[0],
    selectedSize: 'L (40)',
    selectedColor: 'Royal Blue (রয়েল ব্লু)',
    quantity: 1,
    grandTotal: 980,
    date: '১৭ অক্টোবর, ২০২৬',
    time: '০৪:১৫ PM',
    statusStep: 4, // Step 4: ডেলিভারির পথে
    status: 'ডেলিভারির পথে (Out for Delivery)',
    courier: 'Steadfast Courier',
    consignmentId: 'STF-654128'
  }
];

export default function App() {
  // Client-side Routing Engine
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Products catalog state (syncs with live B-Bazar imports & localStorage)
  const [productsList, setProductsList] = useState(() => {
    try {
      const savedCustom = localStorage.getItem('deshimart_custom_products');
      if (savedCustom) {
        const custom = JSON.parse(savedCustom);
        if (Array.isArray(custom) && custom.length > 0) {
          // Merge custom items with initial
          const merged = [...custom, ...initialProducts.filter(ip => !custom.some(cp => cp.id === ip.id))];
          return merged;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialProducts;
  });

  // Handle product updates or new B-Bazar imports
  const handleUpdateProducts = (productOrList, isBatch = false) => {
    if (isBatch && Array.isArray(productOrList)) {
      setProductsList(productOrList);
      try {
        localStorage.setItem('deshimart_custom_products', JSON.stringify(productOrList));
      } catch (e) {
        console.error(e);
      }
      return;
    }

    setProductsList(prev => {
      const existingIdx = prev.findIndex(p => p.id === productOrList.id || p.bbazarId === productOrList.bbazarId);
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = productOrList;
      } else {
        updated = [productOrList, ...prev];
      }
      try {
        localStorage.setItem('deshimart_custom_products', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Pre-seed cart with 2 items to match wireframe [🛒 2]
  const [cartItems, setCartItems] = useState([
    {
      id: "fs-1",
      title: "হ্যান্ডলুম প্রিমিয়াম কটন পাঞ্জাবি - রয়েল ব্লু",
      price: 850,
      image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=600&q=80",
      selectedSize: "L (40)",
      selectedColor: "Royal Blue (রয়েল ব্লু)",
      quantity: 1
    },
    {
      id: "fs-2",
      title: "মেনস ক্লাসিক ফর্মাল লেদার লোফার সু (Premium Casual Loafer)",
      price: 690,
      image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80",
      selectedSize: "41",
      selectedColor: "Chocolate Brown (চকলেট ব্রাউন)",
      quantity: 1
    }
  ]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Rich Product Detail Modal State
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(productsList[1] || productsList[0]);

  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [socialProofEnabled, setSocialProofEnabled] = useState(true);

  // Live Orders State (stored and synced)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('deshimart_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialSeedOrders;
  });

  useEffect(() => {
    try {
      localStorage.setItem('deshimart_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Real-Time Abandoned Leads State
  const [abandonedLeads, setAbandonedLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('deshimart_abandoned_leads');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        leadId: 'LEAD-01823456789-bbz-102',
        customerName: 'মেহজাবিন চৌধুরী',
        customerPhone: '01823456789',
        customerAddress: 'বাড়ি #১৫, জিইসি মোড়, চট্টগ্রাম',
        operator: 'Robi',
        product: initialProducts[1] || initialProducts[0],
        selectedSize: '38',
        selectedColor: 'মারুন',
        quantity: 1,
        hasOrderBump: true,
        estimatedTotal: 1040,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        date: '১৭ অক্টোবর, ২০২৬',
        time: '০৭:১৫ PM',
        status: 'অসম্পূর্ণ (Abandoned Lead)',
        source: 'Facebook Ad Funnel'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('deshimart_abandoned_leads', JSON.stringify(abandonedLeads));
    } catch (e) {
      console.error(e);
    }
  }, [abandonedLeads]);

  // Pixel Configuration State
  const [pixelConfig, setPixelConfig] = useState(() => getPixelConfig());

  useEffect(() => {
    if (pixelConfig?.fbPixelId) {
      initMetaPixel(pixelConfig.fbPixelId);
    }
  }, [pixelConfig]);

  // Fire Meta Pixel PageView on route change
  useEffect(() => {
    trackPageView(currentPath);
  }, [currentPath]);

  // Save or update draft lead (called after 3s debounce from checkout)
  const handleSaveDraftLead = (draftLead) => {
    setAbandonedLeads(prev => {
      const cleanPhone = draftLead.customerPhone;
      const existingIdx = prev.findIndex(l => l.customerPhone === cleanPhone);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...draftLead };
        return copy;
      }
      return [draftLead, ...prev];
    });
  };

  // Remove phone from draft leads when purchase is confirmed
  const handleCleanupDraftLead = (cleanPhone) => {
    setAbandonedLeads(prev => prev.filter(l => l.customerPhone !== cleanPhone));
  };

  // Delete lead manually from Admin
  const handleDeleteLead = (leadId) => {
    setAbandonedLeads(prev => prev.filter(l => l.leadId !== leadId));
    showToast('অসম্পূর্ণ লিড মুছে ফেলা হয়েছে', 'info');
  };

  // Convert abandoned lead into confirmed order from Admin
  const handleConvertLeadToOrder = (lead) => {
    const now = new Date();
    const orderId = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
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

    const convertedOrder = {
      orderId,
      customerName: lead.customerName || 'সম্মানিত গ্রাহক',
      customerPhone: lead.customerPhone,
      customerAddress: lead.customerAddress || 'ফোন কলের মাধ্যমে নিশ্চিত করা হয়েছে',
      operator: lead.operator || getBDOperatorName(lead.customerPhone),
      deliveryArea: 'ঢাকার ভেতরে',
      deliveryFee: 70,
      product: lead.product,
      selectedSize: lead.selectedSize || 'স্ট্যান্ডার্ড',
      selectedColor: lead.selectedColor || 'স্ট্যান্ডার্ড',
      quantity: lead.quantity || 1,
      hasOrderBump: lead.hasOrderBump || false,
      grandTotal: lead.estimatedTotal || ((lead.product?.price || 0) * (lead.quantity || 1) + 70),
      date: formattedDate,
      time: formattedTime,
      statusStep: 1,
      status: 'অর্ডার গৃহীত হয়েছে (Recovered Lead)',
      courier: 'Steadfast Courier',
      consignmentId: `STF-${Math.floor(100000 + Math.random() * 900000)}`,
      source: 'Recovered Abandoned Lead',
      timestamp: Date.now()
    };

    setOrders(prev => [convertedOrder, ...prev]);
    handleCleanupDraftLead(lead.customerPhone);
    showToast(`✅ লিড সফলভাবে কনফার্ম অর্ডার #${orderId} হিসেবে যুক্ত হয়েছে!`);
  };

  // Check 15-minute duplicate order prevention
  const handleCheckDuplicateOrder = (phone, productId) => {
    const clean = sanitizeBDPhone(phone);
    const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
    return orders.some(o => {
      const matchPhone = sanitizeBDPhone(o.customerPhone) === clean;
      const matchProduct = o.product?.id === productId;
      const isRecent = o.timestamp ? o.timestamp > fifteenMinutesAgo : false;
      return matchPhone && matchProduct && isRecent;
    });
  };

  // Update pixel config
  const handleUpdatePixelConfig = (newConfig) => {
    savePixelConfig(newConfig);
    setPixelConfig(newConfig);
  };


  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Add to cart with variant specifications
  const handleAddToCart = (product) => {
    const itemKey = `${product.id}-${product.selectedSize || 'def'}-${product.selectedColor || 'def'}`;
    setCartItems(prev => {
      const existing = prev.find(i => `${i.id}-${i.selectedSize || 'def'}-${i.selectedColor || 'def'}` === itemKey);
      if (existing) {
        return prev.map(i => `${i.id}-${i.selectedSize || 'def'}-${i.selectedColor || 'def'}` === itemKey 
          ? { ...i, quantity: i.quantity + (product.quantity || 1) } 
          : i);
      } else {
        return [...prev, {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          selectedSize: product.selectedSize || product.sizes?.[0] || 'স্ট্যান্ডার্ড',
          selectedColor: product.selectedColor || product.colors?.[0]?.name || 'স্ট্যান্ডার্ড',
          quantity: product.quantity || 1
        }];
      }
    });
    showToast(`"${product.title.slice(0, 22)}..." কার্টে যোগ হয়েছে!`);
  };

  // Update cart item quantity
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };

  // Remove from cart
  const handleRemoveFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
    showToast('পণ্যটি কার্ট থেকে মুছে ফেলা হয়েছে', 'info');
  };

  // Open 1-Click Fast Cash on Delivery Order Modal
  const handleOpenOrderModal = (product) => {
    setSelectedProductForOrder(product);
    setIsOrderModalOpen(true);
  };

  // Navigate to Dedicated Single Product Page /product/:slug
  const handleViewProduct = (product) => {
    const slug = product.slug || product.id;
    navigateTo(`/product/${slug}`);
  };

  // Checkout whole cart as an order
  const handleCheckoutCart = () => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    const comboProduct = {
      id: 'cart-combo',
      title: `কার্ট অর্ডার (${cartItems.length} টি পণ্য)`,
      price: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      image: cartItems[0].image,
      selectedSize: 'মাল্টিপল',
      selectedColor: 'মাল্টিপল',
      quantity: 1,
      categoryName: 'কার্ট চেকআউট'
    };
    setSelectedProductForOrder(comboProduct);
    setIsOrderModalOpen(true);
  };

  // When order is completed
  const handleOrderSuccess = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    showToast(`অর্ডার #${newOrder.orderId} সফলভাবে সম্পন্ন হয়েছে!`);
  };

  // Admin updates order status (Live Sync with Order Tracker)
  const handleUpdateOrderStatus = (orderId, newStep) => {
    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        return {
          ...o,
          statusStep: newStep
        };
      }
      return o;
    }));
    showToast(`অর্ডার #${orderId} এর স্ট্যাটাস আপডেট হয়েছে (ধাপ ${newStep})!`, 'info');
  };

  // Admin updates courier partner & consignment ID
  const handleUpdateCourierInfo = (orderId, courier, consignmentId) => {
    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        return {
          ...o,
          courier,
          consignmentId: consignmentId || o.consignmentId
        };
      }
      return o;
    }));
  };

  // Add VIP Upsell item to existing order (post-purchase from Thank You Page)
  const handleAddUpsellToOrder = (orderId, upsellItem) => {
    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        const existingUpsells = o.upsellItems || [];
        const updatedUpsells = [...existingUpsells, upsellItem];
        const additionalPrice = Number(upsellItem.vipPrice || upsellItem.price || 0);
        return {
          ...o,
          upsellItems: updatedUpsells,
          grandTotal: (Number(o.grandTotal) || 0) + additionalPrice
        };
      }
      return o;
    }));
    showToast(`🎉 "${upsellItem.title?.slice(0, 24)}..." আপনার অর্ডারে যুক্ত হয়েছে (ফ্রি ডেলিভারি)!`);
  };

  // =========================================================================
  // ROUTING DISPATCH:
  // Universal 3-Step Meta Ads Funnel Routes:
  //   1. /offer/:slug & /product/:slug (Ad Landing Page)
  //   2. /checkout/:slug (Dedicated Checkout Page)
  //   3. /thank-you/:slug/:orderId (Dedicated Thank You & Purchase Confirmation)
  // =========================================================================
  const isCheckoutRoute = currentPath.startsWith('/checkout/');
  const isThankYouRoute = currentPath.startsWith('/thank-you/');
  const isProductRoute = currentPath.startsWith('/product/');
  const isOfferRoute = currentPath.startsWith('/offer/');

  // ROUTE 2: Dedicated Product Order / Checkout Page (/checkout/:slug)
  if (isCheckoutRoute) {
    const slug = currentPath.replace(/^\/checkout\//, '').replace(/\/.*$/, '');
    const checkoutProduct = productsList.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug) || productsList[0];

    return (
      <div className="app-layout font-sans">
        <CheckoutPage
          product={checkoutProduct}
          onOrderSuccess={handleOrderSuccess}
          onSaveDraftLead={handleSaveDraftLead}
          onCleanupDraftLead={handleCleanupDraftLead}
          onCheckDuplicateOrder={handleCheckDuplicateOrder}
          onNavigateTo={navigateTo}
          onBackToHome={() => navigateTo('/')}
        />

        {/* Order Tracking Modal */}
        <TrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          orders={orders}
        />

        {/* Store Admin Dashboard Modal */}
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateCourierInfo={handleUpdateCourierInfo}
          socialProofEnabled={socialProofEnabled}
          onToggleSocialProof={setSocialProofEnabled}
          allProducts={productsList}
          onUpdateProducts={handleUpdateProducts}
          onNavigateToProduct={(p) => navigateTo(`/product/${p.slug || p.id}`)}
          showToast={showToast}
          abandonedLeads={abandonedLeads}
          onConvertLeadToOrder={handleConvertLeadToOrder}
          onDeleteLead={handleDeleteLead}
          pixelConfig={pixelConfig}
          onUpdatePixelConfig={handleUpdatePixelConfig}
        />

        {/* Visual Meta & TikTok Pixel Event Debugger Toast */}
        <PixelDebuggerToast isEnabled={pixelConfig?.isDebuggerActive} />

        {/* Global Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </div>
    );
  }

  // ROUTE 3: Dedicated Thank You & Purchase Confirmation Page (/thank-you/:slug/:orderId)
  if (isThankYouRoute) {
    const cleanPath = currentPath.replace(/^\/thank-you\//, '').replace(/\/$/, '');
    const parts = cleanPath.split('/');
    const slug = parts[0] || '';
    const routeOrderId = parts[1] || '';
    const thankYouProduct = productsList.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug) || productsList[0];

    return (
      <div className="app-layout font-sans">
        <ThankYouPage
          product={thankYouProduct}
          orderId={routeOrderId}
          orders={orders}
          allProducts={productsList}
          onAddUpsellToOrder={handleAddUpsellToOrder}
          onOpenTracking={() => setIsTrackingModalOpen(true)}
          onBackToHome={() => navigateTo('/')}
          showToast={showToast}
        />

        {/* Order Tracking Modal */}
        <TrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          orders={orders}
        />

        {/* Store Admin Dashboard Modal */}
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateCourierInfo={handleUpdateCourierInfo}
          socialProofEnabled={socialProofEnabled}
          onToggleSocialProof={setSocialProofEnabled}
          allProducts={productsList}
          onUpdateProducts={handleUpdateProducts}
          onNavigateToProduct={(p) => navigateTo(`/product/${p.slug || p.id}`)}
          showToast={showToast}
          abandonedLeads={abandonedLeads}
          onConvertLeadToOrder={handleConvertLeadToOrder}
          onDeleteLead={handleDeleteLead}
          pixelConfig={pixelConfig}
          onUpdatePixelConfig={handleUpdatePixelConfig}
        />

        {/* Visual Meta & TikTok Pixel Event Debugger Toast */}
        <PixelDebuggerToast isEnabled={pixelConfig?.isDebuggerActive} />

        {/* Global Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </div>
    );
  }

  // ROUTE 1: Single-Product Ad Landing Page (/offer/:slug) or Standard Product Detail Page (/product/:slug)
  let activeRouteProduct = null;
  if (isProductRoute) {
    const slug = currentPath.replace(/^\/product\//, '').replace(/\/.*$/, '');
    activeRouteProduct = productsList.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug) || productsList[0];
  } else if (isOfferRoute) {
    const slug = currentPath.replace(/^\/offer\//, '').replace(/\/.*$/, '');
    activeRouteProduct = productsList.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug) || productsList[0];
  }

  if (activeRouteProduct) {
    return (
      <div className="app-layout font-sans">
        
        {/* Render TopBar if standard product page mode */}
        {!isOfferRoute && (
          <TopBar 
            onOpenTracking={() => setIsTrackingModalOpen(true)}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
          />
        )}

        {/* Dedicated Single-Product Ad Landing Page with Embedded Checkout */}
        <ProductPage
          product={activeRouteProduct}
          isAdMode={isOfferRoute}
          onBackToHome={() => navigateTo('/')}
          onOrderSuccess={handleOrderSuccess}
          onAddToCart={handleAddToCart}
          onOpenTracking={() => setIsTrackingModalOpen(true)}
          cartCount={totalCartCount}
          onSaveDraftLead={handleSaveDraftLead}
          onCleanupDraftLead={handleCleanupDraftLead}
          onCheckDuplicateOrder={handleCheckDuplicateOrder}
          onNavigateTo={navigateTo}
        />

        {/* Standard Footer if standard product mode */}
        {!isOfferRoute && (
          <Footer 
            onOpenTracking={() => setIsTrackingModalOpen(true)} 
            onOpenAdmin={() => setIsAdminModalOpen(true)}
          />
        )}

        {/* Order Tracking Modal */}
        <TrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          orders={orders}
        />

        {/* Store Admin Dashboard Modal */}
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateCourierInfo={handleUpdateCourierInfo}
          socialProofEnabled={socialProofEnabled}
          onToggleSocialProof={setSocialProofEnabled}
          allProducts={productsList}
          onUpdateProducts={handleUpdateProducts}
          onNavigateToProduct={(p) => navigateTo(`/product/${p.slug || p.id}`)}
          showToast={showToast}
          abandonedLeads={abandonedLeads}
          onConvertLeadToOrder={handleConvertLeadToOrder}
          onDeleteLead={handleDeleteLead}
          pixelConfig={pixelConfig}
          onUpdatePixelConfig={handleUpdatePixelConfig}
        />

        {/* Social Proof Toast Popup */}
        <SocialProofToast isEnabled={socialProofEnabled} />

        {/* Visual Meta & TikTok Pixel Event Debugger Toast */}
        <PixelDebuggerToast isEnabled={pixelConfig?.isDebuggerActive} />

        {/* Global Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

      </div>
    );
  }

  // =========================================================================
  // HOMEPAGE DEFAULT STOREFRONT ROUTE: /
  // =========================================================================
  return (
    <div className="app-layout">
      
      {/* 1. Top Bar per wireframe + Admin trigger */}
      <TopBar 
        onOpenTracking={() => setIsTrackingModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* 2. Main Header per wireframe */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        products={productsList}
        onSelectProduct={(p) => {
          setSearchTerm('');
          handleViewProduct(p);
        }}
        onToggleMobileMenu={() => setIsMobileCategoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* 3. Hero Section (Categories | Mega Dhamaka Banner | Today's Deal + Trust Card) */}
        <HeroSection
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            setSearchTerm('');
          }}
          onOrderProduct={handleOpenOrderModal}
          onViewProduct={handleViewProduct}
        />

        {/* 4. Trust Badges Strip per wireframe */}
        <TrustBadges />

        {/* 5. Flash Sale with Live Timer & Wireframe Cards */}
        <FlashSale
          products={productsList}
          onOrderProduct={handleOpenOrderModal}
          onAddToCart={handleAddToCart}
          onQuickView={handleViewProduct}
          onViewAll={() => {
            setActiveCategory('all');
            const target = document.getElementById('product-catalog-section');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 6. Full Catalog Showcase with Sort & Category Filter */}
        <ProductGrid
          products={productsList}
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            setSearchTerm('');
          }}
          onOrderProduct={handleOpenOrderModal}
          onAddToCart={handleAddToCart}
          onQuickView={handleViewProduct}
          searchTerm={searchTerm}
        />

      </main>

      {/* Footer */}
      <Footer 
        onOpenTracking={() => setIsTrackingModalOpen(true)} 
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracking={() => setIsTrackingModalOpen(true)}
        onToggleCategories={() => setIsMobileCategoryOpen(true)}
      />

      {/* Mobile Category Drawer */}
      <MobileCategoryDrawer
        isOpen={isMobileCategoryOpen}
        onClose={() => setIsMobileCategoryOpen(false)}
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId);
          setSearchTerm('');
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckoutCart={handleCheckoutCart}
      />

      {/* Rich Daraz-Style Product Detail View Modal */}
      <ProductDetailModal
        isOpen={isProductDetailOpen}
        product={detailProduct}
        allProducts={productsList}
        onClose={() => setIsProductDetailOpen(false)}
        onOrderNow={(item) => {
          setIsProductDetailOpen(false);
          handleOpenOrderModal(item);
        }}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => setDetailProduct(p)}
      />

      {/* 1-Click Fast COD Checkout Modal & Printable Cash Memo */}
      <CheckoutModal
        isOpen={isOrderModalOpen}
        product={selectedProductForOrder}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onOpenTracking={() => setIsTrackingModalOpen(true)}
        onSaveDraftLead={handleSaveDraftLead}
        onCleanupDraftLead={handleCleanupDraftLead}
        onCheckDuplicateOrder={handleCheckDuplicateOrder}
      />

      {/* Order Tracking Modal (Live Synced with Admin!) */}
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        orders={orders}
      />

      {/* Store Admin Dashboard Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateCourierInfo={handleUpdateCourierInfo}
        socialProofEnabled={socialProofEnabled}
        onToggleSocialProof={setSocialProofEnabled}
        allProducts={productsList}
        onUpdateProducts={handleUpdateProducts}
        onNavigateToProduct={(p) => navigateTo(`/product/${p.slug || p.id}`)}
        showToast={showToast}
        abandonedLeads={abandonedLeads}
        onConvertLeadToOrder={handleConvertLeadToOrder}
        onDeleteLead={handleDeleteLead}
        pixelConfig={pixelConfig}
        onUpdatePixelConfig={handleUpdatePixelConfig}
      />

      {/* Social Proof Toast Popup (Every 25s for 4s) */}
      <SocialProofToast isEnabled={socialProofEnabled} />

      {/* Visual Meta & TikTok Pixel Event Debugger Toast */}
      <PixelDebuggerToast isEnabled={pixelConfig?.isDebuggerActive} />

      {/* Global Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

    </div>
  );
}
