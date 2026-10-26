// src/App.jsx
/**
 * DeshiMart BD - Core Application & Routing Controller
 * 
 * Supports:
 *   1. Full E-Commerce Storefront: /
 *   2. Dedicated Single Product Page with Relevant Products: /product/:slug & /offer/:slug
 *   3. Dedicated Per-Product Ordering Page: /checkout/:slug
 *   4. Dedicated Thank You & Digital Cash Memo Page: /thank-you/:slug/:orderId
 *   5. Secure Backend-Connected Admin Portal with Login Wall: /admin
 */

import React, { useState, useEffect } from 'react';
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
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import AdminPage from './components/AdminPage';
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
    statusStep: 3,
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
    statusStep: 4,
    status: 'ডেলিভারির পথে (Out for Delivery)',
    courier: 'Steadfast Courier',
    consignmentId: 'STF-654128'
  }
];

export default function App() {
  // Client-side Routing Engine (tracks both pathname and query string)
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (url) => {
    window.history.pushState(null, '', url);
    const parsedPath = url.split('?')[0];
    setCurrentPath(parsedPath);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Products catalog state (syncs with backend API & localStorage)
  const [productsList, setProductsList] = useState(() => {
    try {
      const savedCustom = localStorage.getItem('deshimart_custom_products');
      if (savedCustom) {
        const custom = JSON.parse(savedCustom);
        if (Array.isArray(custom) && custom.length > 0) {
          const merged = [...custom, ...initialProducts.filter(ip => !custom.some(cp => cp.id === ip.id))];
          return merged;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialProducts;
  });

  // Bootstrap public store settings & custom catalog from backend
  useEffect(() => {
    fetch('/api/store/bootstrap')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        if (Array.isArray(data.customProducts) && data.customProducts.length > 0) {
          setProductsList(data.customProducts);
        }
        if (data.pixelConfig && data.pixelConfig.fbPixelId) {
          setPixelConfig(data.pixelConfig);
        }
      })
      .catch(() => {
        // Offline or initial fallback
      });
  }, []);

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

  // Pre-seed cart with 2 items
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Rich Product Detail Modal State
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(productsList[1] || productsList[0]);

  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);

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
        hasOrderBump: false,
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

    fetch('/api/store/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftLead)
    }).catch(() => {});
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
      hasOrderBump: false,
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
          slug: product.slug || product.id,
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

  // Route ALL Order buttons directly to that product's Dedicated Ordering Page (/checkout/:slug)
  const handleOpenOrderPage = (product) => {
    if (!product) return;
    const slug = product.slug || product.id;
    const sizeParam = product.selectedSize || product.sizes?.[0] || 'Standard';
    const colorParam =
      product.selectedColor ||
      product.colors?.[0]?.name ||
      (typeof product.colors?.[0] === 'string' ? product.colors[0] : 'Standard');
    const qtyParam = product.quantity || 1;
    navigateTo(
      `/checkout/${slug}?size=${encodeURIComponent(sizeParam)}&color=${encodeURIComponent(colorParam)}&qty=${qtyParam}&bundle=${qtyParam <= 3 ? qtyParam : 1}`
    );
  };

  // Navigate to Dedicated Single Product Page /product/:slug
  const handleViewProduct = (product) => {
    const slug = product.slug || product.id;
    navigateTo(`/product/${slug}`);
  };

  // Checkout whole cart via Dedicated Ordering Page
  const handleCheckoutCart = () => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    navigateTo('/checkout/cart-combo');
  };

  // When order is completed (persists to both state and backend database)
  const handleOrderSuccess = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    showToast(`অর্ডার #${newOrder.orderId} সফলভাবে সম্পন্ন হয়েছে!`);

    fetch('/api/store/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(() => {});
  };

  // Admin updates order status
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

    fetch(`/api/store/orders/${orderId}/upsell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upsellItem })
    }).catch(() => {});
  };

  // Helper to resolve cart-combo or individual product by slug/id
  const resolveProductBySlug = (slug) => {
    if (slug === 'cart-combo' && cartItems.length > 0) {
      return {
        id: 'cart-combo',
        slug: 'cart-combo',
        title: `কার্ট অর্ডার (${cartItems.length} টি পণ্য)`,
        price: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        image: cartItems[0].image,
        sizes: ['মাল্টিপল'],
        colors: [{ name: 'মাল্টিপল', hex: '#0f172a' }],
        selectedSize: 'মাল্টিপল',
        selectedColor: 'মাল্টিপল',
        quantity: 1,
        categoryName: 'কার্ট চেকআউট'
      };
    }
    return productsList.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug) || productsList[0];
  };

  // =========================================================================
  // ROUTING DISPATCH:
  //   0. /admin (Dedicated Secure Admin Portal with Login Wall)
  //   1. /offer/:slug & /product/:slug (Product Page + Relevant Products)
  //   2. /checkout/:slug (Dedicated Per-Product Ordering Page)
  //   3. /thank-you/:slug/:orderId (Dedicated Thank You & Purchase Confirmation)
  // =========================================================================
  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');
  const isCheckoutRoute = currentPath.startsWith('/checkout/');
  const isThankYouRoute = currentPath.startsWith('/thank-you/');
  const isProductRoute = currentPath.startsWith('/product/');
  const isOfferRoute = currentPath.startsWith('/offer/');

  // ROUTE 0: Dedicated Secure Admin Portal (/admin)
  if (isAdminRoute) {
    return (
      <div className="app-layout font-sans min-h-screen bg-slate-950">
        <AdminPage
          orders={orders}
          onSetOrders={setOrders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateCourierInfo={handleUpdateCourierInfo}
          allProducts={productsList}
          onUpdateProducts={handleUpdateProducts}
          onNavigateToProduct={(p) => navigateTo(`/product/${p.slug || p.id}`)}
          onBackToStore={() => navigateTo('/')}
          showToast={showToast}
          abandonedLeads={abandonedLeads}
          onSetAbandonedLeads={setAbandonedLeads}
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

  // ROUTE 2: Dedicated Per-Product Ordering Page (/checkout/:slug)
  if (isCheckoutRoute) {
    const slug = currentPath.replace(/^\/checkout\//, '').replace(/\/.*$/, '');
    const checkoutProduct = resolveProductBySlug(slug);

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
    const thankYouProduct = resolveProductBySlug(slug);

    return (
      <div className="app-layout font-sans">
        <ThankYouPage
          product={thankYouProduct}
          orderId={routeOrderId}
          orders={orders}
          allProducts={productsList}
          onAddUpsellToOrder={handleAddUpsellToOrder}
          onBackToHome={() => navigateTo('/')}
          showToast={showToast}
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
    activeRouteProduct = resolveProductBySlug(slug);
  } else if (isOfferRoute) {
    const slug = currentPath.replace(/^\/offer\//, '').replace(/\/.*$/, '');
    activeRouteProduct = resolveProductBySlug(slug);
  }

  if (activeRouteProduct) {
    return (
      <div className="app-layout font-sans">
        
        {/* Render TopBar if standard product page mode */}
        {!isOfferRoute && (
          <TopBar />
        )}

        {/* Dedicated Single-Product Page with Relevant Products Showcase */}
        <ProductPage
          product={activeRouteProduct}
          allProducts={productsList}
          isAdMode={isOfferRoute}
          onBackToHome={() => navigateTo('/')}
          onAddToCart={handleAddToCart}
          onViewProduct={handleViewProduct}
          onOrderProduct={handleOpenOrderPage}
          onNavigateTo={navigateTo}
        />

        {/* Standard Footer if standard product mode */}
        {!isOfferRoute && (
          <Footer />
        )}

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
      
      {/* 1. Top Bar */}
      <TopBar />

      {/* 2. Main Header */}
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
        
        {/* 3. Hero Section */}
        <HeroSection
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            setSearchTerm('');
          }}
          onOrderProduct={handleOpenOrderPage}
          onViewProduct={handleViewProduct}
        />

        {/* 4. Trust Badges Strip */}
        <TrustBadges />

        {/* 5. Flash Sale with Live Timer */}
        <FlashSale
          products={productsList}
          onOrderProduct={handleOpenOrderPage}
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
          onOrderProduct={handleOpenOrderPage}
          onAddToCart={handleAddToCart}
          onQuickView={handleViewProduct}
          searchTerm={searchTerm}
        />

      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
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

      {/* Rich Product Detail View Modal */}
      <ProductDetailModal
        isOpen={isProductDetailOpen}
        product={detailProduct}
        allProducts={productsList}
        onClose={() => setIsProductDetailOpen(false)}
        onOrderNow={(item) => {
          setIsProductDetailOpen(false);
          handleOpenOrderPage(item);
        }}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => setDetailProduct(p)}
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
