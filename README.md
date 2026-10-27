# RaithuConnect (రైతు కనెక్ట్) — Local Harvest, Direct Trade
**Problem HACK-P309: Farmer Marketplace Prototype**

RaithuConnect is a pickup-first agricultural marketplace designed for Hyderabad and nearby farming mandals (Shamshabad, Chevella, Ibrahimpatnam, Shankarpally, Medchal). It connects local growers directly with households, restaurants, and wholesale traders without exploitative middlemen or commission agents.

---

## 🌾 Important Hackathon Prototype Scope & Disclaimers

1. **Pickup-First**: This prototype coordinates direct farm gate or village pickup point collections. Delivery is not arranged by this application.
2. **Payments**: Cash on pickup and simulated UPI demo flows only. Real payment card numbers or banking secrets are never collected or transmitted.
3. **Traceability Truth**: Harvest Passport information (dates, lots, field notes) is self-reported by registered farmers. The app promotes honest local trade without invented organic certifications or fake laboratory freshness guarantees.
4. **Surplus Corner**: Excess stock discounts are farmer-declared with explicit sale deadlines. Expired offers are strictly non-orderable. Food safety is not inferred from deadlines. Money saved is calculated purely from actual completed orders.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   Tailwind CSS • Motion • Lucide Icons • Web Speech    │
└───────────────────────────┬────────────────────────────┘
                            │ /api/* (JSON + HttpOnly Cookies + CSRF)
┌───────────────────────────▼────────────────────────────┐
│              Node.js + Express + TypeScript            │
│  - Session Auth & BCrypt Password Hashing              │
│  - State Machine & Invariant Guard Logic               │
│  - Multi-farmer Atomic Transaction Checkout            │
│  - Gemini 3.8 Flash Listing Assistant (Backend Only)   │
└───────────────────────────┬────────────────────────────┘
                            │ WAL mode + Foreign Keys
┌───────────────────────────▼────────────────────────────┐
│               SQLite Engine (better-sqlite3)          │
│  users • farmer_profiles • sessions • products         │
│  produce_lots • orders • order_items                   │
│  stock_reservations • order_events • listing_reports   │
│  moderation_actions                                    │
└────────────────────────────────────────────────────────┘
```

---

## 📦 Inventory Invariants & Concurrency Guarantees

RaithuConnect implements authoritative, zero-oversell stock mathematics:

$$\text{Available Quantity} = \text{On-Hand Quantity} - \text{Reserved Quantity}$$

1. **Adding to Cart Does Not Reserve Stock**: Stock is only reserved upon order submission.
2. **Atomic Order Submission**: Checkout uses database transactions (`better-sqlite3` atomic transactions). Submitting an order creates an active `StockReservation` and conditionally updates `products.reserved_quantity += quantity` where `(on_hand_quantity - reserved_quantity) >= quantity`.
3. **Multi-Farmer Checkout**: If a cart contains items from multiple farmers, separate orders are created in **one database transaction**. If any product fails stock or price validation, the entire transaction rolls back and no reservations are made.
4. **Order Status Lifecycle**:
   - `requested` $\rightarrow$ `accepted` $\rightarrow$ `ready` $\rightarrow$ `completed`
   - `requested` $\rightarrow$ `cancelled`
   - `accepted` $\rightarrow$ `cancelled`
   - `ready` $\rightarrow$ `cancelled`
5. **Completion Consumes Reservation**: Moving an order to `completed` reduces physical `on_hand_quantity` and marks reservations as `consumed`.
6. **Cancellation Releases Reservation Exactly Once**: Moving an order to `cancelled` releases the reservation and decrements `reserved_quantity` conditionally. Repeated cancellations cannot release stock twice.
7. **Stock Adjustment Floor**: Farmers cannot reduce `on_hand_quantity` below `reserved_quantity`. Active buyer commitments are strictly protected.
8. **Integer Precision**:
   - `kg` listings: integer grams (e.g. 1000g, 2500g).
   - `bunch` / `piece` listings: integer counts (1, 2, 5). Fractional pieces and bunches are rejected.
   - Prices: stored in integer paise.

---

## 🔑 Seeded Demo Accounts (1-Click Login Available)

All demo accounts can be selected directly from the **"Demo Switcher"** in the top navigation bar or the login screen:

| Role | Name | Email | Password | Location / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Farmer** | Mallikarjun Rao | `mallikarjun.farmer@raithu.in` | `FarmerPass123!` | Shamshabad Mandal (Country Tomatoes, Papaya, Brinjal) |
| **Farmer** | Lakshmi Devi | `lakshmi.farmer@raithu.in` | `FarmerPass123!` | Ibrahimpatnam Mandal (Palak, Methi, Coriander) |
| **Farmer** | Venkat Reddy | `venkat.farmer@raithu.in` | `FarmerPass123!` | Chevella Mandal (Sona Masoori Rice, Tur Dal) |
| **Farmer** | Srinivas Goud | `srinivas.farmer@raithu.in` | `FarmerPass123!` | Shankarpally Mandal (Taiwan Guava, Tender Okra) |
| **Farmer** | Anjaiah Varma | `anjaiah.farmer@raithu.in` | `FarmerPass123!` | Medchal Mandal (Green Chillies, Red Onions) |
| **Buyer** | Priya Sharma | `priya.buyer@hyd.in` | `BuyerPass123!` | Household Consumer (Farm-gate pickup) |
| **Buyer** | Chef Anand | `chef.anand@deccanbiryani.in` | `BuyerPass123!` | Restaurant Buyer (Deccan Biryani House kitchen) |
| **Buyer** | Rao Traders | `rao.traders@bowenpally.in` | `BuyerPass123!` | Wholesaler (Bowenpally Market) |
| **Admin** | Dr. K. Ramana | `admin@raithuconnect.telangana.gov` | `AdminPass123!` | Agri Officer (Marketplace Content Moderation) |

*Public registration only permits new Farmer or Buyer accounts. Admin accounts cannot be self-registered.*

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Invariant & Security Tests (14 Tests)
```bash
npm test
```

### 3. Run Development Server
```bash
npm run dev
```
The app runs at `http://0.0.0.0:3000`. Database seeds automatically on startup if tables are empty.

---

## 🧪 Verified Invariant Test Suite (14 Tests)

All 14 test cases in `tests/marketplace.test.ts` pass with 100% verification:
1. Ordering above available stock fails.
2. Zero or negative quantity fails.
3. Fractional pieces and bunches fail.
4. Concurrent requests cannot oversell stock.
5. Cancellation releases stock exactly once.
6. Completion consumes reserved stock correctly.
7. Invalid status transitions fail.
8. Another farmer cannot modify an order.
9. Buyers cannot access admin actions.
10. Duplicate order submission does not create duplicate orders (idempotency keys).
11. Inventory cannot be reduced below reserved quantity.
12. A failed multi-farmer checkout rolls back all reservations.
13. Hidden or expired listings cannot receive new orders.
14. Manual listing works without an AI key.

---

## ⏱️ 5-Minute Demo Walkthrough

1. **Explore the Marketplace**:
   - Open the app in your browser.
   - Use the search bar, filter by category (e.g. *Leafy Greens*) or locality (*Shamshabad*).
   - Check the **"Compare"** box on two products to see side-by-side harvest date, price per unit, and locality in the comparison drawer.
2. **Inspect Harvest Passport™**:
   - Click any produce card (e.g., *Country Tomatoes*).
   - Switch to the **Harvest Passport™** tab to view the farmer's self-reported batch/lot number, exact harvest timestamp, field location, and field notes.
3. **Surplus Corner**:
   - Click **"Surplus Corner"** in the top navigation.
   - Notice the live verified savings calculated from actual completed orders and real-time countdown clocks.
4. **Place a Multi-Farmer Order**:
   - Add items from two different farmers (e.g., *Country Tomatoes* from Mallikarjun Rao + *Fresh Palak* from Lakshmi Devi).
   - Open the cart: notice they are grouped by farmer and labeled with the pickup disclaimer.
   - Select *Cash on Pickup* and submit. The system atomically executes reservations and issues separate order codes.
5. **Farmer Order Fulfillment & Inventory Safety**:
   - Use the **Demo Switcher** to log in as **Mallikarjun Rao (Farmer)**.
   - Click **Farmer Dashboard**: see completed sales revenue vs requested order value, on-hand vs reserved stock valuation.
   - In **Incoming Orders**, transition the order: `Accept Order` $\rightarrow$ `Mark Ready for Pickup` $\rightarrow$ `Complete Order & Handover`. Notice on-hand inventory automatically adjusts upon completion.
   - In **Produce & Inventory**, click *Adjust Stock*: notice the system blocks you from reducing stock below committed reservations.
6. **AI Listing Assistant (Multilingual Drafts)**:
   - Click **"Publish Harvest"** $\rightarrow$ **"Use AI Assistant"**.
   - Select Telugu, Hindi, or English. Test speaking or paste:
     *"Maa polam lo 80 kg naatu tamatalu unnayi. Repu koyataniki ready. Rate 35 rupees per kg. Shamshabad daggara pickup."*
   - Click **"Extract Listing Draft"**: Gemini 3.8 Flash extracts structured fields, resolves "repu" (tomorrow) to the Asia/Kolkata date, detects missing fields, and requires farmer review before creating.
7. **Admin Moderation & Duplicate Detection**:
   - Log in as **Dr. Ramana (Admin)**.
   - Go to **Admin Moderation**: inspect flagged user reports, review suspected duplicates with human oversight, and view the immutable audit trail.

---

## ⚠️ SQLite Persistence Limitations

- This prototype utilizes a local file-based SQLite database located at `data/raithuconnect.db` with WAL mode enabled.
- In ephemeral container environments (e.g., stateless container rebuilds without attached persistent volumes), the database reinitializes and runs migrations + seed data automatically on startup.
- In a production cloud deployment, this architecture can transition to managed Cloud SQL (PostgreSQL) or attach a persistent network volume.
