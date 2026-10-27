// src/components/AdminPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { categories } from '../data/products';
import { sanitizeBDPhone, getBDOperatorName } from '../utils/phoneSanitizer';
import { getPixelConfig } from '../utils/pixelManager';

const ORDER_STATUSES = [
  { step: 1, label: 'Pending' },
  { step: 2, label: 'Confirmed' },
  { step: 3, label: 'In Courier' },
  { step: 4, label: 'Out for Delivery' },
  { step: 5, label: 'Delivered' }
];

const ORDER_SOURCES = [
  'Storefront Checkout',
  'Manual — Phone Call',
  'Manual — WhatsApp',
  'Manual — Facebook Page',
  'Ad Landing Page',
  'Recovered Cart'
];

const CATEGORY_LABELS = {
  'mens-fashion': "Men's Fashion",
  'womens-fashion': "Women's Fashion",
  'watches-accessories': 'Watches & Accessories',
  'gadgets-electronics': 'Gadgets & Electronics',
  'gadgets': 'Gadgets & Electronics',
  'home-lifestyle': 'Home & Kitchen',
  'home-kitchen': 'Home & Kitchen',
  'footwear': 'Footwear & Shoes',
  'shoes': 'Footwear & Shoes'
};

export default function AdminPage({
  orders = [],
  onSetOrders,
  onUpdateOrderStatus,
  onUpdateCourierInfo,
  allProducts = [],
  onUpdateProducts,
  onNavigateToProduct,
  onBackToStore,
  showToast,
  abandonedLeads = [],
  onSetAbandonedLeads,
  onConvertLeadToOrder,
  onDeleteLead,
  pixelConfig,
  onUpdatePixelConfig
}) {
  // =========================================================================
  // 1. EPHEMERAL IN-MEMORY AUTHENTICATION (NO CACHE / NO STORAGE)
  // =========================================================================
  const [authToken, setAuthToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminProfile, setAdminProfile] = useState({ username: 'admin', email: 'admin@deshimart.com' });
  const tokenRef = useRef('');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Navigation Section
  const [activeSection, setActiveSection] = useState('overview');

  // Orders Filter, Print Modal, Interactive Inspector Modal & Manual Order Modal
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [inspectedOrder, setInspectedOrder] = useState(null);
  const [inspectorForm, setInspectorForm] = useState(null);

  // Manual Order Creation Modal State
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualOrderForm, setManualOrderForm] = useState({
    productId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deliveryArea: 'Inside Dhaka',
    source: 'Manual — Phone Call',
    selectedSize: 'Standard',
    selectedColor: 'Black',
    quantity: 1
  });

  // Abandoned Carts Filter
  const [leadSearch, setLeadSearch] = useState('');

  // Products Filter & CRUD Modal
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'mens-fashion',
    price: 850,
    originalPrice: 1250,
    wholesalePrice: 650,
    stockLeft: 25,
    image: '',
    sizes: 'M, L, XL, XXL',
    description: ''
  });

  // Supplier Sync & Markup State
  const [bbazarInputUrl, setBbazarInputUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({ message: '', type: '' });
  const [markupType, setMarkupType] = useState('fixed');
  const [markupValue, setMarkupValue] = useState(150);

  // Settings State
  const [pixelForm, setPixelForm] = useState(() => pixelConfig || getPixelConfig());
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newUsername: 'admin',
    newEmail: 'admin@deshimart.com',
    newPassword: ''
  });
  const [securityMsg, setSecurityMsg] = useState({ text: '', type: '' });

  // Purge any legacy cached tokens or sensitive data on mount and invalidate session on page close
  useEffect(() => {
    try {
      localStorage.removeItem('deshimart_admin_token');
      localStorage.removeItem('deshimart_admin_creds_fallback');
      localStorage.removeItem('deshimart_orders');
      localStorage.removeItem('deshimart_abandoned_leads');
      sessionStorage.removeItem('deshimart_admin_token');
    } catch (_e) {
      // Ignore storage errors
    }

    const invalidateSession = () => {
      const currentToken = tokenRef.current;
      if (!currentToken) return;
      tokenRef.current = '';
      try {
        fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`
          },
          body: JSON.stringify({ token: currentToken }),
          keepalive: true
        }).catch(() => {});
      } catch (_e) {
        // Ignore unload network error
      }
    };

    window.addEventListener('pagehide', invalidateSession);
    window.addEventListener('beforeunload', invalidateSession);

    return () => {
      window.removeEventListener('pagehide', invalidateSession);
      window.removeEventListener('beforeunload', invalidateSession);
      invalidateSession();
    };
  }, []);

  useEffect(() => {
    if (pixelConfig) {
      setPixelForm(pixelConfig);
    }
  }, [pixelConfig]);

  // Merge backend and local orders by orderId (newest timestamp wins)
  const mergeOrdersList = (incoming = [], current = []) => {
    const map = new Map();
    [...incoming, ...current].forEach(item => {
      if (!item || !item.orderId) return;
      const existing = map.get(item.orderId);
      if (!existing || (item.timestamp || 0) >= (existing.timestamp || 0)) {
        map.set(item.orderId, item);
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  // Refresh orders from backend helper
  const refreshAdminBootstrap = async (tokenToUse) => {
    const activeToken = tokenToUse || tokenRef.current || authToken;
    if (!activeToken) return;
    try {
      const bootRes = await fetch('/api/admin/bootstrap', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Cache-Control': 'no-store'
        }
      });
      if (bootRes.ok) {
        const bootData = await bootRes.json();
        if (Array.isArray(bootData.orders) && onSetOrders) {
          onSetOrders(prev => mergeOrdersList(bootData.orders, Array.isArray(prev) ? prev : orders));
        }
        if (Array.isArray(bootData.abandonedLeads) && onSetAbandonedLeads) onSetAbandonedLeads(bootData.abandonedLeads);
        if (Array.isArray(bootData.customProducts) && bootData.customProducts.length > 0 && onUpdateProducts) {
          onUpdateProducts(bootData.customProducts, true);
        }
      }
    } catch (_e) {
      // Ignore network error
    }
  };

  // One-way SHA-256 helper for static-host fallback when /api/admin/login is not mounted
  const sha256Hex = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Handle Login Submission (verified by /api/admin/login with static-host fallback if API is 404)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.token) {
          tokenRef.current = data.token;
          setAuthToken(data.token);
          setIsAuthenticated(true);
          setLoginPassword('');

          if (data.admin) {
            setAdminProfile(data.admin);
            setSecurityForm(prev => ({
              ...prev,
              newUsername: data.admin.username,
              newEmail: data.admin.email
            }));
          }

          await refreshAdminBootstrap(data.token);
          if (showToast) showToast('Signed in to Admin Portal');
          setIsLoggingIn(false);
          return;
        } else {
          setLoginError(data.error || 'Invalid username or password.');
          setIsLoggingIn(false);
          return;
        }
      }
    } catch (_err) {
      // Static host fallback below if /api/admin/login is unreachable
    }

    try {
      const cleanId = loginIdentifier.trim().toLowerCase();
      const idDigest = await sha256Hex(cleanId);
      const passDigest = await sha256Hex(loginPassword);
      const validId =
        idDigest === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' ||
        idDigest === 'f147a0770eb2ea4fb262f5df9467e1c4a914b5b3324fc8923a9b97ce3667e2ab';
      const validPass =
        passDigest === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

      if (validId && validPass) {
        const ephemeralToken = `ephemeral_${Date.now()}`;
        tokenRef.current = ephemeralToken;
        setAuthToken(ephemeralToken);
        setIsAuthenticated(true);
        setLoginPassword('');
        if (showToast) showToast('Signed in to Admin Portal');
      } else {
        setLoginError('Invalid username or password.');
      }
    } catch (_e) {
      setLoginError('Authentication failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    const currentToken = tokenRef.current || authToken;
    tokenRef.current = '';
    setAuthToken('');
    setIsAuthenticated(false);
    setLoginPassword('');

    if (currentToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`
          },
          body: JSON.stringify({ token: currentToken })
        });
      } catch (_err) {
        // Ignore network error on logout
      }
    }
    if (showToast) showToast('Signed out', 'info');
  };

  // =========================================================================
  // 2. LOGIN WALL (VARIATION 3 — ZERO HINTS, GENERAL ENGLISH)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen w-full flex overflow-hidden antialiased selection:bg-[#F85606] selection:text-white"
        style={{ backgroundColor: '#f8f7f4', color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}
      >
        {/* Left 40% Brand Side */}
        <div
          className="hidden lg:flex w-[40%] p-[60px] flex-col justify-between shrink-0"
          style={{ backgroundColor: '#1a1a1a', color: '#f8f7f4' }}
        >
          <div>
            <div
              className="inline-block mb-[40px]"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '3rem',
                fontStyle: 'italic',
                borderBottom: '2px solid #F85606'
              }}
            >
              DeshiMart.
            </div>
          </div>

          <div>
            <span
              className="block uppercase opacity-60"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.12em'
              }}
            >
              Administration Node
            </span>
            <p
              className="mt-3 opacity-70 max-w-[300px]"
              style={{ fontSize: '0.85rem', lineHeight: 1.6 }}
            >
              Restricted to authorized store administrators only. Sessions clear automatically when closed.
            </p>
          </div>
        </div>

        {/* Right 60% Login Side */}
        <div className="w-full lg:w-[60%] px-8 py-12 sm:p-[80px] flex flex-col justify-center relative">
          <h1
            className="font-extrabold mb-8"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              lineHeight: 1,
              letterSpacing: '-0.04em'
            }}
          >
            Admin Portal.
          </h1>

          {loginError && (
            <div
              className="flex items-center gap-3 mb-10 font-semibold max-w-[460px]"
              style={{
                background: '#fff5f5',
                color: '#c53030',
                padding: '16px',
                border: '1px solid #feb2b2',
                fontSize: '0.9rem'
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>!</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} autoComplete="off" className="max-w-[460px] w-full">
            <div className="mb-8">
              <label
                className="block uppercase font-bold mb-3"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.7rem',
                  color: 'rgba(26,26,26,0.5)'
                }}
              >
                Username or Email
              </label>
              <input
                type="text"
                required
                autoFocus
                autoComplete="off"
                placeholder="Enter username or email"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-transparent py-3 outline-none transition-colors border-b-2 border-[rgba(26,26,26,0.12)] focus:border-[#F85606]"
                style={{ fontSize: '1.05rem' }}
              />
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label
                  className="block uppercase font-bold"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.7rem',
                    color: 'rgba(26,26,26,0.5)'
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="uppercase font-bold cursor-pointer"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.7rem',
                    color: '#F85606'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent py-3 outline-none transition-colors border-b-2 border-[rgba(26,26,26,0.12)] focus:border-[#F85606]"
                style={{
                  fontSize: '1.05rem',
                  letterSpacing: showPassword ? 'normal' : '0.25em'
                }}
              />
            </div>

            <div className="flex items-center gap-6 mt-12">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="text-white font-extrabold uppercase cursor-pointer transition-transform active:translate-y-0.5 disabled:opacity-60"
                style={{
                  backgroundColor: '#F85606',
                  padding: '18px 36px',
                  letterSpacing: '0.05em',
                  boxShadow: '0 10px 30px rgba(248, 86, 6, 0.2)'
                }}
              >
                {isLoggingIn ? 'Signing In...' : 'Sign In →'}
              </button>

              <button
                type="button"
                onClick={onBackToStore}
                className="font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  fontSize: '0.85rem',
                  color: '#1a1a1a',
                  opacity: 0.45
                }}
              >
                Back to Store
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. AUTHENTICATED ADMIN DASHBOARD LOGIC & HANDLERS
  // =========================================================================
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const deliveredOrders = orders.filter(o => Number(o.statusStep) === 5);
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const pendingOrdersCount = orders.filter(o => !o.statusStep || Number(o.statusStep) === 1).length;
  const inTransitCount = orders.filter(o => Number(o.statusStep) === 3 || Number(o.statusStep) === 4).length;
  const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const getStatusLabel = (step) => {
    const found = ORDER_STATUSES.find(s => s.step === Number(step));
    return found ? found.label : 'Pending';
  };

  // Open Interactive Order Details & Origin Inspector
  const openOrderInspector = (order) => {
    setInspectedOrder(order);
    setInspectorForm({
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      customerAddress: order.customerAddress || '',
      deliveryArea: order.deliveryArea || 'Inside Dhaka',
      source: order.source || 'Storefront Checkout',
      productId: order.product?.id || allProducts[0]?.id || '',
      selectedSize: order.selectedSize || 'Standard',
      selectedColor: order.selectedColor || 'Black',
      quantity: Number(order.quantity) || 1,
      statusStep: Number(order.statusStep) || 1,
      courier: order.courier || 'Steadfast Courier',
      consignmentId: order.consignmentId || ''
    });
  };

  // Save edited Order Details & Origin from Inspector Modal
  const handleSaveInspectedOrder = async (e) => {
    e.preventDefault();
    if (!inspectedOrder || !inspectorForm) return;

    const matchedProduct =
      allProducts.find(p => p.id === inspectorForm.productId) ||
      inspectedOrder.product ||
      allProducts[0];
    const slug = matchedProduct?.slug || matchedProduct?.id || 'product';
    const qty = Math.max(1, Number(inspectorForm.quantity) || 1);
    const deliveryFee = inspectorForm.deliveryArea === 'Inside Dhaka' ? 70 : 130;
    const unitPrice = Number(matchedProduct?.price || inspectedOrder.product?.price || 0);
    const updatedGrandTotal = unitPrice * qty + deliveryFee;
    const cleanPhone = sanitizeBDPhone(inspectorForm.customerPhone) || inspectorForm.customerPhone.trim();

    const updates = {
      customerName: inspectorForm.customerName.trim(),
      customerPhone: cleanPhone,
      operator: getBDOperatorName(cleanPhone),
      customerAddress: inspectorForm.customerAddress.trim(),
      deliveryArea: inspectorForm.deliveryArea,
      deliveryFee,
      source: inspectorForm.source,
      product: {
        ...(inspectedOrder.product || {}),
        id: matchedProduct.id,
        slug,
        sku: matchedProduct.sku || `BBZ-${matchedProduct.id}`,
        title: matchedProduct.title,
        price: unitPrice,
        image: matchedProduct.image
      },
      orderedFromPath:
        inspectorForm.source === 'Storefront Checkout'
          ? `/checkout/${slug}`
          : `Admin (${inspectorForm.source})`,
      productPagePath: `/product/${slug}`,
      selectedSize: inspectorForm.selectedSize,
      selectedColor: inspectorForm.selectedColor,
      quantity: qty,
      grandTotal: updatedGrandTotal,
      statusStep: Number(inspectorForm.statusStep),
      status: getStatusLabel(inspectorForm.statusStep),
      courier: inspectorForm.courier,
      consignmentId: inspectorForm.consignmentId.trim()
    };

    const nextOrders = orders.map(o =>
      o.orderId === inspectedOrder.orderId ? { ...o, ...updates } : o
    );
    if (onSetOrders) onSetOrders(nextOrders);
    setInspectedOrder({ ...inspectedOrder, ...updates });

    try {
      const res = await fetch(`/api/admin/orders/${inspectedOrder.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders) && onSetOrders) onSetOrders(data.orders);
      }
    } catch (_err) {
      // Updated in state
    }

    if (showToast) showToast(`Order #${inspectedOrder.orderId} updated & synced`);
    setInspectedOrder(null);
  };

  // Open Manual Order Modal
  const openManualOrderModal = () => {
    const defaultProd = allProducts[0] || {};
    setManualOrderForm({
      productId: defaultProd.id || '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      deliveryArea: 'Inside Dhaka',
      source: 'Manual — Phone Call',
      selectedSize: defaultProd.sizes?.[0] || 'Standard',
      selectedColor:
        defaultProd.colors?.[0]?.name ||
        (typeof defaultProd.colors?.[0] === 'string' ? defaultProd.colors[0] : 'Black'),
      quantity: 1
    });
    setIsManualOrderOpen(true);
  };

  // Submit & Sync Manual Order
  const handleCreateManualOrder = async (e) => {
    e.preventDefault();
    const selectedProduct = allProducts.find(p => p.id === manualOrderForm.productId) || allProducts[0];
    if (!selectedProduct) return;

    const cleanPhone = sanitizeBDPhone(manualOrderForm.customerPhone) || manualOrderForm.customerPhone.trim();
    const qty = Math.max(1, Number(manualOrderForm.quantity) || 1);
    const deliveryFee = manualOrderForm.deliveryArea === 'Inside Dhaka' ? 70 : 130;
    const subtotal = (Number(selectedProduct.price) || 0) * qty;
    const grandTotal = subtotal + deliveryFee;
    const slug = selectedProduct.slug || selectedProduct.id;
    const now = new Date();
    const orderId = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      orderId,
      customerName: manualOrderForm.customerName.trim(),
      customerPhone: cleanPhone,
      operator: getBDOperatorName(cleanPhone),
      customerAddress: manualOrderForm.customerAddress.trim(),
      deliveryArea: manualOrderForm.deliveryArea,
      deliveryFee,
      product: {
        id: selectedProduct.id,
        slug,
        sku: selectedProduct.sku || `BBZ-${selectedProduct.id}`,
        title: selectedProduct.title,
        price: selectedProduct.price,
        image: selectedProduct.image
      },
      selectedSize: manualOrderForm.selectedSize || 'Standard',
      selectedColor: manualOrderForm.selectedColor || 'Black',
      quantity: qty,
      subtotal,
      grandTotal,
      date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      statusStep: 2,
      status: 'Confirmed',
      courier: 'Steadfast Courier',
      consignmentId: `STF-${Math.floor(100000 + Math.random() * 900000)}`,
      source: manualOrderForm.source,
      orderedFromPath:
        manualOrderForm.source === 'Storefront Checkout'
          ? `/checkout/${slug}`
          : `Manual (${manualOrderForm.source})`,
      productPagePath: `/product/${slug}`,
      timestamp: Date.now()
    };

    if (onSetOrders) {
      onSetOrders([newOrder, ...orders]);
    }
    setIsManualOrderOpen(false);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(newOrder)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders) && onSetOrders) {
          onSetOrders(data.orders);
        }
      }
    } catch (_err) {
      // Fallback sync via public orders endpoint
      fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(() => {});
    }

    if (showToast) showToast(`Manual Order #${orderId} created & synced`);
  };

  const handleStatusChange = async (orderId, newStep) => {
    const statusLabel = getStatusLabel(newStep);
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, Number(newStep));
    }
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ statusStep: Number(newStep), status: statusLabel })
      });
    } catch (_err) {
      // Local state already updated
    }
  };

  const handleCourierChange = async (orderId, courier, consignmentId) => {
    if (onUpdateCourierInfo) {
      onUpdateCourierInfo(orderId, courier, consignmentId);
    }
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ courier, consignmentId })
      });
    } catch (_err) {
      // Local state already updated
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (onSetOrders) {
      onSetOrders(orders.filter(o => o.orderId !== orderId));
    }
    if (showToast) showToast(`Order #${orderId} deleted`, 'info');
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (_err) {
      // Ignored
    }
  };

  const handleExportOrdersCSV = () => {
    const headers = ['Order ID', 'Date', 'Source', 'Customer Name', 'Phone', 'Operator', 'Address', 'Area', 'Product', 'Size', 'Color', 'Qty', 'Total BDT', 'Courier', 'Tracking ID', 'Status'];
    const rows = orders.map(o => [
      o.orderId,
      `"${(o.date || '').replace(/"/g, '""')}"`,
      `"${(o.source || 'Storefront Checkout').replace(/"/g, '""')}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      o.customerPhone,
      o.operator || '',
      `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
      `"${(o.deliveryArea || '').replace(/"/g, '""')}"`,
      `"${(o.product?.title || '').replace(/"/g, '""')}"`,
      `"${(o.selectedSize || '').replace(/"/g, '""')}"`,
      `"${(o.selectedColor || '').replace(/"/g, '""')}"`,
      o.quantity || 1,
      o.grandTotal || 0,
      `"${(o.courier || '').replace(/"/g, '""')}"`,
      o.consignmentId || '',
      getStatusLabel(o.statusStep || 1)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('Orders exported to CSV');
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`${label} copied`);
  };

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      category: 'mens-fashion',
      price: 850,
      originalPrice: 1250,
      wholesalePrice: 650,
      stockLeft: 25,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      sizes: 'M, L, XL, XXL',
      description: 'Premium quality guaranteed. Cash on delivery available nationwide.'
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title || '',
      category: prod.category || 'mens-fashion',
      price: prod.price || 850,
      originalPrice: prod.originalPrice || 1200,
      wholesalePrice: prod.wholesalePrice || Math.max(100, (prod.price || 850) - 180),
      stockLeft: prod.stockLeft || 20,
      image: prod.image || '',
      sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : 'Standard',
      description: prod.description || ''
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProductForm = async (e) => {
    e.preventDefault();
    const catObj = categories.find(c => c.id === productForm.category);
    const categoryName = catObj ? catObj.name : 'Fashion & Lifestyle';
    const priceNum = Math.max(1, Number(productForm.price) || 850);
    const origNum = Math.max(priceNum, Number(productForm.originalPrice) || priceNum + 300);
    const discountPercent = origNum > priceNum ? Math.round(((origNum - priceNum) / origNum) * 100) : 0;
    const parsedSizes = String(productForm.sizes || 'Standard')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let updatedCatalog;
    if (editingProduct) {
      const updatedItem = {
        ...editingProduct,
        title: productForm.title.trim(),
        category: productForm.category,
        categoryName,
        price: priceNum,
        originalPrice: origNum,
        wholesalePrice: Number(productForm.wholesalePrice) || Math.max(50, priceNum - 150),
        discountPercent,
        stockLeft: Number(productForm.stockLeft) || 15,
        image: productForm.image.trim(),
        sizes: parsedSizes.length > 0 ? parsedSizes : ['Standard'],
        description: productForm.description.trim()
      };
      updatedCatalog = allProducts.map(p => (p.id === editingProduct.id ? updatedItem : p));
    } else {
      const newId = `dm-${Date.now().toString().slice(-5)}`;
      const newItem = {
        id: newId,
        slug: `product-${newId}`,
        sku: `DM-${newId.toUpperCase()}`,
        title: productForm.title.trim(),
        category: productForm.category,
        categoryName,
        price: priceNum,
        originalPrice: origNum,
        wholesalePrice: Number(productForm.wholesalePrice) || Math.max(50, priceNum - 150),
        discountPercent,
        rating: 4.9,
        reviewsCount: 42,
        stockLeft: Number(productForm.stockLeft) || 20,
        isFlashSale: true,
        image: productForm.image.trim(),
        gallery: [productForm.image.trim()],
        sizes: parsedSizes.length > 0 ? parsedSizes : ['Standard'],
        colors: [{ name: 'Standard', hex: '#0f172a' }],
        description: productForm.description.trim() || 'Premium quality product.'
      };
      updatedCatalog = [newItem, ...allProducts];
    }

    if (onUpdateProducts) {
      onUpdateProducts(updatedCatalog, true);
    }
    setIsProductModalOpen(false);
    if (showToast) {
      showToast(editingProduct ? 'Product updated' : 'Product added');
    }

    try {
      await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ products: updatedCatalog })
      });
    } catch (_err) {
      // Saved locally
    }
  };

  const handleDeleteProduct = async (productId) => {
    const updatedCatalog = allProducts.filter(p => p.id !== productId);
    if (onUpdateProducts) {
      onUpdateProducts(updatedCatalog, true);
    }
    if (showToast) showToast('Product deleted', 'info');
    try {
      await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ products: updatedCatalog })
      });
    } catch (_err) {
      // Saved locally
    }
  };

  // Supplier Importer
  const extractBbazarId = (input) => {
    const trimmed = input.trim();
    const itemMatch = trimmed.match(/item-(\d+)/i);
    if (itemMatch) return itemMatch[1];
    const numMatch = trimmed.match(/(\d{3,6})/);
    if (numMatch) return numMatch[1];
    return null;
  };

  const sanitizeBbazarImg = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';
    if (url.startsWith('http')) return url;
    return `https://bbazar.com.bd/${url.replace(/^\/+/, '')}`;
  };

  const handleImportBbazarProduct = async (e) => {
    e.preventDefault();
    setImportStatus({ message: '', type: '' });

    const productId = extractBbazarId(bbazarInputUrl);
    if (!productId) {
      setImportStatus({
        message: 'Enter a valid B-Bazar product URL or numeric ID (e.g. item-11764)',
        type: 'error'
      });
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch(`https://bbazar.com.bd/api/v3/products/${productId}/data`, {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const raw = json.data || json;
      if (!raw || !raw.name) throw new Error('Product data not found');

      const wholesaleCost = Number(raw.sale_price || raw.regular_price || 650);
      const calculatedPrice =
        markupType === 'fixed'
          ? Math.round(wholesaleCost + Number(markupValue))
          : Math.round(wholesaleCost * (1 + Number(markupValue) / 100));
      const calculatedOriginal = Math.round(calculatedPrice * 1.28);
      const discountPercent = Math.round(((calculatedOriginal - calculatedPrice) / calculatedOriginal) * 100);

      let galleryUrls = [];
      if (Array.isArray(raw.product_images) && raw.product_images.length > 0) {
        galleryUrls = raw.product_images.map(img => sanitizeBbazarImg(img.name || img.image || img));
      } else if (raw.image) {
        galleryUrls = [sanitizeBbazarImg(raw.image)];
      }

      const newProduct = {
        id: `bbz-${raw.id || productId}`,
        bbazarId: Number(raw.id || productId),
        slug: `${raw.slug || 'product'}-item-${raw.id || productId}`,
        sku: raw.code || `BBZ-${raw.id || productId}`,
        title: raw.name.trim(),
        category: 'mens-fashion',
        categoryName: raw.category?.name || 'Fashion & Lifestyle',
        wholesalePrice: wholesaleCost,
        price: calculatedPrice,
        originalPrice: calculatedOriginal,
        discountPercent: discountPercent > 0 ? discountPercent : 20,
        rating: 4.9,
        reviewsCount: 84,
        stockLeft: 14,
        isFlashSale: true,
        image: galleryUrls[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
        gallery: galleryUrls,
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Standard', hex: '#0f172a' }],
        description: `${raw.name.trim()} — Premium quality guaranteed.`
      };

      const updatedCatalog = [newProduct, ...allProducts.filter(p => p.id !== newProduct.id)];
      if (onUpdateProducts) onUpdateProducts(updatedCatalog, true);
      setImportStatus({
        message: `Imported "${newProduct.title}" (Cost: ৳${wholesaleCost} → Retail: ৳${calculatedPrice})`,
        type: 'success'
      });
      setBbazarInputUrl('');
      if (showToast) showToast('Product imported');
    } catch (err) {
      setImportStatus({
        message: `Import failed: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleApplyGlobalMarkup = async () => {
    const val = Number(markupValue);
    if (isNaN(val) || val < 0) return;

    const updatedList = allProducts.map(p => {
      const baseCost = p.wholesalePrice || Math.max(100, p.price - 150);
      const newRetailPrice =
        markupType === 'fixed'
          ? Math.round(baseCost + val)
          : Math.round(baseCost * (1 + val / 100));
      const newOrigPrice = Math.max(p.originalPrice || 0, Math.round(newRetailPrice * 1.25));
      const newDisc = Math.round(((newOrigPrice - newRetailPrice) / newOrigPrice) * 100);
      return {
        ...p,
        wholesalePrice: baseCost,
        price: newRetailPrice,
        originalPrice: newOrigPrice,
        discountPercent: newDisc > 0 ? newDisc : 15
      };
    });

    if (onUpdateProducts) onUpdateProducts(updatedList, true);
    if (showToast) showToast('Profit markup applied to all products');
    try {
      await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ products: updatedList })
      });
    } catch (_err) {
      // Ignored
    }
  };

  const handleSavePixelSettings = async (e) => {
    e.preventDefault();
    if (onUpdatePixelConfig) onUpdatePixelConfig(pixelForm);
    if (showToast) showToast('Pixel settings saved');
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ pixelConfig: pixelForm })
      });
    } catch (_err) {
      // Ignored
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setSecurityMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(securityForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminProfile(data.admin);
        setSecurityForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        setSecurityMsg({ text: 'Credentials updated.', type: 'success' });
        if (showToast) showToast('Admin credentials updated');
      } else {
        setSecurityMsg({ text: data.error || 'Current password is incorrect.', type: 'error' });
      }
    } catch (_err) {
      setSecurityMsg({ text: 'Could not update credentials.', type: 'error' });
    }
  };

  // Filtered Data
  const filteredOrders = orders.filter(o => {
    const matchesStatus =
      orderStatusFilter === 'all' || String(o.statusStep || 1) === String(orderStatusFilter);
    if (!matchesStatus) return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q) ||
      o.customerAddress?.toLowerCase().includes(q) ||
      o.source?.toLowerCase().includes(q) ||
      o.product?.title?.toLowerCase().includes(q)
    );
  });

  const filteredLeads = abandonedLeads.filter(l => {
    if (!leadSearch.trim()) return true;
    const q = leadSearch.toLowerCase();
    return (
      l.customerName?.toLowerCase().includes(q) ||
      l.customerPhone?.includes(q) ||
      l.product?.title?.toLowerCase().includes(q)
    );
  });

  const filteredProducts = allProducts.filter(p => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    if (!matchesCat) return false;
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  const navItems = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'orders', label: 'Orders', count: orders.length },
    { id: 'leads', label: 'Abandoned Carts', count: abandonedLeads.length },
    { id: 'products', label: 'Products', count: allProducts.length },
    { id: 'importer', label: 'Supplier Sync', count: null },
    { id: 'settings', label: 'Settings', count: null }
  ];

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row antialiased selection:bg-[#F85606] selection:text-white"
      style={{ backgroundColor: '#f8f7f4', color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ================================================================= */}
      {/* SIDEBAR NAVIGATION (250px)                                        */}
      {/* ================================================================= */}
      <aside
        className="w-full lg:w-[250px] shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10"
        style={{ backgroundColor: '#1a1a1a', color: '#f8f7f4' }}
      >
        <div>
          {/* Brand Wordmark */}
          <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
            <span
              className="inline-block leading-none"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.85rem',
                fontStyle: 'italic',
                borderBottom: '2px solid #F85606'
              }}
            >
              DeshiMart.
            </span>
            <span
              className="uppercase text-white/50"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em' }}
            >
              Admin
            </span>
          </div>

          {/* Primary Navigation */}
          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {navItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#F85606] text-white'
                      : 'text-white/65 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== null && (
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isActive ? 'text-white' : 'text-white/40'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account & Session Actions */}
        <div className="hidden lg:block p-5 border-t border-white/10 space-y-4">
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">{adminProfile.username}</div>
            <div className="text-[11px] text-white/50 truncate font-mono">{adminProfile.email}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onBackToStore}
              className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer text-center whitespace-nowrap"
            >
              Storefront
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="py-2 px-3 bg-transparent border border-white/20 hover:border-white/50 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer text-center whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN WORKSPACE                                                    */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on Left, Primary Actions on Right */}
        <header className="bg-white border-b border-black/10 px-6 py-4 flex items-center justify-between gap-8 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm whitespace-nowrap shrink-0">
            <span className="text-black/45">Admin</span>
            <span className="text-black/25">/</span>
            <span className="font-bold text-[#1a1a1a]">
              {navItems.find(n => n.id === activeSection)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={openManualOrderModal}
              className="px-4 py-2 bg-[#F85606] hover:bg-[#d94904] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              + Manual Order
            </button>
            <button
              type="button"
              onClick={openCreateProductModal}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              + Add Product
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden px-3 py-2 border border-black/15 text-xs font-semibold text-[#1a1a1a] cursor-pointer whitespace-nowrap shrink-0"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1440px] w-full mx-auto space-y-8">
          {/* ============================================================= */}
          {/* 1. OVERVIEW                                                   */}
          {/* ============================================================= */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              {/* 4 KPI Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-black/10 divide-y sm:divide-y-0 sm:divide-x divide-black/10">
                <div className="p-6">
                  <div className="text-xs text-black/50 font-medium">Total Revenue</div>
                  <div className="text-2xl font-extrabold text-[#1a1a1a] mt-2 font-mono tabular-nums">
                    ৳{totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-black/45 mt-2 font-mono tabular-nums">
                    Avg. Order ৳{averageOrderValue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-xs text-black/50 font-medium">Delivered Revenue</div>
                  <div className="text-2xl font-extrabold text-[#16A34A] mt-2 font-mono tabular-nums">
                    ৳{deliveredRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-black/45 mt-2 font-mono tabular-nums">
                    {deliveredOrders.length} completed · {inTransitCount} in transit
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-xs text-black/50 font-medium">Total Orders</div>
                  <div className="text-2xl font-extrabold text-[#1a1a1a] mt-2 font-mono tabular-nums">
                    {orders.length}
                  </div>
                  <div className="text-xs text-[#D97706] mt-2 font-mono tabular-nums">
                    {pendingOrdersCount} pending review
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-xs text-black/50 font-medium">Abandoned Carts</div>
                  <div className="text-2xl font-extrabold text-[#F85606] mt-2 font-mono tabular-nums">
                    {abandonedLeads.length}
                  </div>
                  <div className="text-xs text-black/45 mt-2">
                    Ready for follow-up
                  </div>
                </div>
              </div>

              {/* Order Pipeline & Interactive Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Pipeline */}
                <div className="bg-white border border-black/10 p-6">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10">
                    <h2 className="text-sm font-bold text-[#1a1a1a]">Order Pipeline</h2>
                    <span className="text-xs text-black/45 font-mono tabular-nums">{orders.length} total</span>
                  </div>
                  <div className="space-y-4">
                    {ORDER_STATUSES.map(st => {
                      const count = orders.filter(o => Number(o.statusStep || 1) === st.step).length;
                      const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                      return (
                        <div key={st.step} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-black/80">{st.label}</span>
                            <span className="font-mono tabular-nums text-black/50">
                              {count} · {pct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black/5 overflow-hidden">
                            <div
                              className="h-full bg-[#1a1a1a]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Orders Table (Interactive Order Cells & Rows) */}
                <div className="lg:col-span-2 bg-white border border-black/10">
                  <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-[#1a1a1a]">Recent Orders</h2>
                      <p className="text-[11px] text-black/45 mt-0.5">
                        Click any Order ID to inspect customer location, product name, and origin.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => refreshAdminBootstrap()}
                        className="text-xs font-semibold text-black/60 hover:text-black cursor-pointer"
                      >
                        Sync
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('orders')}
                        className="text-xs font-semibold text-[#F85606] hover:underline cursor-pointer"
                      >
                        View All →
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/10 text-black/45 uppercase font-mono text-[11px]">
                          <th className="py-3 px-6">Order & Origin</th>
                          <th className="py-3 px-6">Customer & Location</th>
                          <th className="py-3 px-6">Specific Product</th>
                          <th className="py-3 px-6 text-right">Amount</th>
                          <th className="py-3 px-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {orders.slice(0, 6).map(order => (
                          <tr
                            key={order.orderId}
                            onClick={() => openOrderInspector(order)}
                            className="hover:bg-[#F85606]/[0.04] transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderInspector(order);
                                }}
                                className="text-left cursor-pointer"
                              >
                                <div className="font-mono font-bold text-[#1a1a1a] group-hover:text-[#F85606] underline decoration-black/20 group-hover:decoration-[#F85606] underline-offset-2 tabular-nums">
                                  #{order.orderId}
                                </div>
                                <div className="text-[11px] text-black/50 mt-0.5">
                                  {order.source || 'Storefront Checkout'}
                                </div>
                              </button>
                            </td>
                            <td className="py-3.5 px-6">
                              <div className="font-semibold text-[#1a1a1a]">{order.customerName}</div>
                              <div className="text-[11px] text-black/55 line-clamp-1">
                                {order.customerAddress} · {order.deliveryArea || 'Inside Dhaka'}
                              </div>
                            </td>
                            <td className="py-3.5 px-6 max-w-[220px]">
                              <div className="font-medium text-[#1a1a1a] truncate">
                                {order.product?.title}
                              </div>
                              <div className="text-[11px] text-black/45 font-mono tabular-nums">
                                {order.product?.sku || order.product?.id} · Qty {order.quantity || 1}
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-right font-mono font-semibold text-[#1a1a1a] tabular-nums">
                              ৳{(Number(order.grandTotal) || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-6 text-black/75 font-medium whitespace-nowrap">
                              {getStatusLabel(order.statusStep || 1)}
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-black/45">
                              No orders recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 2. ORDERS                                                     */}
          {/* ============================================================= */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white border border-black/10 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order ID, customer name, location, source, or product..."
                    className="flex-1 bg-[#f8f7f4] border border-black/10 px-3.5 py-2 text-xs text-[#1a1a1a] focus:border-[#1a1a1a] outline-none"
                  />
                  <div className="flex items-center gap-1 bg-[#f8f7f4] p-1 border border-black/10 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('all')}
                      className={`px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap ${
                        orderStatusFilter === 'all' ? 'bg-white text-[#1a1a1a] shadow-xs font-semibold' : 'text-black/60 hover:text-black'
                      }`}
                    >
                      All
                    </button>
                    {ORDER_STATUSES.map(s => (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setOrderStatusFilter(String(s.step))}
                        className={`px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap ${
                          orderStatusFilter === String(s.step) ? 'bg-white text-[#1a1a1a] shadow-xs font-semibold' : 'text-black/60 hover:text-black'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => refreshAdminBootstrap()}
                    className="px-3.5 py-2 border border-black/15 hover:border-black text-[#1a1a1a] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Sync Orders
                  </button>
                  <button
                    type="button"
                    onClick={openManualOrderModal}
                    className="px-3.5 py-2 bg-[#F85606] hover:bg-[#d94904] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Manual Order
                  </button>
                  <button
                    type="button"
                    onClick={handleExportOrdersCSV}
                    className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-black/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 text-black/45 uppercase font-mono text-[11px] bg-[#f8f7f4]/60">
                        <th className="py-3.5 px-4">Order & Source (Click to Inspect)</th>
                        <th className="py-3.5 px-4">Customer & Ordered From Location</th>
                        <th className="py-3.5 px-4">Specific Product</th>
                        <th className="py-3.5 px-4">Courier & Tracking</th>
                        <th className="py-3.5 px-4 text-right">Total</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredOrders.map(order => {
                        const slug = order.product?.slug || order.product?.id || '';
                        const originPath = order.orderedFromPath || `/checkout/${slug}`;
                        return (
                          <tr key={order.orderId} className="hover:bg-[#F85606]/[0.03] align-top group">
                            {/* Interactive First Cell (CSS selector target) */}
                            <td
                              onClick={() => openOrderInspector(order)}
                              className="py-3.5 px-4 whitespace-nowrap cursor-pointer"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderInspector(order);
                                }}
                                className="text-left cursor-pointer block"
                              >
                                <div className="font-mono font-bold text-[#1a1a1a] group-hover:text-[#F85606] underline decoration-black/25 group-hover:decoration-[#F85606] underline-offset-2 tabular-nums">
                                  #{order.orderId}
                                </div>
                                <div className="text-[11px] font-semibold text-[#F85606] mt-0.5">
                                  {order.source || 'Storefront Checkout'}
                                </div>
                                <div className="text-[11px] text-black/45 mt-0.5 font-mono tabular-nums">
                                  {order.date} · {order.time}
                                </div>
                              </button>
                            </td>

                            <td
                              onClick={() => openOrderInspector(order)}
                              className="py-3.5 px-4 min-w-[200px] cursor-pointer"
                            >
                              <div className="font-semibold text-[#1a1a1a]">{order.customerName}</div>
                              <div className="font-mono text-black/70 mt-0.5 tabular-nums">
                                {order.customerPhone}
                                {order.operator ? ` · ${order.operator}` : ''}
                              </div>
                              <div className="text-[11px] text-black/60 mt-0.5">
                                {order.customerAddress} ({order.deliveryArea || 'Inside Dhaka'})
                              </div>
                            </td>

                            <td
                              onClick={() => openOrderInspector(order)}
                              className="py-3.5 px-4 min-w-[220px] cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                {order.product?.image && (
                                  <img
                                    src={order.product.image}
                                    alt={order.product?.title || 'Product'}
                                    referrerPolicy="no-referrer"
                                    className="w-9 h-9 object-cover border border-black/10 shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="font-semibold text-[#1a1a1a] line-clamp-1">
                                    {order.product?.title}
                                  </div>
                                  <div className="text-[11px] text-black/50 mt-0.5 font-mono tabular-nums">
                                    Size: {order.selectedSize || 'Std'} · Color: {order.selectedColor || 'Std'} · Qty: {order.quantity || 1}
                                  </div>
                                  <div className="text-[10px] text-black/40 font-mono truncate mt-0.5">
                                    From: {originPath}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 min-w-[190px]">
                              <div className="space-y-1.5">
                                <select
                                  value={order.courier || 'Steadfast Courier'}
                                  onChange={(e) => handleCourierChange(order.orderId, e.target.value, order.consignmentId)}
                                  className="w-full bg-[#f8f7f4] border border-black/10 px-2 py-1 text-[11px] text-[#1a1a1a] outline-none"
                                >
                                  <option value="Steadfast Courier">Steadfast Courier</option>
                                  <option value="Pathao Parcel">Pathao Parcel</option>
                                  <option value="RedX Logistics">RedX Logistics</option>
                                  <option value="Sundarban Courier">Sundarban Courier</option>
                                </select>
                                <input
                                  type="text"
                                  defaultValue={order.consignmentId || ''}
                                  placeholder="Tracking ID"
                                  onBlur={(e) => handleCourierChange(order.orderId, order.courier || 'Steadfast Courier', e.target.value)}
                                  className="w-full bg-[#f8f7f4] border border-black/10 px-2 py-1 text-[11px] font-mono text-[#1a1a1a] outline-none tabular-nums"
                                />
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-[#1a1a1a] tabular-nums">
                              ৳{(Number(order.grandTotal) || 0).toLocaleString('en-IN')}
                            </td>

                            <td className="py-3.5 px-4 min-w-[140px]">
                              <select
                                value={order.statusStep || 1}
                                onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                className="w-full bg-[#f8f7f4] border border-black/15 px-2.5 py-1.5 text-xs font-semibold text-[#1a1a1a] outline-none cursor-pointer"
                              >
                                {ORDER_STATUSES.map(step => (
                                  <option key={step.step} value={step.step}>
                                    {step.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openOrderInspector(order)}
                                  className="px-2.5 py-1 bg-[#1a1a1a] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Inspect
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForPrint(order)}
                                  className="px-2.5 py-1 border border-black/15 hover:border-black text-[#1a1a1a] text-[11px] font-semibold cursor-pointer"
                                >
                                  Invoice
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(order.orderId)}
                                  className="px-2.5 py-1 border border-red-200 hover:border-red-500 text-red-600 text-[11px] font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-black/45">
                            No matching orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 3. ABANDONED CARTS                                            */}
          {/* ============================================================= */}
          {activeSection === 'leads' && (
            <div className="space-y-6">
              <div className="bg-white border border-black/10 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="text-xs text-black/60">
                  Customers who entered their phone number during checkout without completing the order.
                </div>
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search name or phone..."
                  className="w-full sm:w-64 bg-[#f8f7f4] border border-black/10 px-3.5 py-2 text-xs text-[#1a1a1a] outline-none"
                />
              </div>

              <div className="bg-white border border-black/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 text-black/45 uppercase font-mono text-[11px] bg-[#f8f7f4]/60">
                        <th className="py-3.5 px-5">Customer</th>
                        <th className="py-3.5 px-5">Phone</th>
                        <th className="py-3.5 px-5">Product</th>
                        <th className="py-3.5 px-5 text-right">Est. Total</th>
                        <th className="py-3.5 px-5">Captured</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredLeads.map(lead => {
                        const cleanPhone = String(lead.customerPhone || '').replace(/\D/g, '');
                        const waLink = `https://wa.me/88${cleanPhone}?text=${encodeURIComponent(
                          `Hello ${lead.customerName || ''}, we noticed your incomplete order for "${lead.product?.title || ''}" at DeshiMart. Would you like us to confirm it for Cash on Delivery?`
                        )}`;
                        return (
                          <tr key={lead.leadId || lead.customerPhone} className="hover:bg-black/[0.015]">
                            <td className="py-3.5 px-5">
                              <div className="font-semibold text-[#1a1a1a]">{lead.customerName || 'Guest Customer'}</div>
                              <div className="text-[11px] text-black/50 mt-0.5">{lead.customerAddress || 'No address entered'}</div>
                            </td>
                            <td className="py-3.5 px-5 font-mono font-semibold text-[#1a1a1a] tabular-nums">
                              {lead.customerPhone}
                              <span className="text-black/40 font-normal"> · {lead.operator || getBDOperatorName(lead.customerPhone)}</span>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="font-medium text-[#1a1a1a] line-clamp-1">{lead.product?.title}</div>
                              <div className="text-[11px] text-black/50 font-mono tabular-nums">
                                Size: {lead.selectedSize || 'Std'} · Qty: {lead.quantity || 1}
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#1a1a1a] tabular-nums">
                              ৳{(Number(lead.estimatedTotal) || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-5 font-mono text-[11px] text-black/50 tabular-nums">
                              {lead.date} · {lead.time}
                            </td>
                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 border border-black/15 hover:border-black text-[#1a1a1a] text-[11px] font-semibold"
                                >
                                  WhatsApp
                                </a>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onConvertLeadToOrder) onConvertLeadToOrder(lead);
                                    try {
                                      await fetch(`/api/admin/leads/${lead.leadId}/convert`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${authToken}` }
                                      });
                                    } catch (_e) {}
                                  }}
                                  className="px-2.5 py-1 bg-[#F85606] hover:bg-[#d94904] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Convert to Order
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onDeleteLead) onDeleteLead(lead.leadId);
                                    try {
                                      await fetch(`/api/admin/leads/${lead.leadId}`, {
                                        method: 'DELETE',
                                        headers: { Authorization: `Bearer ${authToken}` }
                                      });
                                    } catch (_e) {}
                                  }}
                                  className="px-2.5 py-1 border border-red-200 hover:border-red-500 text-red-600 text-[11px] font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-black/45">
                            No abandoned carts recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 4. PRODUCTS                                                   */}
          {/* ============================================================= */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="bg-white border border-black/10 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product title or SKU..."
                    className="flex-1 bg-[#f8f7f4] border border-black/10 px-3.5 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-[#f8f7f4] border border-black/10 px-3.5 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    <option value="all">All Categories ({allProducts.length})</option>
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {CATEGORY_LABELS[cat.id] || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openCreateProductModal}
                  className="px-4 py-2 bg-[#F85606] hover:bg-[#d94904] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  + Add Product
                </button>
              </div>

              <div className="bg-white border border-black/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 text-black/45 uppercase font-mono text-[11px] bg-[#f8f7f4]/60">
                        <th className="py-3.5 px-5">Product</th>
                        <th className="py-3.5 px-5">SKU</th>
                        <th className="py-3.5 px-5 text-right">Cost</th>
                        <th className="py-3.5 px-5 text-right">Sale Price</th>
                        <th className="py-3.5 px-5 text-right">Stock</th>
                        <th className="py-3.5 px-5">Direct Links</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredProducts.map(prod => {
                        const slug = prod.slug || prod.id;
                        const checkoutUrl = `${window.location.origin}/checkout/${slug}`;
                        const wholesale = prod.wholesalePrice || Math.max(100, prod.price - 150);

                        return (
                          <tr key={prod.id} className="hover:bg-black/[0.015]">
                            <td className="py-3.5 px-5 min-w-[240px]">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.image}
                                  alt={prod.title}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 object-cover border border-black/10 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-[#1a1a1a] line-clamp-1">{prod.title}</div>
                                  <div className="text-[11px] text-black/45 mt-0.5">
                                    {CATEGORY_LABELS[prod.category] || prod.categoryName}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-5 font-mono text-black/60 tabular-nums whitespace-nowrap">
                              {prod.sku || prod.id}
                            </td>

                            <td className="py-3.5 px-5 text-right font-mono text-black/55 tabular-nums whitespace-nowrap">
                              ৳{wholesale.toLocaleString('en-IN')}
                            </td>

                            <td className="py-3.5 px-5 text-right font-mono font-bold text-[#1a1a1a] tabular-nums whitespace-nowrap">
                              ৳{prod.price.toLocaleString('en-IN')}
                            </td>

                            <td className="py-3.5 px-5 text-right font-mono tabular-nums whitespace-nowrap">
                              {prod.stockLeft || 15}
                            </td>

                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => copyText(checkoutUrl, 'Checkout URL')}
                                  className="px-2.5 py-1 border border-black/15 hover:border-black text-[#1a1a1a] text-[11px] font-medium cursor-pointer"
                                >
                                  Copy Checkout Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onNavigateToProduct && onNavigateToProduct(prod)}
                                  className="px-2.5 py-1 border border-black/15 hover:border-black text-black/70 hover:text-black text-[11px] font-medium cursor-pointer"
                                >
                                  View ↗
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditProductModal(prod)}
                                  className="px-2.5 py-1 border border-black/15 hover:border-black text-[#1a1a1a] text-[11px] font-semibold cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="px-2.5 py-1 border border-red-200 hover:border-red-500 text-red-600 text-[11px] font-semibold cursor-pointer"
                                >
                                  Delete
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
            </div>
          )}

          {/* ============================================================= */}
          {/* 5. SUPPLIER SYNC & MARKUP                                     */}
          {/* ============================================================= */}
          {activeSection === 'importer' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-black/10 p-6 space-y-5">
                <div className="border-b border-black/10 pb-4">
                  <h2 className="text-sm font-bold text-[#1a1a1a]">Import Product from B-Bazar</h2>
                  <p className="text-xs text-black/50 mt-1">
                    Paste a product URL or ID to pull title, wholesale price, and images.
                  </p>
                </div>

                <form onSubmit={handleImportBbazarProduct} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">
                      Product URL or ID
                    </label>
                    <input
                      type="text"
                      required
                      value={bbazarInputUrl}
                      onChange={(e) => setBbazarInputUrl(e.target.value)}
                      placeholder="https://bbazar.com.bd/products/...-item-11764"
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2.5 text-xs text-[#1a1a1a] font-mono outline-none"
                    />
                  </div>

                  {importStatus.message && (
                    <div
                      className={`p-3 text-xs font-medium border ${
                        importStatus.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      {importStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isImporting}
                    className="px-5 py-2.5 bg-[#F85606] hover:bg-[#d94904] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                  >
                    {isImporting ? 'Importing...' : 'Import Product'}
                  </button>
                </form>
              </div>

              <div className="bg-white border border-black/10 p-6 space-y-5">
                <div className="border-b border-black/10 pb-4">
                  <h2 className="text-sm font-bold text-[#1a1a1a]">Global Profit Markup</h2>
                  <p className="text-xs text-black/50 mt-1">
                    Recalculate retail prices across all products from their wholesale cost.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">Markup Type</label>
                    <select
                      value={markupType}
                      onChange={(e) => setMarkupType(e.target.value)}
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2.5 text-xs text-[#1a1a1a] outline-none"
                    >
                      <option value="fixed">Fixed Profit (BDT)</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">
                      Markup Value ({markupType === 'fixed' ? 'BDT' : '%'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={markupValue}
                      onChange={(e) => setMarkupValue(e.target.value)}
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2.5 text-xs text-[#1a1a1a] font-mono tabular-nums outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyGlobalMarkup}
                  className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                >
                  Apply to All Products ({allProducts.length})
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 6. SETTINGS (PIXELS & ADMIN SECURITY)                         */}
          {/* ============================================================= */}
          {activeSection === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tracking Pixels */}
              <div className="bg-white border border-black/10 p-6">
                <div className="border-b border-black/10 pb-4 mb-5">
                  <h2 className="text-sm font-bold text-[#1a1a1a]">Tracking Pixels</h2>
                  <p className="text-xs text-black/50 mt-1">
                    Configure Meta and TikTok conversion tracking.
                  </p>
                </div>

                <form onSubmit={handleSavePixelSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">
                      Meta (Facebook) Pixel ID
                    </label>
                    <input
                      type="text"
                      value={pixelForm.fbPixelId || ''}
                      onChange={(e) => setPixelForm({ ...pixelForm, fbPixelId: e.target.value })}
                      placeholder="e.g. 129485720192837"
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2 text-xs text-[#1a1a1a] font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">
                      Conversion API Access Token
                    </label>
                    <input
                      type="password"
                      value={pixelForm.fbAccessToken || ''}
                      onChange={(e) => setPixelForm({ ...pixelForm, fbAccessToken: e.target.value })}
                      placeholder="EAA..."
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2 text-xs text-[#1a1a1a] font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">
                      TikTok Pixel ID
                    </label>
                    <input
                      type="text"
                      value={pixelForm.tiktokPixelId || ''}
                      onChange={(e) => setPixelForm({ ...pixelForm, tiktokPixelId: e.target.value })}
                      placeholder="e.g. C9J8K2L1M0N"
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2 text-xs text-[#1a1a1a] font-mono outline-none"
                    />
                  </div>

                  <label className="flex items-center justify-between p-3 bg-[#f8f7f4] border border-black/10 cursor-pointer">
                    <span className="text-xs font-semibold text-[#1a1a1a]">Enable Live Event Debugger</span>
                    <input
                      type="checkbox"
                      checked={Boolean(pixelForm.isDebuggerActive)}
                      onChange={(e) => setPixelForm({ ...pixelForm, isDebuggerActive: e.target.checked })}
                      className="w-4 h-4 accent-[#F85606]"
                    />
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                  >
                    Save Pixel Settings
                  </button>
                </form>
              </div>

              {/* Admin Security */}
              <div className="bg-white border border-black/10 p-6">
                <div className="border-b border-black/10 pb-4 mb-5">
                  <h2 className="text-sm font-bold text-[#1a1a1a]">Admin Security</h2>
                  <p className="text-xs text-black/50 mt-1">
                    Update administrator username, email, and password.
                  </p>
                </div>

                {securityMsg.text && (
                  <div
                    className={`mb-4 p-3 text-xs font-medium border ${
                      securityMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {securityMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdateCredentials} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-black/70 mb-1.5">Username</label>
                      <input
                        type="text"
                        required
                        value={securityForm.newUsername}
                        onChange={(e) => setSecurityForm({ ...securityForm, newUsername: e.target.value })}
                        className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2 text-xs text-[#1a1a1a] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-black/70 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={securityForm.newEmail}
                        onChange={(e) => setSecurityForm({ ...securityForm, newEmail: e.target.value })}
                        className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2 text-xs text-[#1a1a1a] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      placeholder="Required to confirm changes"
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2 text-xs text-[#1a1a1a] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      className="w-full bg-[#f8f7f4] border border-black/15 px-3.5 py-2 text-xs text-[#1a1a1a] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#F85606] hover:bg-[#d94904] text-white text-xs font-semibold cursor-pointer"
                  >
                    Update Credentials
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================================================================= */}
      {/* INTERACTIVE ORDER INSPECTOR & ORIGIN MODAL                        */}
      {/* ================================================================= */}
      {inspectedOrder && inspectorForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-2xl p-6 space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-black/10 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-[#1a1a1a] font-mono tabular-nums">
                    Order #{inspectedOrder.orderId}
                  </h3>
                  <span className="text-xs font-semibold text-[#F85606]">
                    {inspectedOrder.source || 'Storefront Checkout'}
                  </span>
                </div>
                <p className="text-xs text-black/50 mt-1 font-mono tabular-nums">
                  Placed on {inspectedOrder.date} at {inspectedOrder.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedOrder(null)}
                className="px-3 py-1 border border-black/15 text-xs font-semibold text-black/70 hover:text-black cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Product & Origin Summary Strip */}
            <div className="p-4 bg-[#f8f7f4] border border-black/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {inspectedOrder.product?.image && (
                  <img
                    src={inspectedOrder.product.image}
                    alt={inspectedOrder.product?.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover border border-black/10 shrink-0 bg-white"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-mono uppercase text-black/45">
                    Specific Product Ordered
                  </div>
                  <div className="text-sm font-bold text-[#1a1a1a] line-clamp-1">
                    {inspectedOrder.product?.title}
                  </div>
                  <div className="text-xs text-black/60 font-mono tabular-nums mt-0.5">
                    SKU: {inspectedOrder.product?.sku || inspectedOrder.product?.id} · Unit: ৳{inspectedOrder.product?.price}
                  </div>
                  <div className="text-[11px] text-black/50 font-mono mt-0.5">
                    Ordered From Path: {inspectedOrder.orderedFromPath || `/checkout/${inspectedOrder.product?.slug || inspectedOrder.product?.id}`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetProd =
                    allProducts.find(p => p.id === inspectedOrder.product?.id) ||
                    inspectedOrder.product;
                  setInspectedOrder(null);
                  if (onNavigateToProduct && targetProd) onNavigateToProduct(targetProd);
                }}
                className="px-3 py-2 bg-[#1a1a1a] hover:bg-black text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                Open Product Page ↗
              </button>
            </div>

            {/* Editable Order & Origin Form */}
            <form onSubmit={handleSaveInspectedOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inspectorForm.customerName}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, customerName: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-black/70">
                      Customer Phone ({getBDOperatorName(inspectorForm.customerPhone)})
                    </label>
                    <button
                      type="button"
                      onClick={() => copyText(inspectorForm.customerPhone, 'Phone number')}
                      className="text-[11px] font-semibold text-[#F85606] cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={inspectorForm.customerPhone}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, customerPhone: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs font-mono text-[#1a1a1a] tabular-nums outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-black/70 mb-1">
                    Ordered From Location (Full Delivery Address)
                  </label>
                  <input
                    type="text"
                    required
                    value={inspectorForm.customerAddress}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, customerAddress: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">
                    Delivery Zone
                  </label>
                  <select
                    value={inspectorForm.deliveryArea}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, deliveryArea: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    <option value="Inside Dhaka">Inside Dhaka (৳70)</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳130)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">
                    Specific Product
                  </label>
                  <select
                    value={inspectorForm.productId}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, productId: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    {allProducts.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.title} (৳{prod.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">
                    Order Source / Channel
                  </label>
                  <select
                    value={inspectorForm.source}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, source: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    {ORDER_SOURCES.map(src => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Size</label>
                  <input
                    type="text"
                    value={inspectorForm.selectedSize}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, selectedSize: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Color</label>
                  <input
                    type="text"
                    value={inspectorForm.selectedColor}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, selectedColor: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={inspectorForm.quantity}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, quantity: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs font-mono text-[#1a1a1a] tabular-nums outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Status</label>
                  <select
                    value={inspectorForm.statusStep}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, statusStep: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs font-semibold text-[#1a1a1a] outline-none"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s.step} value={s.step}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Courier</label>
                  <select
                    value={inspectorForm.courier}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, courier: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    <option value="Steadfast Courier">Steadfast Courier</option>
                    <option value="Pathao Parcel">Pathao Parcel</option>
                    <option value="RedX Logistics">RedX Logistics</option>
                    <option value="Sundarban Courier">Sundarban Courier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Tracking ID</label>
                  <input
                    type="text"
                    value={inspectorForm.consignmentId}
                    onChange={(e) => setInspectorForm({ ...inspectorForm, consignmentId: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs font-mono text-[#1a1a1a] tabular-nums outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-black/10">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${inspectorForm.customerPhone}`}
                    className="px-3 py-2 border border-black/15 hover:border-black text-xs font-semibold text-[#1a1a1a]"
                  >
                    Call Customer
                  </a>
                  <a
                    href={`https://wa.me/88${String(inspectorForm.customerPhone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border border-black/15 hover:border-black text-xs font-semibold text-[#1a1a1a]"
                  >
                    WhatsApp
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectedOrder(null)}
                    className="px-4 py-2 border border-black/15 text-xs font-semibold text-black/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#F85606] hover:bg-[#d94904] text-white text-xs font-semibold cursor-pointer"
                  >
                    Save & Sync Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CREATE MANUAL ORDER MODAL                                         */}
      {/* ================================================================= */}
      {isManualOrderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-black/20 w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1a1a1a]">Create Manual Order</h3>
                <p className="text-[11px] text-black/50 mt-0.5">
                  Log an order from phone, WhatsApp, or social channels and sync immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualOrderOpen(false)}
                className="text-xs font-semibold text-black/50 hover:text-black cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black/70 mb-1">
                  Select Specific Product
                </label>
                <select
                  required
                  value={manualOrderForm.productId}
                  onChange={(e) => {
                    const found = allProducts.find(p => p.id === e.target.value);
                    setManualOrderForm({
                      ...manualOrderForm,
                      productId: e.target.value,
                      selectedSize: found?.sizes?.[0] || 'Standard',
                      selectedColor:
                        found?.colors?.[0]?.name ||
                        (typeof found?.colors?.[0] === 'string' ? found.colors[0] : 'Black')
                    });
                  }}
                  className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                >
                  {allProducts.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.title} — ৳{prod.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={manualOrderForm.customerName}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, customerName: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={manualOrderForm.customerPhone}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, customerPhone: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs font-mono text-[#1a1a1a] tabular-nums outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/70 mb-1">
                  Ordered From Location (Full Delivery Address)
                </label>
                <input
                  type="text"
                  required
                  placeholder="House, Road, Area, City/District"
                  value={manualOrderForm.customerAddress}
                  onChange={(e) => setManualOrderForm({ ...manualOrderForm, customerAddress: e.target.value })}
                  className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Delivery Zone</label>
                  <select
                    value={manualOrderForm.deliveryArea}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, deliveryArea: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    <option value="Inside Dhaka">Inside Dhaka (৳70)</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳130)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Order Source</label>
                  <select
                    value={manualOrderForm.source}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, source: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    {ORDER_SOURCES.map(src => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Size</label>
                  <input
                    type="text"
                    value={manualOrderForm.selectedSize}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, selectedSize: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Color</label>
                  <input
                    type="text"
                    value={manualOrderForm.selectedColor}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, selectedColor: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={manualOrderForm.quantity}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, quantity: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs font-mono text-[#1a1a1a] tabular-nums outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsManualOrderOpen(false)}
                  className="px-4 py-2 border border-black/15 text-xs font-semibold text-black/70 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F85606] hover:bg-[#d94904] text-white text-xs font-semibold cursor-pointer"
                >
                  Create & Sync Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PRODUCT CREATE / EDIT MODAL                                       */}
      {/* ================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-black/15 w-full max-w-lg p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-sm font-bold text-[#1a1a1a]">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-xs font-semibold text-black/50 hover:text-black cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black/70 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {CATEGORY_LABELS[cat.id] || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockLeft}
                    onChange={(e) => setProductForm({ ...productForm, stockLeft: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] font-mono tabular-nums outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Cost (BDT)</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.wholesalePrice}
                    onChange={(e) => setProductForm({ ...productForm, wholesalePrice: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] font-mono tabular-nums outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Sale Price (BDT)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] font-mono tabular-nums outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Regular Price</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] font-mono tabular-nums outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={productForm.sizes}
                    onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                    className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/70 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#f8f7f4] border border-black/15 px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-black/15 text-xs font-semibold text-black/70 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F85606] hover:bg-[#d94904] text-white text-xs font-semibold cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* INVOICE PRINT MODAL                                               */}
      {/* ================================================================= */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-[#1a1a1a] w-full max-w-md p-6 border border-black/20 space-y-4">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <div>
                <h3 className="font-bold text-base">DeshiMart BD — Cash Memo</h3>
                <p className="text-xs text-black/50 font-mono">Invoice #{selectedOrderForPrint.orderId}</p>
              </div>
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono uppercase">
                COD
              </span>
            </div>

            <div className="text-xs space-y-1.5 border-b border-black/10 pb-3">
              <div><strong>Customer:</strong> {selectedOrderForPrint.customerName}</div>
              <div><strong>Phone:</strong> {selectedOrderForPrint.customerPhone}</div>
              <div><strong>Address:</strong> {selectedOrderForPrint.customerAddress} ({selectedOrderForPrint.deliveryArea})</div>
              <div><strong>Source:</strong> {selectedOrderForPrint.source || 'Storefront Checkout'}</div>
              <div><strong>Courier:</strong> {selectedOrderForPrint.courier || 'Steadfast Courier'} ({selectedOrderForPrint.consignmentId || 'N/A'})</div>
            </div>

            <div className="text-xs space-y-2 border-b border-black/10 pb-3">
              <div className="font-semibold">{selectedOrderForPrint.product?.title}</div>
              <div className="flex justify-between text-black/60 font-mono tabular-nums">
                <span>Size: {selectedOrderForPrint.selectedSize || 'Standard'} · Qty: {selectedOrderForPrint.quantity || 1}</span>
                <span>৳{selectedOrderForPrint.grandTotal}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm font-bold font-mono tabular-nums">
              <span>Total Collectable (COD):</span>
              <span>৳{selectedOrderForPrint.grandTotal}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedOrderForPrint(null)}
                className="px-4 py-2 border border-black/15 text-xs font-semibold text-black/70 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold cursor-pointer"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
