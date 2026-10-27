// api/index.js — Vercel Serverless Function Handler for /api/*
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TMP_DB_PATH = '/tmp/deshimart-store-db.json';
const REPO_DB_PATH = path.join(process.cwd(), 'data', 'store-db.json');
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'deshimart_hmac_secret_2026';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes rate-limit window
const MAX_LOGIN_ATTEMPTS = 5;

const loginAttempts = new Map();

function hashPassword(password, salt = 'deshimart_salt_2026') {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function safeCompareHex(a, b) {
  try {
    const bufA = Buffer.from(String(a), 'hex');
    const bufB = Buffer.from(String(b), 'hex');
    if (bufA.length !== bufB.length || bufA.length === 0) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (_e) {
    return false;
  }
}

function sanitizeText(val, maxLen = 300) {
  if (typeof val !== 'string') return '';
  return val.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function createSignedToken(username) {
  const payload = `${username}.${Date.now()}.${crypto.randomBytes(8).toString('hex')}`;
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySignedToken(token, revokedTokens = {}) {
  if (!token || typeof token !== 'string') return false;
  if (revokedTokens[token]) return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [username, timestampStr, nonce, sig] = parts;
  const payload = `${username}.${timestampStr}.${nonce}`;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  if (!safeCompareHex(sig, expectedSig)) return false;
  const createdAt = Number(timestampStr);
  if (!createdAt || Date.now() - createdAt > SESSION_TTL_MS) return false;
  return true;
}

function getDefaultDb() {
  try {
    if (fs.existsSync(REPO_DB_PATH)) {
      const raw = fs.readFileSync(REPO_DB_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (_e) {
    // Fallback below
  }

  return {
    adminUser: {
      username: 'admin',
      email: 'admin@deshimart.com',
      passwordHash: hashPassword('admin123'),
      updatedAt: new Date().toISOString()
    },
    revokedTokens: {},
    orders: [
      {
        orderId: 'INV-2026-8492',
        customerName: 'Tanvir Ahmed',
        customerPhone: '01912345678',
        operator: 'Banglalink',
        customerAddress: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
        deliveryArea: 'Inside Dhaka',
        deliveryFee: 70,
        product: {
          id: 'bbz-11762',
          bbazarId: 11762,
          sku: 'BBZ-11762',
          title: 'Series 11 (SIM-1000) 5G Smart Watch with Camera & SIM Support',
          slug: 'series-11-sim-1000-5g-smart-watch-with-camera-bbz11762',
          image: 'https://bbazar.com.bd/backend/product/0BMXawcFgOCoHb49jFksdrQza2lxTytRozRWaxZr.jpg',
          price: 2050,
          originalPrice: 3000
        },
        selectedSize: 'Standard',
        selectedColor: 'Black',
        quantity: 1,
        grandTotal: 2120,
        date: 'Oct 26, 2026',
        time: '08:30 PM',
        statusStep: 3,
        status: 'In Courier',
        courier: 'Steadfast Courier',
        consignmentId: 'STF-782910',
        source: 'Storefront Checkout',
        orderedFromPath: '/checkout/series-11-sim-1000-5g-smart-watch-with-camera-bbz11762',
        productPagePath: '/product/series-11-sim-1000-5g-smart-watch-with-camera-bbz11762',
        timestamp: Date.now() - 7200000
      },
      {
        orderId: 'INV-2026-5120',
        customerName: 'Rakibul Islam',
        customerPhone: '01712345670',
        operator: 'Grameenphone',
        customerAddress: 'Town Hall More, Mymensingh Sadar',
        deliveryArea: 'Outside Dhaka',
        deliveryFee: 130,
        product: {
          id: 'bbz-11764',
          bbazarId: 11764,
          sku: 'BBZ-11764',
          title: 'Hoco J121A 20000mAh Power Bank – 22.5W Fast Charging & PD 20W with LED Digital Display',
          slug: 'hoco-j121a-20000mah-power-bank-225w-fast-char-bbz11764',
          image: 'https://bbazar.com.bd/backend/product/IL7qtGmgb1yQ4KnzGTBQwx7Poaro2tpswlcXvXfr.jpg',
          price: 1775,
          originalPrice: 2500
        },
        selectedSize: 'Standard',
        selectedColor: 'Black',
        quantity: 1,
        grandTotal: 1905,
        date: 'Oct 26, 2026',
        time: '04:15 PM',
        statusStep: 4,
        status: 'Out for Delivery',
        courier: 'Steadfast Courier',
        consignmentId: 'STF-654128',
        source: 'Storefront Checkout',
        orderedFromPath: '/checkout/hoco-j121a-20000mah-power-bank-225w-fast-char-bbz11764',
        productPagePath: '/product/hoco-j121a-20000mah-power-bank-225w-fast-char-bbz11764',
        timestamp: Date.now() - 14400000
      }
    ],
    abandonedLeads: [
      {
        leadId: 'LEAD-01823456789-bbz-102',
        customerName: 'Mehjabin Chowdhury',
        customerPhone: '01823456789',
        customerAddress: 'House #15, GEC More, Chattogram',
        operator: 'Robi',
        product: {
          id: 'bbz-11762',
          bbazarId: 11762,
          sku: 'BBZ-11762',
          title: 'Series 11 (SIM-1000) 5G Smart Watch with Camera & SIM Support',
          slug: 'series-11-sim-1000-5g-smart-watch-with-camera-bbz11762',
          image: 'https://bbazar.com.bd/backend/product/0BMXawcFgOCoHb49jFksdrQza2lxTytRozRWaxZr.jpg',
          price: 2050,
          originalPrice: 3000
        },
        selectedSize: 'Standard',
        selectedColor: 'Black',
        quantity: 1,
        hasOrderBump: false,
        estimatedTotal: 2120,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        date: 'Oct 26, 2026',
        time: '07:15 PM',
        status: 'Abandoned',
        source: 'Storefront Checkout'
      }
    ],
    customProducts: null,
    pixelConfig: {
      fbPixelId: '',
      fbAccessToken: '',
      tiktokPixelId: '',
      isDebuggerActive: false
    }
  };
}

function readDb() {
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      return { ...getDefaultDb(), ...JSON.parse(fs.readFileSync(TMP_DB_PATH, 'utf8')) };
    }
    const initial = getDefaultDb();
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  } catch (_e) {
    return getDefaultDb();
  }
}

function writeDb(db) {
  try {
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (_e) {
    // Ignore read-only fs errors
  }
}

export default function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';

  // Security headers on all API responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (pathname.startsWith('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  const db = readDb();

  // Helper to check auth
  const isAuthorized = () => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    return verifySignedToken(token, db.revokedTokens || {});
  };

  // 1. Public Store Bootstrap (Never exposes orders, leads, or secret tokens)
  if (pathname === '/api/store/bootstrap' && method === 'GET') {
    return res.status(200).json({
      customProducts: db.customProducts,
      pixelConfig: {
        fbPixelId: db.pixelConfig?.fbPixelId || '',
        tiktokPixelId: db.pixelConfig?.tiktokPixelId || '',
        isDebuggerActive: Boolean(db.pixelConfig?.isDebuggerActive)
      }
    });
  }

  // 2. Public Create Order
  if (pathname === '/api/store/orders' && method === 'POST') {
    const newOrder = req.body || {};
    if (!newOrder.customerPhone) {
      return res.status(400).json({ error: 'Invalid order details.' });
    }
    const orderId = sanitizeText(newOrder.orderId, 40) || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const savedOrder = {
      ...newOrder,
      orderId,
      customerName: sanitizeText(newOrder.customerName, 120) || 'Customer',
      customerPhone: sanitizeText(newOrder.customerPhone, 30),
      customerAddress: sanitizeText(newOrder.customerAddress, 300),
      timestamp: Date.now()
    };
    db.orders = [savedOrder, ...(db.orders || []).filter(o => o.orderId !== orderId)];
    db.abandonedLeads = (db.abandonedLeads || []).filter(l => l.customerPhone !== savedOrder.customerPhone);
    writeDb(db);
    return res.status(201).json({ success: true, order: savedOrder });
  }

  // 2b. Public Get Single Order by ID (for Thank You page) & Upsell
  if (pathname.startsWith('/api/store/orders/') && pathname.endsWith('/upsell') && method === 'POST') {
    const orderId = decodeURIComponent(pathname.replace('/api/store/orders/', '').replace(/\/upsell$/, ''));
    const { upsellItem } = req.body || {};
    if (!upsellItem || typeof upsellItem !== 'object') {
      return res.status(400).json({ error: 'Invalid upsell item.' });
    }
    let updatedOrder = null;
    db.orders = (db.orders || []).map(o => {
      if (o.orderId === orderId) {
        const existingUpsells = o.upsellItems || [];
        const updatedUpsells = [...existingUpsells, upsellItem];
        const additionalPrice = Number(upsellItem?.vipPrice || upsellItem?.price || 0);
        updatedOrder = {
          ...o,
          upsellItems: updatedUpsells,
          grandTotal: (Number(o.grandTotal) || 0) + additionalPrice
        };
        return updatedOrder;
      }
      return o;
    });
    writeDb(db);
    return res.status(200).json({ success: true, order: updatedOrder });
  }

  if (pathname.startsWith('/api/store/orders/') && method === 'GET') {
    const orderId = decodeURIComponent(pathname.replace('/api/store/orders/', ''));
    const found = (db.orders || []).find(o => o.orderId === orderId);
    if (!found) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.status(200).json({ order: found });
  }

  // 3. Public Save Abandoned Lead
  if (pathname === '/api/store/leads' && method === 'POST') {
    const draftLead = req.body || {};
    if (!draftLead.customerPhone) {
      return res.status(400).json({ error: 'Invalid lead data.' });
    }
    const sanitizedLead = {
      ...draftLead,
      customerName: sanitizeText(draftLead.customerName, 120),
      customerPhone: sanitizeText(draftLead.customerPhone, 30),
      customerAddress: sanitizeText(draftLead.customerAddress, 300)
    };
    const leads = db.abandonedLeads || [];
    const idx = leads.findIndex(l => l.customerPhone === sanitizedLead.customerPhone);
    if (idx >= 0) leads[idx] = { ...leads[idx], ...sanitizedLead };
    else leads.unshift(sanitizedLead);
    db.abandonedLeads = leads;
    writeDb(db);
    return res.status(200).json({ success: true });
  }

  // 4. Admin Login with Rate Limiting & Timing-Safe Hash Check
  if (pathname === '/api/admin/login' && method === 'POST') {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local');
    const now = Date.now();
    const record = loginAttempts.get(clientIp);

    if (record && record.lockedUntil > now) {
      const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Too many failed login attempts. Try again in ${waitMinutes} minute(s).`
      });
    }

    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }
    const cleanId = String(identifier).trim().toLowerCase();
    const validUser =
      cleanId === db.adminUser.username.toLowerCase() ||
      cleanId === db.adminUser.email.toLowerCase();
    const inputHash = hashPassword(String(password));
    const validPass = safeCompareHex(inputHash, db.adminUser.passwordHash);

    if (!validUser || !validPass) {
      const current = record && now - record.firstAttempt < LOGIN_WINDOW_MS
        ? { count: record.count + 1, firstAttempt: record.firstAttempt, lockedUntil: 0 }
        : { count: 1, firstAttempt: now, lockedUntil: 0 };

      if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.lockedUntil = now + LOGIN_WINDOW_MS;
      }
      loginAttempts.set(clientIp, current);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    loginAttempts.delete(clientIp);
    const token = createSignedToken(db.adminUser.username);
    return res.status(200).json({
      success: true,
      token,
      admin: {
        username: db.adminUser.username,
        email: db.adminUser.email
      }
    });
  }

  // 5. Admin Logout
  if (pathname === '/api/admin/logout' && method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const bodyToken = req.body?.token ? String(req.body.token).trim() : '';
    const token = headerToken || bodyToken;
    if (token) {
      db.revokedTokens = db.revokedTokens || {};
      db.revokedTokens[token] = Date.now();
      writeDb(db);
    }
    return res.status(200).json({ success: true });
  }

  // Require Admin Auth for remaining /api/admin/* routes
  if (pathname.startsWith('/api/admin/')) {
    if (!isAuthorized()) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    if (pathname === '/api/admin/verify' && method === 'GET') {
      return res.status(200).json({
        authenticated: true,
        admin: {
          username: db.adminUser.username,
          email: db.adminUser.email
        }
      });
    }

    if (pathname === '/api/admin/bootstrap' && method === 'GET') {
      return res.status(200).json({
        orders: db.orders || [],
        abandonedLeads: db.abandonedLeads || [],
        customProducts: db.customProducts,
        pixelConfig: db.pixelConfig,
        admin: {
          username: db.adminUser.username,
          email: db.adminUser.email
        }
      });
    }

    if (pathname === '/api/admin/orders' && method === 'POST') {
      const manualOrder = req.body || {};
      if (!manualOrder.customerName || !manualOrder.customerPhone) {
        return res.status(400).json({ error: 'Customer name and phone are required.' });
      }
      const orderId = sanitizeText(manualOrder.orderId, 40) || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const savedOrder = {
        ...manualOrder,
        orderId,
        customerName: sanitizeText(manualOrder.customerName, 120),
        customerPhone: sanitizeText(manualOrder.customerPhone, 30),
        customerAddress: sanitizeText(manualOrder.customerAddress, 300),
        timestamp: Date.now()
      };
      db.orders = [savedOrder, ...(db.orders || []).filter(o => o.orderId !== orderId)];
      db.abandonedLeads = (db.abandonedLeads || []).filter(l => l.customerPhone !== savedOrder.customerPhone);
      writeDb(db);
      return res.status(201).json({ success: true, order: savedOrder, orders: db.orders });
    }

    if (pathname.startsWith('/api/admin/orders/') && method === 'PATCH') {
      const orderId = decodeURIComponent(pathname.replace('/api/admin/orders/', ''));
      const updates = req.body || {};
      let updatedOrder = null;
      db.orders = (db.orders || []).map(o => {
        if (o.orderId === orderId) {
          updatedOrder = { ...o, ...updates };
          return updatedOrder;
        }
        return o;
      });
      writeDb(db);
      return res.status(200).json({ success: true, order: updatedOrder, orders: db.orders });
    }

    if (pathname.startsWith('/api/admin/orders/') && method === 'DELETE') {
      const orderId = decodeURIComponent(pathname.replace('/api/admin/orders/', ''));
      db.orders = (db.orders || []).filter(o => o.orderId !== orderId);
      writeDb(db);
      return res.status(200).json({ success: true, orders: db.orders });
    }

    if (pathname.startsWith('/api/admin/leads/') && pathname.endsWith('/convert') && method === 'POST') {
      const leadId = decodeURIComponent(pathname.replace('/api/admin/leads/', '').replace(/\/convert$/, ''));
      const lead = (db.abandonedLeads || []).find(l => l.leadId === leadId);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found.' });
      }
      const now = new Date();
      const orderId = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const formattedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const convertedOrder = {
        orderId,
        customerName: lead.customerName || 'Customer',
        customerPhone: lead.customerPhone,
        customerAddress: lead.customerAddress || 'Confirmed via phone call',
        operator: lead.operator || 'BD Mobile',
        deliveryArea: 'Inside Dhaka',
        deliveryFee: 70,
        product: lead.product,
        selectedSize: lead.selectedSize || 'Standard',
        selectedColor: lead.selectedColor || 'Standard',
        quantity: lead.quantity || 1,
        hasOrderBump: false,
        grandTotal: lead.estimatedTotal || ((lead.product?.price || 0) * (lead.quantity || 1) + 70),
        date: formattedDate,
        time: formattedTime,
        statusStep: 1,
        status: 'Pending',
        courier: 'Steadfast Courier',
        consignmentId: `STF-${Math.floor(100000 + Math.random() * 900000)}`,
        source: 'Recovered Cart',
        orderedFromPath: `/checkout/${lead.product?.slug || lead.product?.id || ''}`,
        productPagePath: `/product/${lead.product?.slug || lead.product?.id || ''}`,
        timestamp: Date.now()
      };
      db.orders = [convertedOrder, ...(db.orders || [])];
      db.abandonedLeads = (db.abandonedLeads || []).filter(
        l => l.leadId !== leadId && l.customerPhone !== lead.customerPhone
      );
      writeDb(db);
      return res.status(200).json({
        success: true,
        order: convertedOrder,
        orders: db.orders,
        abandonedLeads: db.abandonedLeads
      });
    }

    if (pathname.startsWith('/api/admin/leads/') && method === 'DELETE') {
      const leadId = decodeURIComponent(pathname.replace('/api/admin/leads/', ''));
      db.abandonedLeads = (db.abandonedLeads || []).filter(l => l.leadId !== leadId);
      writeDb(db);
      return res.status(200).json({ success: true, abandonedLeads: db.abandonedLeads });
    }

    if (pathname === '/api/admin/products' && method === 'PUT') {
      const { products } = req.body || {};
      if (Array.isArray(products)) {
        db.customProducts = products;
        writeDb(db);
      }
      return res.status(200).json({ success: true, products: db.customProducts });
    }

    if (pathname === '/api/admin/settings' && method === 'PUT') {
      const { pixelConfig } = req.body || {};
      db.pixelConfig = { ...db.pixelConfig, ...(pixelConfig || {}) };
      writeDb(db);
      return res.status(200).json({ success: true, pixelConfig: db.pixelConfig });
    }

    if (pathname === '/api/admin/credentials' && method === 'PUT') {
      const { currentPassword, newUsername, newEmail, newPassword } = req.body || {};
      if (!currentPassword || !safeCompareHex(hashPassword(String(currentPassword)), db.adminUser.passwordHash)) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      if (newUsername && String(newUsername).trim().length >= 3) {
        db.adminUser.username = sanitizeText(newUsername, 50);
      }
      if (newEmail && String(newEmail).trim().includes('@')) {
        db.adminUser.email = sanitizeText(newEmail, 100);
      }
      if (newPassword && String(newPassword).length >= 6) {
        db.adminUser.passwordHash = hashPassword(String(newPassword));
      }
      writeDb(db);
      return res.status(200).json({
        success: true,
        admin: {
          username: db.adminUser.username,
          email: db.adminUser.email
        }
      });
    }
  }

  return res.status(404).json({ error: 'Endpoint not found.' });
}
