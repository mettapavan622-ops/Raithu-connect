import { db } from './db';
import { MarketplaceService } from './services';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function runSeed(service: MarketplaceService = new MarketplaceService(db)) {
  console.log('🌱 Seeding RaithuConnect database with realistic Telangana agricultural demo data...');

  // 1. Seed Admin User
  const adminEmail = 'admin@raithuconnect.telangana.gov';
  let admin = service.getUserByEmail(adminEmail);
  if (!admin) {
    const adminId = 'usr_admin_001';
    // Admin password: AdminPass123!
    const hash = bcrypt.hashSync('AdminPass123!', 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone, created_at)
      VALUES (?, ?, ?, 'admin', 'Dr. K. Ramana (Demo Agri Officer)', '9848011223', ?)
    `).run(adminId, adminEmail, hash, now);
    console.log('✓ Admin account seeded: admin@raithuconnect.telangana.gov / AdminPass123!');
  }

  // 2. Seed 5 Fictional Farmers
  const farmersData = [
    {
      email: 'mallikarjun.farmer@raithu.in',
      name: 'Mallikarjun Rao (Demo Farmer)',
      phone: '9849123401',
      farmName: 'Rao Natural Mango & Vegetable Groves',
      villageMandal: 'Shamshabad Mandal',
      district: 'Ranga Reddy',
      bio: 'Family farm cultivating traditional country vegetables and mangoes since 1998. Practicing natural mulching.',
      upiId: '9849123401@upi',
      address: 'Survey No. 42, Near Shamshabad Raitu Bazaar',
    },
    {
      email: 'lakshmi.farmer@raithu.in',
      name: 'Lakshmi Devi (Demo Farmer)',
      phone: '9849123402',
      farmName: 'Sri Lakshmi Organic Leafy Greens Farm',
      villageMandal: 'Ibrahimpatnam Mandal',
      district: 'Ranga Reddy',
      bio: 'Specialist in freshly harvested greens (Palak, Methi, Kothimeera) picked at 5 AM daily for city pickup.',
      upiId: '9849123402@upi',
      address: 'Village Polam, Outer Ring Road Exit 12, Ibrahimpatnam',
    },
    {
      email: 'venkat.farmer@raithu.in',
      name: 'Venkat Reddy (Demo Farmer)',
      phone: '9849123403',
      farmName: 'Reddy Heritage Grain & Pulse Farm',
      villageMandal: 'Chevella Mandal',
      district: 'Ranga Reddy',
      bio: 'Grower of Sona Masoori single-origin rice and Desi Tur Dal in rainfed fertile black soil.',
      upiId: '9849123403@upi',
      address: 'Near Chevella Cross Roads, Vikarabad Road',
    },
    {
      email: 'srinivas.farmer@raithu.in',
      name: 'Srinivas Goud (Demo Farmer)',
      phone: '9849123404',
      farmName: 'Goud Fruit & Vegetable Orchards',
      villageMandal: 'Shankarpally Mandal',
      district: 'Sangareddy',
      bio: 'Cultivating guava, papaya, and crisp bhendi (okra) irrigated with clean borewell water.',
      upiId: '9849123404@upi',
      address: 'Singapur Village, Shankarpally',
    },
    {
      email: 'anjaiah.farmer@raithu.in',
      name: 'Anjaiah Varma (Demo Farmer)',
      phone: '9849123405',
      farmName: 'Varma Hilltop Vegetable Patch',
      villageMandal: 'Medchal Mandal',
      district: 'Medchal-Malkajgiri',
      bio: 'Perched in North Hyderabad rural fringe. Known for firm country tomatoes and spicy green chillies.',
      upiId: '9849123405@upi',
      address: 'Kandlakoya Rural Road, Medchal',
    },
  ];

  const seededFarmers: any[] = [];
  for (const f of farmersData) {
    let existing = service.getUserByEmail(f.email);
    if (!existing) {
      existing = service.createUser({
        email: f.email,
        password: 'FarmerPass123!',
        role: 'farmer',
        fullName: f.name,
        phone: f.phone,
        farmerDetails: {
          farmName: f.farmName,
          villageMandal: f.villageMandal,
          district: f.district,
          bio: f.bio,
          upiId: f.upiId,
          address: f.address,
        },
      }) as any;
    }
    seededFarmers.push(existing);
  }
  console.log(`✓ 5 Farmer accounts verified.`);

  // 3. Seed 3 Buyer Accounts
  const buyersData = [
    {
      email: 'priya.buyer@hyd.in',
      name: 'Priya Sharma (Household Buyer)',
      phone: '9849200001',
    },
    {
      email: 'chef.anand@deccanbiryani.in',
      name: 'Chef Anand Varma (Deccan Biryani House)',
      phone: '9849200002',
    },
    {
      email: 'rao.traders@bowenpally.in',
      name: 'Rao Vegetable Traders (Bowenpally Market)',
      phone: '9849200003',
    },
  ];

  const seededBuyers: any[] = [];
  for (const b of buyersData) {
    let existing = service.getUserByEmail(b.email);
    if (!existing) {
      existing = service.createUser({
        email: b.email,
        password: 'BuyerPass123!',
        role: 'buyer',
        fullName: b.name,
        phone: b.phone,
      }) as any;
    }
    seededBuyers.push(existing);
  }
  console.log(`✓ 3 Buyer accounts verified.`);

  // 4. Seed 16 Products across Categories with Plausible Produce Details
  const existingProds = service.getProducts({ includeHidden: true });
  if (existingProds.length < 15) {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const surplusDeadlineSoon = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(); // 36 hours from now

    const sampleProducts = [
      // Farmer 0: Mallikarjun Rao (Shamshabad)
      {
        farmerIndex: 0,
        name: 'Country Tomatoes (Naatu Tomato)',
        category: 'vegetables' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 35,
        onHandQuantity: 80000, // 80 kg
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Shamshabad Mandal, Near Airport Approach',
        pickupNotes: 'Pickup at farm gate between 7:00 AM and 1:00 PM. Please bring your own reusable crates or bags.',
        description: 'Naturally ripened, sun-blessed country tomatoes with a distinctive tangy flavor perfect for rasam and dal.',
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-SHAM-2026-TOM01',
        fieldLocation: 'North Ridge Field 2, Shamshabad',
        harvestNotes: 'Handpicked at 6:00 AM after morning dew cleared.',
      },
      {
        farmerIndex: 0,
        name: 'Desi Purple Brinjal (Vankaya)',
        category: 'vegetables' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 40,
        onHandQuantity: 45000, // 45 kg
        harvestDate: todayIso,
        availabilityDate: tomorrow,
        pickupLocality: 'Shamshabad Mandal',
        pickupNotes: 'Available at farm shed behind Raithu Vedika.',
        description: 'Tender small purple brinjal ideal for gutti vankaya curry. Glossy skin with soft seeds.',
        imageUrl: 'https://images.unsplash.com/photo-1628773822503-930a84d9f1c7?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-SHAM-2026-BRIN02',
        fieldLocation: 'Plot 4, Canal Side',
        harvestNotes: 'Graded by hand for consistent palm-size tender fruit.',
      },
      {
        farmerIndex: 0,
        name: 'Surplus Sweet Papaya (Carica)',
        category: 'fruits' as const,
        unit: 'piece' as const,
        pricePerUnitRupees: 50,
        onHandQuantity: 30, // 30 pieces
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Shamshabad Mandal',
        pickupNotes: 'Farm store pickup. Open till 6 PM.',
        description: 'Ripe Red Lady papaya variety. Sweet salmon-orange flesh, weighing approx 1.2kg to 1.5kg each.',
        imageUrl: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800&auto=format&fit=crop&q=80',
        isSurplus: true,
        surplusDiscountPct: 25,
        surplusDeadline: surplusDeadlineSoon,
        lotNumber: 'LOT-SHAM-2026-PAP03',
        fieldLocation: 'Orchard Row 8',
        harvestNotes: 'Excess ripening due to warm spell; discounted for immediate table consumption.',
      },

      // Farmer 1: Lakshmi Devi (Ibrahimpatnam)
      {
        farmerIndex: 1,
        name: 'Fresh Farm Palak (Spinach)',
        category: 'leafy_greens' as const,
        unit: 'bunch' as const,
        pricePerUnitRupees: 15,
        onHandQuantity: 120, // 120 bunches
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Ibrahimpatnam Mandal, ORR Exit 12',
        pickupNotes: 'Morning pickup only (6:30 AM - 10:30 AM) to maintain crispy freshness.',
        description: 'Hydro-bathed fresh spinach with broad dark green leaves, harvested at dawn.',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-IBR-2026-PLK01',
        fieldLocation: 'Shade Net Unit 1, Ibrahimpatnam',
        harvestNotes: 'Washed once in cold borewell water and bundled with jute twine.',
      },
      {
        farmerIndex: 1,
        name: 'Desi Methi (Fenugreek Leaves)',
        category: 'leafy_greens' as const,
        unit: 'bunch' as const,
        pricePerUnitRupees: 18,
        onHandQuantity: 80, // 80 bunches
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Ibrahimpatnam Mandal',
        pickupNotes: 'Packaged in breathable crates at shed.',
        description: 'Small-leaf fragrant desi methi with robust herbal aroma. Perfect for methi dal and parathas.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-IBR-2026-MTH02',
        fieldLocation: 'Plot 3 East',
        harvestNotes: 'Root trimmed, high essential oil content.',
      },
      {
        farmerIndex: 1,
        name: 'Aromatic Kothimeera (Coriander)',
        category: 'leafy_greens' as const,
        unit: 'bunch' as const,
        pricePerUnitRupees: 20,
        onHandQuantity: 100, // 100 bunches
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Ibrahimpatnam Mandal',
        pickupNotes: 'Collect from cold room holding room between 7 AM and 12 PM.',
        description: 'Rich scent country coriander with roots intact for extended shelf life.',
        imageUrl: 'https://images.unsplash.com/photo-1588879462580-0a30b05bca4a?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-IBR-2026-COR03',
        fieldLocation: 'Plot 5 North',
        harvestNotes: 'Picked right before sunrise.',
      },

      // Farmer 2: Venkat Reddy (Chevella)
      {
        farmerIndex: 2,
        name: 'Sona Masoori Raw Rice (Aged)',
        category: 'grains' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 65,
        onHandQuantity: 350000, // 350 kg
        harvestDate: '2026-09-15',
        availabilityDate: todayIso,
        pickupLocality: 'Chevella Cross Roads',
        pickupNotes: 'Stored in 25kg & 50kg food-grade gunny bags. Loading assistance available at farm warehouse.',
        description: 'Single-estate Sona Masoori raw rice, 12 months aged for fluffy non-sticky grains.',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-CHEV-2026-SONA01',
        fieldLocation: 'Kondakal Field, Chevella',
        harvestNotes: 'Machine milled with light polish (semi-brown germ retained).',
      },
      {
        farmerIndex: 2,
        name: 'Desi Red Gram (Tur Dal / Kandi Pappu)',
        category: 'grains' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 160,
        onHandQuantity: 120000, // 120 kg
        harvestDate: '2026-10-01',
        availabilityDate: todayIso,
        pickupLocality: 'Chevella Cross Roads',
        pickupNotes: 'Packaged in 1kg and 5kg sealed craft bags.',
        description: 'Unpolished Telangana desi red gram dal. Cooks to a creamy yellow consistency with nutty aroma.',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-CHEV-2026-TUR02',
        fieldLocation: 'Red Soil Uplands, Chevella',
        harvestNotes: 'Sun-dried and stone split with zero chemical polishing or oil coloring.',
      },
      {
        farmerIndex: 2,
        name: 'Surplus Sweet Corn Cobs',
        category: 'vegetables' as const,
        unit: 'piece' as const,
        pricePerUnitRupees: 15,
        onHandQuantity: 90, // 90 pieces
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Chevella Cross Roads',
        pickupNotes: 'Pickup within 24 hours for best sugar content.',
        description: 'Juicy yellow American sweet corn cobs in husk. Extra harvest from companion cropping plot.',
        imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
        isSurplus: true,
        surplusDiscountPct: 30,
        surplusDeadline: surplusDeadlineSoon,
        lotNumber: 'LOT-CHEV-2026-CORN03',
        fieldLocation: 'Corn Terrace 1',
        harvestNotes: 'Bumper yield harvested today. Must be collected promptly.',
      },

      // Farmer 3: Srinivas Goud (Shankarpally)
      {
        farmerIndex: 3,
        name: 'Tender Bhendi (Lady Finger / Okra)',
        category: 'vegetables' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 45,
        onHandQuantity: 50000, // 50 kg
        harvestDate: todayIso,
        availabilityDate: tomorrow,
        pickupLocality: 'Singapur Village, Shankarpally',
        pickupNotes: 'Direct from packing shed on Singapur rural road.',
        description: 'Slender snap-tender bhendi, zero fiber stringiness. Ideal for fry and sambar.',
        imageUrl: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-SHANK-2026-OKRA01',
        fieldLocation: 'Singapur Plot 2',
        harvestNotes: 'Snapped by hand at tip to verify tenderness.',
      },
      {
        farmerIndex: 3,
        name: 'Taiwan Pink Guava (Seethaphalam)',
        category: 'fruits' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 70,
        onHandQuantity: 60000, // 60 kg
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Shankarpally Mandal',
        pickupNotes: 'Foam net wrapped in individual 5kg trays.',
        description: 'Crisp, aromatic Taiwan pink guava with crunchy edible seeds and high Vitamin C.',
        imageUrl: 'https://images.unsplash.com/photo-1536511135898-05995589e5a1?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-SHANK-2026-GVA02',
        fieldLocation: 'South Orchard block 3',
        harvestNotes: 'Tree-ripened, plucked in morning shade.',
      },
      {
        farmerIndex: 3,
        name: 'Surplus Country Custard Apple (Sitaphal)',
        category: 'fruits' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 90,
        onHandQuantity: 25000, // 25 kg
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Shankarpally Mandal',
        pickupNotes: 'Eat within 48 hours. Custard flesh is fully soft.',
        description: 'Wild heirloom custard apples from surrounding hillocks. Creamy sweet pulp with large segments.',
        imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop&q=80',
        isSurplus: true,
        surplusDiscountPct: 20,
        surplusDeadline: surplusDeadlineSoon,
        lotNumber: 'LOT-SHANK-2026-SIT03',
        fieldLocation: 'Hillside Groves',
        harvestNotes: 'Peak maturity cluster; surplus clearance before festive rush.',
      },

      // Farmer 4: Anjaiah Varma (Medchal)
      {
        farmerIndex: 4,
        name: 'Desi Pachi Mirapa (Green Chillies)',
        category: 'spices_and_others' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 60,
        onHandQuantity: 30000, // 30 kg
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Kandlakoya Road, Medchal',
        pickupNotes: 'Pickup at farm warehouse near NH44 junction.',
        description: 'Pungent Telangana G-4 variety green chillies. Bright dark green color with fiery punch.',
        imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-MED-2026-CHL01',
        fieldLocation: 'Medchal High Ridge',
        harvestNotes: 'Stems intact, sorted for zero blemishes.',
      },
      {
        farmerIndex: 4,
        name: 'Red Onions (Kanda / Ullipayalu)',
        category: 'vegetables' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 32,
        onHandQuantity: 200000, // 200 kg
        harvestDate: '2026-10-18',
        availabilityDate: todayIso,
        pickupLocality: 'Kandlakoya Road, Medchal',
        pickupNotes: 'Available in 10kg & 25kg mesh bags.',
        description: 'Medium-size cured Telangana red onions with firm dry skins. Long storage capability.',
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-MED-2026-ONN02',
        fieldLocation: 'Storage Shed A, Kandlakoya',
        harvestNotes: 'Cured in shade for 10 days post harvest.',
      },
      {
        farmerIndex: 4,
        name: 'Country Bottle Gourd (Sorakaya)',
        category: 'vegetables' as const,
        unit: 'piece' as const,
        pricePerUnitRupees: 25,
        onHandQuantity: 40, // 40 pieces
        harvestDate: todayIso,
        availabilityDate: todayIso,
        pickupLocality: 'Medchal Mandal',
        pickupNotes: 'Open morning and evening.',
        description: 'Straight cylindrical bottle gourds with tender light green skin and soft inner seeds.',
        imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-MED-2026-BTL03',
        fieldLocation: 'Trellis Garden North',
        harvestNotes: 'Trellis grown so gourds stay perfectly straight without soil contact.',
      },
      {
        farmerIndex: 4,
        name: 'Fresh Ginger (Allam)',
        category: 'spices_and_others' as const,
        unit: 'kg' as const,
        pricePerUnitRupees: 120,
        onHandQuantity: 25000, // 25 kg
        harvestDate: todayIso,
        availabilityDate: dayAfter,
        pickupLocality: 'Medchal Mandal',
        pickupNotes: 'Fresh dug roots washed and air dried.',
        description: 'Spicy young ginger rhizomes with thin pinkish-tan skin and intense zesty aroma.',
        imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
        lotNumber: 'LOT-MED-2026-GNG04',
        fieldLocation: 'Raised Beds Unit 2',
        harvestNotes: 'Dug up fresh; minimal fiber.',
      },
    ];

    for (const p of sampleProducts) {
      const farmer = seededFarmers[p.farmerIndex];
      service.createProduct(farmer.id, {
        name: p.name,
        category: p.category,
        unit: p.unit,
        pricePerUnitRupees: p.pricePerUnitRupees,
        onHandQuantity: p.onHandQuantity,
        harvestDate: p.harvestDate,
        availabilityDate: p.availabilityDate,
        pickupLocality: p.pickupLocality,
        pickupNotes: p.pickupNotes,
        description: p.description,
        isSurplus: p.isSurplus || false,
        surplusDiscountPct: p.surplusDiscountPct || 0,
        surplusDeadline: p.surplusDeadline || null,
        imageUrl: p.imageUrl,
        lotNumber: p.lotNumber,
        fieldLocation: p.fieldLocation,
        harvestNotes: p.harvestNotes,
      });
    }
    console.log(`✓ 16 Produce listings seeded across all categories.`);
  }

  // 5. Seed Lifecycle Orders (requested, accepted, ready, completed, cancelled)
  const existingOrders = db.prepare('SELECT count(*) as count FROM orders').get() as any;
  if (existingOrders.count === 0) {
    const products = service.getProducts({ includeHidden: true });
    if (products.length >= 4 && seededBuyers.length >= 3) {
      const buyer0 = seededBuyers[0]; // Priya Sharma
      const buyer1 = seededBuyers[1]; // Chef Anand
      const buyer2 = seededBuyers[2]; // Rao Traders

      const prodTomatoes = products.find(p => p.name.includes('Tomatoes')) || products[0];
      const prodPalak = products.find(p => p.name.includes('Palak')) || products[1];
      const prodRice = products.find(p => p.name.includes('Rice')) || products[2];
      const prodOkra = products.find(p => p.name.includes('Bhendi')) || products[3];

      // Order 1: Completed order (Priya Sharma buys 2kg tomatoes from Mallikarjun)
      try {
        const o1 = service.checkout({
          buyerId: buyer0.id,
          items: [{ productId: prodTomatoes.id, quantity: 2000, expectedUnitPricePaise: prodTomatoes.pricePerUnitPaise }],
          paymentMode: 'cash_on_pickup',
          idempotencyKey: 'seed_ord_001_idemp',
        })[0];
        service.updateOrderStatus({ orderId: o1.id, action: 'accept', actorUserId: prodTomatoes.farmerId });
        service.updateOrderStatus({ orderId: o1.id, action: 'mark_ready', actorUserId: prodTomatoes.farmerId });
        service.updateOrderStatus({ orderId: o1.id, action: 'complete', actorUserId: prodTomatoes.farmerId });
        console.log('✓ Seeded order 1: Completed');
      } catch (e: any) {
        console.log('Order 1 seed note:', e.message);
      }

      // Order 2: Ready order (Chef Anand buys 50 bunches Palak from Lakshmi Devi)
      try {
        const o2 = service.checkout({
          buyerId: buyer1.id,
          items: [{ productId: prodPalak.id, quantity: 50, expectedUnitPricePaise: prodPalak.pricePerUnitPaise }],
          paymentMode: 'simulated_upi',
          idempotencyKey: 'seed_ord_002_idemp',
        })[0];
        service.updateOrderStatus({ orderId: o2.id, action: 'accept', actorUserId: prodPalak.farmerId });
        service.updateOrderStatus({ orderId: o2.id, action: 'mark_ready', actorUserId: prodPalak.farmerId });
        console.log('✓ Seeded order 2: Ready for pickup');
      } catch (e: any) {
        console.log('Order 2 seed note:', e.message);
      }

      // Order 3: Accepted order (Rao Traders buys 100kg Rice from Venkat Reddy)
      try {
        const o3 = service.checkout({
          buyerId: buyer2.id,
          items: [{ productId: prodRice.id, quantity: 100000, expectedUnitPricePaise: prodRice.pricePerUnitPaise }],
          paymentMode: 'cash_on_pickup',
          idempotencyKey: 'seed_ord_003_idemp',
        })[0];
        service.updateOrderStatus({ orderId: o3.id, action: 'accept', actorUserId: prodRice.farmerId });
        console.log('✓ Seeded order 3: Accepted');
      } catch (e: any) {
        console.log('Order 3 seed note:', e.message);
      }

      // Order 4: Requested order (Priya Sharma requests 3kg Okra from Srinivas Goud)
      try {
        service.checkout({
          buyerId: buyer0.id,
          items: [{ productId: prodOkra.id, quantity: 3000, expectedUnitPricePaise: prodOkra.pricePerUnitPaise }],
          paymentMode: 'cash_on_pickup',
          idempotencyKey: 'seed_ord_004_idemp',
        });
        console.log('✓ Seeded order 4: Requested (pending farmer acceptance)');
      } catch (e: any) {
        console.log('Order 4 seed note:', e.message);
      }

      // Order 5: Cancelled order (Chef Anand requested tomatoes then cancelled)
      try {
        const o5 = service.checkout({
          buyerId: buyer1.id,
          items: [{ productId: prodTomatoes.id, quantity: 5000, expectedUnitPricePaise: prodTomatoes.pricePerUnitPaise }],
          paymentMode: 'cash_on_pickup',
          idempotencyKey: 'seed_ord_005_idemp',
        })[0];
        service.updateOrderStatus({
          orderId: o5.id,
          action: 'cancel',
          actorUserId: buyer1.id,
          cancelReason: 'Menu plan revised for banquet event.',
        });
        console.log('✓ Seeded order 5: Cancelled by buyer');
      } catch (e: any) {
        console.log('Order 5 seed note:', e.message);
      }
    }
  }

  console.log('✅ RaithuConnect seed completed successfully.');
}

// If executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
