import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const DB_PATH = process.env.TEST_DB_PATH || path.join(DB_DIR, 'raithuconnect.db');

export function createDb(dbPath = DB_PATH) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('farmer', 'buyer', 'admin')),
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farmer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      farm_name TEXT NOT NULL,
      village_mandal TEXT NOT NULL,
      district TEXT NOT NULL,
      bio TEXT DEFAULT '',
      upi_id TEXT DEFAULT '',
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('vegetables', 'fruits', 'leafy_greens', 'grains', 'spices_and_others')),
      unit TEXT NOT NULL CHECK(unit IN ('kg', 'bunch', 'piece')),
      price_per_unit_paise INTEGER NOT NULL CHECK(price_per_unit_paise > 0),
      on_hand_quantity INTEGER NOT NULL CHECK(on_hand_quantity >= 0),
      reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK(reserved_quantity >= 0),
      harvest_date TEXT NOT NULL,
      availability_date TEXT NOT NULL,
      pickup_locality TEXT NOT NULL,
      pickup_notes TEXT DEFAULT '',
      description TEXT DEFAULT '',
      is_surplus INTEGER NOT NULL DEFAULT 0,
      surplus_discount_pct INTEGER NOT NULL DEFAULT 0,
      surplus_deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'hidden', 'rejected')),
      moderation_note TEXT,
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK(on_hand_quantity >= reserved_quantity)
    );

    CREATE TABLE IF NOT EXISTS product_photos (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      photo_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS produce_lots (
      id TEXT PRIMARY KEY,
      product_id TEXT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      lot_number TEXT NOT NULL,
      harvest_timestamp TEXT NOT NULL,
      field_location TEXT NOT NULL,
      harvest_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_code TEXT UNIQUE NOT NULL,
      buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      status TEXT NOT NULL CHECK(status IN ('requested', 'accepted', 'ready', 'completed', 'cancelled')),
      cancel_reason TEXT,
      cancelled_by TEXT,
      payment_mode TEXT NOT NULL CHECK(payment_mode IN ('cash_on_pickup', 'simulated_upi')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed')),
      total_amount_paise INTEGER NOT NULL CHECK(total_amount_paise >= 0),
      idempotency_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name_snapshot TEXT NOT NULL,
      unit_snapshot TEXT NOT NULL,
      unit_price_paise_snapshot INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      subtotal_paise INTEGER NOT NULL CHECK(subtotal_paise > 0)
    );

    CREATE TABLE IF NOT EXISTS stock_reservations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      reserved_quantity INTEGER NOT NULL CHECK(reserved_quantity > 0),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'consumed', 'released')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listing_reports (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      reason TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'dismissed')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS moderation_actions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      action TEXT NOT NULL CHECK(action IN ('hide', 'restore', 'reject')),
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_farmer ON products(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_stock_res_order ON stock_reservations(order_id);
  `);

  return db;
}

export const db = createDb();
