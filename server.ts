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

// Active admin tokens in memory + persisted in DB
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
  const sampleProd1 = initialProds[1] || initialProds[0] || {
    id: 'bbz-101',
    title: 'মেনস ক্লাসিক ফর্মাল লেদার লোফার সু',
    price: 690,
    image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80'
  };
  const sampleProd0 = initialProds[0] || sampleProd1;

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
        customerName: 'তানভীর আহমেদ',
        customerPhone: '01912345678',
        operator: 'Banglalink',
        customerAddress: 'হাউজ ১২, রোড ৫, ধানমন্ডি, ঢাকা-১২০৫',
        deliveryArea: 'ঢাকার ভিতরে',
        deliveryFee: 70,
        product: sampleProd1,
        selectedSize: '41',
        selectedColor: 'Chocolate Brown (চকলেট ব্রাউন)',
        quantity: 1,
        grandTotal: 760,
        date: '১৭ অক্টোবর, ২০২৬',
        time: '০৮:৩০ PM',
        statusStep: 3,
        status: 'কুরিয়ারে দেওয়া হয়েছে (Handed to Courier)',
        courier: 'Steadfast Courier',
        consignmentId: 'STF-782910',
        source: 'Dedicated Checkout Page',
        timestamp: Date.now() - 7200000
      },
      {
        orderId: 'INV-2026-5120',
        customerName: 'রাকিবুল ইসলাম',
        customerPhone: '01712345670',
        operator: 'Grameenphone',
        customerAddress: 'টাউন হল মোড়, ময়মনসিংহ সদর',
        deliveryArea: 'ঢাকার বাইরে',
        deliveryFee: 130,
        product: sampleProd0,
        selectedSize: 'L (40)',
        selectedColor: 'Royal Blue (রয়েল ব্লু)',
        quantity: 1,
        grandTotal: 980,
        date: '১৭ অক্টোবর, ২০২৬',
        time: '০৪:১৫ PM',
        statusStep: 4,
        status: 'ডেলিভারির পথে (Out for Delivery)',
        courier: 'Steadfast Courier',
        consignmentId: 'STF-654128',
        source: 'Dedicated Checkout Page',
        timestamp: Date.now() - 14400000
      }
    ],
    abandonedLeads: [
      {
        leadId: 'LEAD-01823456789-bbz-102',
        customerName: 'মেহজাবিন চৌধুরী',
        customerPhone: '01823456789',
        customerAddress: 'বাড়ি #১৫, জিইসি মোড়, চট্টগ্রাম',
        operator: 'Robi',
        product: sampleProd1,
        selectedSize: '38',
        selectedColor: 'মারুন',
        quantity: 1,
        hasOrderBump: false,
        estimatedTotal: 1040,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        date: '১৭ অক্টোবর, ২০২৬',
        time: '০৭:১৫ PM',
        status: 'অসম্পূর্ণ (Abandoned Lead)',
        source: 'Dedicated Checkout Page'
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

// Middleware to verify Admin Bearer Token
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'অনুমতি নেই। অনুগ্রহ করে অ্যাডমিন লগইন করুন।' });
  }
  const db = readDb();
  const session = db.sessions?.[token];
  if (!session) {
    return res.status(401).json({ error: 'সেশন মেয়াদোত্তীর্ণ হয়েছে। পুনরায় লগইন করুন।' });
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // =========================================================================
  // 1. PUBLIC STOREFRONT API ROUTES (/api/store/*)
  // =========================================================================
  app.get('/api/store/bootstrap', (_req, res) => {
    const db = readDb();
    res.json({
      customProducts: db.customProducts,
      pixelConfig: db.pixelConfig
    });
  });

  // Create a new order from the dedicated checkout page
  app.post('/api/store/orders', (req, res) => {
    const newOrder = req.body;
    if (!newOrder || !newOrder.customerPhone) {
      return res.status(400).json({ error: 'অবৈধ অর্ডার তথ্য' });
    }
    const db = readDb();
    const orderId = newOrder.orderId || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const savedOrder = {
      ...newOrder,
      orderId,
      timestamp: Date.now()
    };
    db.orders = [savedOrder, ...(db.orders || [])];
    // Clean up matching abandoned lead by phone number
    db.abandonedLeads = (db.abandonedLeads || []).filter(
      (l: any) => l.customerPhone !== newOrder.customerPhone
    );
    writeDb(db);
    res.status(201).json({ success: true, order: savedOrder });
  });

  // Add post-purchase VIP upsell to an existing order
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

  // Save/update real-time abandoned checkout lead
  app.post('/api/store/leads', (req, res) => {
    const draftLead = req.body;
    if (!draftLead || !draftLead.customerPhone) {
      return res.status(400).json({ error: 'অবৈধ লিড তথ্য' });
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

  // Get single order for Thank You page verification
  app.get('/api/store/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const db = readDb();
    const found = (db.orders || []).find((o: any) => o.orderId === orderId);
    if (!found) {
      return res.status(404).json({ error: 'অর্ডার পাওয়া যায়নি' });
    }
    res.json({ order: found });
  });

  // =========================================================================
  // 2. ADMIN AUTHENTICATION ROUTES (/api/admin/login, /verify, /logout)
  // =========================================================================
  app.post('/api/admin/login', (req, res) => {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'ইউজারনেম/ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' });
    }

    const db = readDb();
    const cleanId = String(identifier).trim().toLowerCase();
    const validUser =
      cleanId === db.adminUser.username.toLowerCase() ||
      cleanId === db.adminUser.email.toLowerCase();

    const inputHash = hashPassword(String(password));
    if (!validUser || inputHash !== db.adminUser.passwordHash) {
      return res.status(401).json({ error: 'ভুল ইউজারনেম বা পাসওয়ার্ড! আবার চেষ্টা করুন।' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.sessions = db.sessions || {};
    db.sessions[token] = {
      username: db.adminUser.username,
      createdAt: Date.now()
    };
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
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
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
      return res.status(400).json({ error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
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

  // Update order status, courier, consignmentId, or notes
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

  // Delete an order
  app.delete('/api/admin/orders/:orderId', requireAdminAuth, (req, res) => {
    const { orderId } = req.params;
    const db = readDb();
    db.orders = (db.orders || []).filter((o: any) => o.orderId !== orderId);
    writeDb(db);
    res.json({ success: true, orders: db.orders });
  });

  // Convert abandoned lead to confirmed order
  app.post('/api/admin/leads/:leadId/convert', requireAdminAuth, (req, res) => {
    const { leadId } = req.params;
    const db = readDb();
    const lead = (db.abandonedLeads || []).find((l: any) => l.leadId === leadId);
    if (!lead) {
      return res.status(404).json({ error: 'লিড পাওয়া যায়নি' });
    }

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
      operator: lead.operator || 'BD Mobile',
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

  // Delete an abandoned lead
  app.delete('/api/admin/leads/:leadId', requireAdminAuth, (req, res) => {
    const { leadId } = req.params;
    const db = readDb();
    db.abandonedLeads = (db.abandonedLeads || []).filter((l: any) => l.leadId !== leadId);
    writeDb(db);
    res.json({ success: true, abandonedLeads: db.abandonedLeads });
  });

  // Save/update custom products catalog
  app.put('/api/admin/products', requireAdminAuth, (req, res) => {
    const { products } = req.body || {};
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'অবৈধ প্রোডাক্ট তালিকা' });
    }
    const db = readDb();
    db.customProducts = products;
    writeDb(db);
    res.json({ success: true, products: db.customProducts });
  });

  // Save/update pixel & marketing settings
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
