// src/utils/pixelManager.js
/**
 * Centralized Meta (Facebook) & TikTok Pixel Tracking Engine
 * 
 * Features:
 *   - Injects official Meta Pixel script when ID is configured in Admin
 *   - Auto-tracks:
 *       • PageView (on every route change)
 *       • ViewContent (on single product page & ad landing page)
 *       • InitiateCheckout (when clicking order button or entering checkout form)
 *       • Purchase (on order confirmation with eventID for deduplication)
 *   - Dispatches visual debugger notifications when Debugger is enabled in Admin
 */

const STORAGE_KEY = 'deshimart_pixel_config';

export function getPixelConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return {
    fbPixelId: '',
    tiktokPixelId: '',
    isDebuggerActive: false
  };
}

export function savePixelConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Re-initialize scripts if ID provided
    if (config.fbPixelId) {
      initMetaPixel(config.fbPixelId);
    }
  } catch (e) {
    console.error(e);
  }
}

// Dynamically inject official Meta Pixel SDK script
export function initMetaPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return;

  if (window.fbqInitialized === pixelId) return;

  if (!window.fbq) {
    /* eslint-disable */
    !(function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
  }

  try {
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    window.fbqInitialized = pixelId;
    console.log(`🎯 Meta Pixel initialized with ID: ${pixelId}`);
  } catch (err) {
    console.warn('Meta Pixel init error:', err);
  }
}

// Broadcast to Pixel Event Debugger Toast
function notifyDebugger(eventName, eventData, platform = 'Meta Pixel') {
  if (typeof window === 'undefined') return;
  const config = getPixelConfig();
  if (!config.isDebuggerActive) return;

  const detail = {
    eventName,
    eventData,
    platform,
    time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  window.dispatchEvent(new CustomEvent('pixel-debug-event', { detail }));
}

// Master Dispatcher for Pixel Events
export function firePixelEvent(eventName, data = {}, options = {}) {
  const config = getPixelConfig();

  // 1. Fire to Meta Pixel
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      if (options.eventId) {
        window.fbq('track', eventName, data, { eventID: options.eventId });
      } else {
        window.fbq('track', eventName, data);
      }
    } catch (err) {
      console.warn(`Meta Pixel ${eventName} error:`, err);
    }
  }

  // 2. Fire to TikTok Pixel if initialized
  if (typeof window !== 'undefined' && typeof window.ttq === 'object' && window.ttq.track) {
    try {
      window.ttq.track(eventName, data);
    } catch (err) {
      console.warn(`TikTok Pixel ${eventName} error:`, err);
    }
  }

  // 3. Notify Debugger Toast if enabled
  notifyDebugger(eventName, data);
}

// Standard Event: PageView
export function trackPageView(path = window.location.pathname) {
  firePixelEvent('PageView', { path });
}

// Standard Event: ViewContent (Product / Offer view)
export function trackViewContent(product) {
  if (!product) return;
  const sellingPrice = Number(product.sellingPrice || product.price || 0);

  firePixelEvent('ViewContent', {
    content_name: product.title,
    content_category: product.categoryName || 'General',
    content_ids: [String(product.id), String(product.sku || '')],
    content_type: 'product',
    value: sellingPrice,
    currency: 'BDT'
  });
}

// Standard Event: InitiateCheckout
export function trackInitiateCheckout(product, quantity = 1, totalValue = 0) {
  const value = totalValue || (product ? Number(product.price || 0) * quantity : 0);

  firePixelEvent('InitiateCheckout', {
    content_name: product?.title || 'Checkout',
    content_ids: product ? [String(product.id)] : [],
    content_type: 'product',
    num_items: quantity,
    value: value,
    currency: 'BDT'
  });
}

// Standard Event: Purchase (Order Confirmed)
export function trackPurchase(order) {
  if (!order) return;
  const eventId = `purch_${order.orderId}_${Date.now()}`;

  firePixelEvent('Purchase', {
    content_name: order.product?.title || 'Order Purchase',
    content_ids: [String(order.product?.id || ''), String(order.product?.sku || '')],
    content_type: 'product',
    value: Number(order.grandTotal || 0),
    currency: 'BDT',
    num_items: order.quantity || 1,
    order_id: order.orderId
  }, { eventId });
}
