import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createDb } from '../src/server/db';
import { MarketplaceService } from '../src/server/services';
import { generateListingDraft } from '../src/server/ai';
import bcrypt from 'bcryptjs';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data', 'test_marketplace.db');

describe('RaithuConnect Invariant & Security Test Suite', () => {
  let db: ReturnType<typeof createDb>;
  let service: MarketplaceService;

  let farmerUser1: any;
  let farmerUser2: any;
  let buyerUser1: any;
  let buyerUser2: any;
  let adminUser: any;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch (_) {}
    }

    db = createDb(TEST_DB_PATH);
    service = new MarketplaceService(db);

    // Create test accounts
    farmerUser1 = service.createUser({
      email: 'farmer1@test.in',
      password: 'Password123!',
      role: 'farmer',
      fullName: 'Mallanna Farmer',
      phone: '9849000001',
      farmerDetails: { villageMandal: 'Shamshabad', farmName: 'Mallanna Natural Farms' },
    });

    farmerUser2 = service.createUser({
      email: 'farmer2@test.in',
      password: 'Password123!',
      role: 'farmer',
      fullName: 'Venkat Farmer',
      phone: '9849000002',
      farmerDetails: { villageMandal: 'Chevella', farmName: 'Venkat Farms' },
    });

    buyerUser1 = service.createUser({
      email: 'buyer1@test.in',
      password: 'Password123!',
      role: 'buyer',
      fullName: 'Priya Buyer',
      phone: '9849000003',
    });

    buyerUser2 = service.createUser({
      email: 'buyer2@test.in',
      password: 'Password123!',
      role: 'buyer',
      fullName: 'Anand Buyer',
      phone: '9849000004',
    });

    // Seed admin
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone, created_at)
      VALUES (?, ?, ?, 'admin', 'Admin Officer', '9849000005', ?)
    `).run('admin_id_01', 'admin@test.in', bcrypt.hashSync('AdminPass!', 10), new Date().toISOString());
    adminUser = service.getUserById('admin_id_01');
  });

  afterEach(() => {
    try {
      db.close();
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
      }
    } catch (_) {}
  });

  // TEST 1: Ordering above available stock fails
  it('1. Ordering above available stock fails', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Organic Tomatoes',
      category: 'vegetables',
      unit: 'kg',
      pricePerUnitRupees: 40,
      onHandQuantity: 10000, // 10 kg
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/tomato.jpg',
    });

    expect(() => {
      service.checkout({
        buyerId: buyerUser1.id,
        items: [{ productId: product.id, quantity: 15000, expectedUnitPricePaise: 4000 }], // 15kg > 10kg
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'test_order_exceed_stock',
      });
    }).toThrow(/Insufficient stock/);
  });

  // TEST 2: Zero or negative quantity fails
  it('2. Zero or negative quantity fails', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Fresh Palak',
      category: 'leafy_greens',
      unit: 'bunch',
      pricePerUnitRupees: 15,
      onHandQuantity: 20,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Ibrahimpatnam',
      imageUrl: 'https://example.com/palak.jpg',
    });

    expect(() => {
      service.checkout({
        buyerId: buyerUser1.id,
        items: [{ productId: product.id, quantity: 0, expectedUnitPricePaise: 1500 }],
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'test_order_zero_qty',
      });
    }).toThrow(/positive integer/);

    expect(() => {
      service.checkout({
        buyerId: buyerUser1.id,
        items: [{ productId: product.id, quantity: -5, expectedUnitPricePaise: 1500 }],
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'test_order_neg_qty',
      });
    }).toThrow(/positive integer/);
  });

  // TEST 3: Fractional pieces and bunches fail
  it('3. Fractional pieces and bunches fail', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Papaya',
      category: 'fruits',
      unit: 'piece',
      pricePerUnitRupees: 50,
      onHandQuantity: 10,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/papaya.jpg',
    });

    expect(() => {
      service.checkout({
        buyerId: buyerUser1.id,
        items: [{ productId: product.id, quantity: 2.5, expectedUnitPricePaise: 5000 }],
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'test_order_frac_piece',
      });
    }).toThrow(/positive integer/);
  });

  // TEST 4: Concurrent requests cannot oversell stock
  it('4. Concurrent requests cannot oversell stock', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Limited Watermelon',
      category: 'fruits',
      unit: 'piece',
      pricePerUnitRupees: 80,
      onHandQuantity: 5,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/melon.jpg',
    });

    // Buyer 1 orders 3 pieces -> succeeds
    const o1 = service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 3, expectedUnitPricePaise: 8000 }],
      paymentMode: 'cash_on_pickup',
      idempotencyKey: 'concurrent_key_1',
    });
    expect(o1.length).toBe(1);

    // Buyer 2 simultaneously orders 3 pieces -> fails because only 2 remain
    expect(() => {
      service.checkout({
        buyerId: buyerUser2.id,
        items: [{ productId: product.id, quantity: 3, expectedUnitPricePaise: 8000 }],
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'concurrent_key_2',
      });
    }).toThrow(/Insufficient stock/);

    const updatedProd = service.getProductById(product.id)!;
    expect(updatedProd.reservedQuantity).toBe(3);
    expect(updatedProd.availableQuantity).toBe(2);
  });

  // TEST 5: Cancellation releases stock exactly once
  it('5. Cancellation releases stock exactly once', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Fresh Okra',
      category: 'vegetables',
      unit: 'kg',
      pricePerUnitRupees: 50,
      onHandQuantity: 20000, // 20 kg
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shankarpally',
      imageUrl: 'https://example.com/okra.jpg',
    });

    const [order] = service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 5000, expectedUnitPricePaise: 5000 }], // 5kg
      paymentMode: 'cash_on_pickup',
      idempotencyKey: 'order_to_cancel',
    });

    let currentProd = service.getProductById(product.id)!;
    expect(currentProd.reservedQuantity).toBe(5000);
    expect(currentProd.availableQuantity).toBe(15000);

    // Buyer cancels order
    service.updateOrderStatus({
      orderId: order.id,
      action: 'cancel',
      actorUserId: buyerUser1.id,
      cancelReason: 'Changed meal plan',
    });

    currentProd = service.getProductById(product.id)!;
    expect(currentProd.reservedQuantity).toBe(0);
    expect(currentProd.availableQuantity).toBe(20000);

    // Repeated cancellation attempt fails (terminal state) and NEVER releases stock twice
    expect(() => {
      service.updateOrderStatus({
        orderId: order.id,
        action: 'cancel',
        actorUserId: buyerUser1.id,
      });
    }).toThrow(/already in terminal state/);

    currentProd = service.getProductById(product.id)!;
    expect(currentProd.reservedQuantity).toBe(0);
    expect(currentProd.availableQuantity).toBe(20000);
  });

  // TEST 6: Completion consumes reserved stock correctly
  it('6. Completion consumes reserved stock correctly', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Country Brinjal',
      category: 'vegetables',
      unit: 'kg',
      pricePerUnitRupees: 30,
      onHandQuantity: 25000, // 25kg
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/brinjal.jpg',
    });

    const [order] = service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 10000, expectedUnitPricePaise: 3000 }], // 10kg
      paymentMode: 'cash_on_pickup',
      idempotencyKey: 'order_to_complete',
    });

    // Accept -> Mark Ready -> Complete
    service.updateOrderStatus({ orderId: order.id, action: 'accept', actorUserId: farmerUser1.id });
    service.updateOrderStatus({ orderId: order.id, action: 'mark_ready', actorUserId: farmerUser1.id });
    service.updateOrderStatus({ orderId: order.id, action: 'complete', actorUserId: farmerUser1.id });

    const finalProd = service.getProductById(product.id)!;
    // On hand was 25000, 10000 completed -> on hand is now 15000, reserved is 0
    expect(finalProd.onHandQuantity).toBe(15000);
    expect(finalProd.reservedQuantity).toBe(0);
    expect(finalProd.availableQuantity).toBe(15000);
  });

  // TEST 7: Invalid status transitions fail
  it('7. Invalid status transitions fail', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Guava',
      category: 'fruits',
      unit: 'kg',
      pricePerUnitRupees: 60,
      onHandQuantity: 10000,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shankarpally',
      imageUrl: 'https://example.com/guava.jpg',
    });

    const [order] = service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 2000, expectedUnitPricePaise: 6000 }],
      paymentMode: 'cash_on_pickup',
      idempotencyKey: 'order_invalid_transitions',
    });

    // Trying to complete directly from 'requested' must fail
    expect(() => {
      service.updateOrderStatus({ orderId: order.id, action: 'complete', actorUserId: farmerUser1.id });
    }).toThrow(/Invalid status transition/);

    // Trying to mark ready before accept must fail
    expect(() => {
      service.updateOrderStatus({ orderId: order.id, action: 'mark_ready', actorUserId: farmerUser1.id });
    }).toThrow(/Invalid status transition/);
  });

  // TEST 8: Another farmer cannot modify an order
  it('8. Another farmer cannot modify an order', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Sona Masoori Rice',
      category: 'grains',
      unit: 'kg',
      pricePerUnitRupees: 60,
      onHandQuantity: 50000,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/rice.jpg',
    });

    const [order] = service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 5000, expectedUnitPricePaise: 6000 }],
      paymentMode: 'cash_on_pickup',
      idempotencyKey: 'order_other_farmer_check',
    });

    // Farmer 2 attempts to accept Farmer 1's order
    expect(() => {
      service.updateOrderStatus({ orderId: order.id, action: 'accept', actorUserId: farmerUser2.id });
    }).toThrow(/Unauthorized/);
  });

  // TEST 9: Buyers cannot access admin actions
  it('9. Buyers cannot access admin actions', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Reported Item',
      category: 'vegetables',
      unit: 'kg',
      pricePerUnitRupees: 30,
      onHandQuantity: 5000,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/item.jpg',
    });

    expect(() => {
      service.moderateListing({
        productId: product.id,
        adminUserId: buyerUser1.id, // Buyer attempting admin action
        action: 'hide',
        reason: 'Hide this please',
      });
    }).toThrow(/Unauthorized: Admin access required/);
  });

  // TEST 10: Duplicate order submission does not create duplicate orders
  it('10. Duplicate order submission does not create duplicate orders', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Desi Methi',
      category: 'leafy_greens',
      unit: 'bunch',
      pricePerUnitRupees: 20,
      onHandQuantity: 50,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Ibrahimpatnam',
      imageUrl: 'https://example.com/methi.jpg',
    });

    const key = 'unique_idempotency_key_10';
    const firstCallOrders = service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 10, expectedUnitPricePaise: 2000 }],
      paymentMode: 'cash_on_pickup',
      idempotencyKey: key,
    });
    expect(firstCallOrders.length).toBe(1);

    // Second call with same idempotency key
    const secondCallOrders = service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 10, expectedUnitPricePaise: 2000 }],
      paymentMode: 'cash_on_pickup',
      idempotencyKey: key,
    });

    expect(secondCallOrders.length).toBe(1);
    expect(secondCallOrders[0].id).toBe(firstCallOrders[0].id);

    // Stock was reserved only once
    const updatedProd = service.getProductById(product.id)!;
    expect(updatedProd.reservedQuantity).toBe(10);
    expect(updatedProd.availableQuantity).toBe(40);
  });

  // TEST 11: Inventory cannot be reduced below reserved quantity
  it('11. Inventory cannot be reduced below reserved quantity', () => {
    const product = service.createProduct(farmerUser1.id, {
      name: 'Red Onions',
      category: 'vegetables',
      unit: 'kg',
      pricePerUnitRupees: 35,
      onHandQuantity: 30000, // 30 kg
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Medchal',
      imageUrl: 'https://example.com/onions.jpg',
    });

    // Buyer reserves 15kg
    service.checkout({
      buyerId: buyerUser1.id,
      items: [{ productId: product.id, quantity: 15000, expectedUnitPricePaise: 3500 }],
      paymentMode: 'cash_on_pickup',
      idempotencyKey: 'onion_reserve_key',
    });

    // Farmer attempts to reduce on-hand to 10kg (< 15kg reserved)
    expect(() => {
      service.adjustProductStock(farmerUser1.id, product.id, 10000);
    }).toThrow(/Cannot reduce stock/);

    // Farmer reduces to 20kg (>= 15kg reserved) -> succeeds
    const adjusted = service.adjustProductStock(farmerUser1.id, product.id, 20000);
    expect(adjusted.onHandQuantity).toBe(20000);
    expect(adjusted.reservedQuantity).toBe(15000);
    expect(adjusted.availableQuantity).toBe(5000);
  });

  // TEST 12: A failed multi-farmer checkout rolls back all reservations
  it('12. A failed multi-farmer checkout rolls back all reservations', () => {
    const prodFarmer1 = service.createProduct(farmerUser1.id, {
      name: 'Valid Cabbage',
      category: 'vegetables',
      unit: 'piece',
      pricePerUnitRupees: 30,
      onHandQuantity: 10,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/cabbage.jpg',
    });

    const prodFarmer2 = service.createProduct(farmerUser2.id, {
      name: 'Scarce Carrot',
      category: 'vegetables',
      unit: 'kg',
      pricePerUnitRupees: 50,
      onHandQuantity: 2000, // Only 2kg available
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Chevella',
      imageUrl: 'https://example.com/carrot.jpg',
    });

    // Cart contains item from farmer 1 (valid 5 pieces) and farmer 2 (invalid 10kg > 2kg)
    expect(() => {
      service.checkout({
        buyerId: buyerUser1.id,
        items: [
          { productId: prodFarmer1.id, quantity: 5, expectedUnitPricePaise: 3000 },
          { productId: prodFarmer2.id, quantity: 10000, expectedUnitPricePaise: 5000 }, // Will fail!
        ],
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'multi_fail_checkout',
      });
    }).toThrow(/Insufficient stock/);

    // Verify atomic rollback: prodFarmer1 stock was NOT reserved!
    const verifiedProd1 = service.getProductById(prodFarmer1.id)!;
    expect(verifiedProd1.reservedQuantity).toBe(0);
    expect(verifiedProd1.availableQuantity).toBe(10);
  });

  // TEST 13: Hidden or expired listings cannot receive new orders
  it('13. Hidden or expired listings cannot receive new orders', () => {
    // 13a: Admin hidden listing
    const hiddenProduct = service.createProduct(farmerUser1.id, {
      name: 'Questionable Batch',
      category: 'vegetables',
      unit: 'kg',
      pricePerUnitRupees: 20,
      onHandQuantity: 10000,
      harvestDate: '2026-10-27',
      availabilityDate: '2026-10-27',
      pickupLocality: 'Shamshabad',
      imageUrl: 'https://example.com/img.jpg',
    });
    service.moderateListing({
      productId: hiddenProduct.id,
      adminUserId: adminUser.id,
      action: 'hide',
      reason: 'Under administrative review',
    });

    expect(() => {
      service.checkout({
        buyerId: buyerUser1.id,
        items: [{ productId: hiddenProduct.id, quantity: 2000, expectedUnitPricePaise: 2000 }],
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'order_hidden_product',
      });
    }).toThrow(/no longer active/);

    // 13b: Expired surplus listing
    const expiredSurplus = service.createProduct(farmerUser1.id, {
      name: 'Past Deadline Mangoes',
      category: 'fruits',
      unit: 'kg',
      pricePerUnitRupees: 100,
      onHandQuantity: 10000,
      harvestDate: '2026-10-20',
      availabilityDate: '2026-10-20',
      pickupLocality: 'Shamshabad',
      isSurplus: true,
      surplusDiscountPct: 40,
      surplusDeadline: '2026-10-25T12:00:00.000Z', // Past date!
      imageUrl: 'https://example.com/mango.jpg',
    });

    expect(() => {
      service.checkout({
        buyerId: buyerUser1.id,
        items: [{ productId: expiredSurplus.id, quantity: 2000, expectedUnitPricePaise: 6000 }],
        paymentMode: 'cash_on_pickup',
        idempotencyKey: 'order_expired_surplus',
      });
    }).toThrow(/has expired/);
  });

  // TEST 14: Manual listing works without an AI key
  it('14. Manual listing works without an AI key', async () => {
    // Temporarily unset or corrupt GEMINI_API_KEY
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      // AI assistant gracefully reports key not configured
      await expect(generateListingDraft('100 kg onions ready tomorrow')).rejects.toThrow(
        /GEMINI_API_KEY is not configured/
      );

      // Meanwhile, manual product creation works perfectly without any AI key requirement
      const manualProduct = service.createProduct(farmerUser1.id, {
        name: 'Manual Fresh Bitter Gourd',
        category: 'vegetables',
        unit: 'kg',
        pricePerUnitRupees: 45,
        onHandQuantity: 15000,
        harvestDate: '2026-10-28',
        availabilityDate: '2026-10-28',
        pickupLocality: 'Shamshabad',
        description: 'Direct manual entry without AI dependency.',
        imageUrl: 'https://example.com/karela.jpg',
      });

      expect(manualProduct).toBeDefined();
      expect(manualProduct.name).toBe('Manual Fresh Bitter Gourd');
      expect(manualProduct.availableQuantity).toBe(15000);
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });
});
