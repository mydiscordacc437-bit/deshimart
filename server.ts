// server.ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'store-db.json');
const INITIAL_PRODUCTS_PATH = path.join(__dirname, 'src', 'data', 'products.json');

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours max in-memory session lifetime

function hashPassword(password: string, salt = 'deshimart_salt_2026'): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function loadInitialProducts(): any[] {
  try {
    if (fs.existsSync(INITIAL_PRODUCTS_PATH)) {
      const raw = fs.readFileSync(INITIAL_PRODUCTS_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to read initial products.json:', err);
  }
  return [];
}

interface StoreDatabase {
  adminUser: {
    username: string;
    email: string;
    passwordHash: string;
    updatedAt: string;
  };
  sessions: Record<string, { username: string; createdAt: number }>;
  orders: any[];
  abandonedLeads: any[];
  customProducts: any[] | null;
  pixelConfig: {
    fbPixelId: string;
    fbAccessToken: string;
    tiktokPixelId: string;
    isDebuggerActive: boolean;
  };
}

function getDefaultDb(): StoreDatabase {
  const initialProds = loadInitialProducts();
  const sampleProd1 = initialProds[0] || {
    id: 'bbz-11762',
    slug: 'series-11-sim-1000-5g-smart-watch-with-camera-bbz11762',
    sku: 'BBZ-11762',
    title: 'Series 11 (SIM-1000) 5G Smart Watch with Camera & SIM Support',
    price: 2050,
    image: 'https://bbazar.com.bd/backend/product/0BMXawcFgOCoHb49jFksdrQza2lxTytRozRWaxZr.jpg'
  };
  const sampleProd0 = initialProds[1] || sampleProd1;

  return {
    adminUser: {
      username: 'admin',
      email: 'admin@deshimart.com',
      passwordHash: hashPassword('admin123'),
      updatedAt: new Date().toISOString()
    },
    sessions: {},
    orders: [
      {
        orderId: 'INV-2026-8492',
        customerName: 'Tanvir Ahmed',
        customerPhone: '01912345678',
        operator: 'Banglalink',
        customerAddress: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
        deliveryArea: 'Inside Dhaka',
        deliveryFee: 70,
        product: sampleProd1,
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
        orderedFromPath: `/checkout/${sampleProd1.slug || sampleProd1.id}`,
        productPagePath: `/product/${sampleProd1.slug || sampleProd1.id}`,
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
        product: sampleProd0,
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
        orderedFromPath: `/checkout/${sampleProd0.slug || sampleProd0.id}`,
        productPagePath: `/product/${sampleProd0.slug || sampleProd0.id}`,
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
        product: sampleProd1,
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

function readDb(): StoreDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      const initial = getDefaultDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return { ...getDefaultDb(), ...parsed };
  } catch (err) {
    console.error('Error reading DB, using default:', err);
    return getDefaultDb();
  }
}

function writeDb(db: StoreDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Strict no-cache middleware for all /api/admin routes
function noCacheAdmin(_req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

// Middleware to verify Admin Bearer Token
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const db = readDb();
  const session = db.sessions?.[token];
  if (!session) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    delete db.sessions[token];
    writeDb(db);
    return res.status(401).json({ error: 'Session timed out. Please sign in again.' });
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api/admin', noCacheAdmin);

  // =========================================================================
  // 1. PUBLIC STOREFRONT API ROUTES (/api/store/*)
  // =========================================================================
  app.get('/api/store/bootstrap', (_req, res) => {
    const db = readDb();
    res.json({
      orders: db.orders || [],
      customProducts: db.customProducts,
      pixelConfig: db.pixelConfig
    });
  });

  app.post('/api/store/orders', (req, res) => {
    const newOrder = req.body;
    if (!newOrder || !newOrder.customerPhone) {
      return res.status(400).json({ error: 'Invalid order details.' });
    }
    const db = readDb();
    const orderId = newOrder.orderId || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const savedOrder = {
      ...newOrder,
      orderId,
      timestamp: Date.now()
    };
    db.orders = [savedOrder, ...(db.orders || [])];
    db.abandonedLeads = (db.abandonedLeads || []).filter(
      (l: any) => l.customerPhone !== newOrder.customerPhone
    );
    writeDb(db);
    res.status(201).json({ success: true, order: savedOrder });
  });

  app.post('/api/store/orders/:orderId/upsell', (req, res) => {
    const { orderId } = req.params;
    const { upsellItem } = req.body;
    const db = readDb();
    let updatedOrder = null;
    db.orders = (db.orders || []).map((o: any) => {
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
    res.json({ success: true, order: updatedOrder });
  });

  app.post('/api/store/leads', (req, res) => {
    const draftLead = req.body;
    if (!draftLead || !draftLead.customerPhone) {
      return res.status(400).json({ error: 'Invalid lead data.' });
    }
    const db = readDb();
    const leads = db.abandonedLeads || [];
    const existingIdx = leads.findIndex((l: any) => l.customerPhone === draftLead.customerPhone);
    if (existingIdx >= 0) {
      leads[existingIdx] = { ...leads[existingIdx], ...draftLead };
    } else {
      leads.unshift(draftLead);
    }
    db.abandonedLeads = leads;
    writeDb(db);
    res.json({ success: true });
  });

  app.get('/api/store/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const db = readDb();
    const found = (db.orders || []).find((o: any) => o.orderId === orderId);
    if (!found) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({ order: found });
  });

  // =========================================================================
  // 2. ADMIN AUTHENTICATION ROUTES (/api/admin/login, /verify, /logout)
  // =========================================================================
  app.post('/api/admin/login', (req, res) => {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const db = readDb();
    const cleanId = String(identifier).trim().toLowerCase();
    const validUser =
      cleanId === db.adminUser.username.toLowerCase() ||
      cleanId === db.adminUser.email.toLowerCase();

    const inputHash = hashPassword(String(password));
    if (!validUser || inputHash !== db.adminUser.passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    // Keep only fresh sessions
    const now = Date.now();
    const activeSessions: Record<string, { username: string; createdAt: number }> = {};
    for (const [k, v] of Object.entries(db.sessions || {})) {
      if (now - v.createdAt < SESSION_TTL_MS) {
        activeSessions[k] = v;
      }
    }
    activeSessions[token] = {
      username: db.adminUser.username,
      createdAt: now
    };
    db.sessions = activeSessions;
    writeDb(db);

    res.json({
      success: true,
      token,
      admin: {
        username: db.adminUser.username,
        email: db.adminUser.email
      }
    });
  });

  app.get('/api/admin/verify', requireAdminAuth, (_req, res) => {
    const db = readDb();
    res.json({
      authenticated: true,
      admin: {
        username: db.adminUser.username,
        email: db.adminUser.email
      }
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const bodyToken = req.body?.token ? String(req.body.token).trim() : '';
    const token = headerToken || bodyToken;

    if (token) {
      const db = readDb();
      if (db.sessions && db.sessions[token]) {
        delete db.sessions[token];
        writeDb(db);
      }
    }
    res.json({ success: true });
  });

  app.put('/api/admin/credentials', requireAdminAuth, (req, res) => {
    const { currentPassword, newUsername, newEmail, newPassword } = req.body || {};
    const db = readDb();

    if (!currentPassword || hashPassword(String(currentPassword)) !== db.adminUser.passwordHash) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (newUsername && String(newUsername).trim().length >= 3) {
      db.adminUser.username = String(newUsername).trim();
    }
    if (newEmail && String(newEmail).trim().includes('@')) {
      db.adminUser.email = String(newEmail).trim();
    }
    if (newPassword && String(newPassword).length >= 6) {
      db.adminUser.passwordHash = hashPassword(String(newPassword));
    }
    db.adminUser.updatedAt = new Date().toISOString();
    writeDb(db);

    res.json({
      success: true,
      admin: {
        username: db.adminUser.username,
        email: db.adminUser.email
      }
    });
  });

  // =========================================================================
  // 3. PROTECTED ADMIN MANAGEMENT ROUTES (/api/admin/*)
  // =========================================================================
  app.get('/api/admin/bootstrap', requireAdminAuth, (_req, res) => {
    const db = readDb();
    res.json({
      orders: db.orders || [],
      abandonedLeads: db.abandonedLeads || [],
      customProducts: db.customProducts,
      pixelConfig: db.pixelConfig,
      admin: {
        username: db.adminUser.username,
        email: db.adminUser.email
      }
    });
  });

  app.post('/api/admin/orders', requireAdminAuth, (req, res) => {
    const manualOrder = req.body || {};
    if (!manualOrder.customerName || !manualOrder.customerPhone) {
      return res.status(400).json({ error: 'Customer name and phone are required.' });
    }
    const db = readDb();
    const orderId = manualOrder.orderId || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const savedOrder = {
      ...manualOrder,
      orderId,
      timestamp: Date.now()
    };
    db.orders = [savedOrder, ...(db.orders || [])];
    db.abandonedLeads = (db.abandonedLeads || []).filter(
      (l: any) => l.customerPhone !== manualOrder.customerPhone
    );
    writeDb(db);
    res.status(201).json({ success: true, order: savedOrder, orders: db.orders });
  });

  app.patch('/api/admin/orders/:orderId', requireAdminAuth, (req, res) => {
    const { orderId } = req.params;
    const updates = req.body || {};
    const db = readDb();

    let updatedOrder = null;
    db.orders = (db.orders || []).map((o: any) => {
      if (o.orderId === orderId) {
        updatedOrder = { ...o, ...updates };
        return updatedOrder;
      }
      return o;
    });
    writeDb(db);
    res.json({ success: true, order: updatedOrder, orders: db.orders });
  });

  app.delete('/api/admin/orders/:orderId', requireAdminAuth, (req, res) => {
    const { orderId } = req.params;
    const db = readDb();
    db.orders = (db.orders || []).filter((o: any) => o.orderId !== orderId);
    writeDb(db);
    res.json({ success: true, orders: db.orders });
  });

  app.post('/api/admin/leads/:leadId/convert', requireAdminAuth, (req, res) => {
    const { leadId } = req.params;
    const db = readDb();
    const lead = (db.abandonedLeads || []).find((l: any) => l.leadId === leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const now = new Date();
    const orderId = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

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
      timestamp: Date.now()
    };

    db.orders = [convertedOrder, ...(db.orders || [])];
    db.abandonedLeads = (db.abandonedLeads || []).filter(
      (l: any) => l.leadId !== leadId && l.customerPhone !== lead.customerPhone
    );
    writeDb(db);

    res.json({
      success: true,
      order: convertedOrder,
      orders: db.orders,
      abandonedLeads: db.abandonedLeads
    });
  });

  app.delete('/api/admin/leads/:leadId', requireAdminAuth, (req, res) => {
    const { leadId } = req.params;
    const db = readDb();
    db.abandonedLeads = (db.abandonedLeads || []).filter((l: any) => l.leadId !== leadId);
    writeDb(db);
    res.json({ success: true, abandonedLeads: db.abandonedLeads });
  });

  app.put('/api/admin/products', requireAdminAuth, (req, res) => {
    const { products } = req.body || {};
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid product list.' });
    }
    const db = readDb();
    db.customProducts = products;
    writeDb(db);
    res.json({ success: true, products: db.customProducts });
  });

  app.put('/api/admin/settings', requireAdminAuth, (req, res) => {
    const { pixelConfig } = req.body || {};
    const db = readDb();
    db.pixelConfig = { ...db.pixelConfig, ...(pixelConfig || {}) };
    writeDb(db);
    res.json({ success: true, pixelConfig: db.pixelConfig });
  });

  // =========================================================================
  // 4. VITE DEV MIDDLEWARE / PRODUCTION STATIC ASSETS
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DeshiMart BD Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
