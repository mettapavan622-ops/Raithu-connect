import { z } from 'zod';

export type UserRole = 'farmer' | 'buyer' | 'admin';
export type ProduceUnit = 'kg' | 'bunch' | 'piece';
export type ProduceCategory = 'vegetables' | 'fruits' | 'leafy_greens' | 'grains' | 'spices_and_others';
export type ProductStatus = 'active' | 'hidden' | 'rejected';
export type OrderStatus = 'requested' | 'accepted' | 'ready' | 'completed' | 'cancelled';
export type PaymentMode = 'cash_on_pickup' | 'simulated_upi';
export type PaymentStatus = 'pending' | 'completed';
export type ReservationStatus = 'active' | 'consumed' | 'released';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  createdAt: string;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  farmName: string;
  villageMandal: string;
  district: string;
  bio: string;
  upiId?: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  farmName?: string;
  farmerLocality?: string;
  name: string;
  category: ProduceCategory;
  unit: ProduceUnit;
  pricePerUnitPaise: number;
  onHandQuantity: number; // grams for kg, whole units for bunch/piece
  reservedQuantity: number;
  availableQuantity: number; // onHandQuantity - reservedQuantity
  harvestDate: string; // ISO date YYYY-MM-DD
  availabilityDate: string; // ISO date YYYY-MM-DD
  pickupLocality: string;
  pickupNotes: string;
  description: string;
  isSurplus: boolean;
  surplusDiscountPct: number;
  surplusDeadline?: string | null;
  status: ProductStatus;
  moderationNote?: string | null;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  lotInfo?: {
    lotNumber: string;
    harvestTimestamp: string;
    fieldLocation: string;
    harvestNotes: string;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  unitSnapshot: ProduceUnit;
  unitPricePaiseSnapshot: number;
  quantity: number; // grams for kg, whole units for bunch/piece
  subtotalPaise: number;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | 'none';
  toStatus: OrderStatus;
  actorUserId: string;
  actorName?: string;
  notes: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  farmName?: string;
  pickupLocality?: string;
  status: OrderStatus;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  totalAmountPaise: number;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events?: OrderEvent[];
}

export interface ListingReport {
  id: string;
  productId: string;
  productName?: string;
  farmerName?: string;
  reporterUserId: string;
  reporterName?: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ModerationAction {
  id: string;
  productId: string;
  productName?: string;
  adminUserId: string;
  adminName?: string;
  action: 'hide' | 'restore' | 'reject';
  reason: string;
  createdAt: string;
}

// AI Listing Draft
export interface ListingDraftResult {
  productName: string | null;
  category: ProduceCategory | null;
  unit: ProduceUnit | null;
  quantity: number | null; // in grams or integer units
  pricePerUnit: number | null; // in rupees
  harvestDate: string | null; // YYYY-MM-DD
  availabilityDate: string | null; // YYYY-MM-DD
  pickupLocality: string | null;
  description: string | null;
  isSurplus: boolean;
  surplusDiscountPct: number;
  missingFields: string[];
  uncertainties: string[];
  notes: string;
}
