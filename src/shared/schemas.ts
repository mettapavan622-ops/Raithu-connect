import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  role: z.enum(['farmer', 'buyer']),
  preferredLanguage: z.enum(['en', 'te', 'hi']).default('en').optional(),
  locality: z.string().optional().default(''),
  // Farmer specific optional fields on registration
  farmName: z.string().optional(),
  villageMandal: z.string().optional(),
  district: z.string().optional(),
  bio: z.string().optional(),
  upiId: z.string().optional(),
  address: z.string().optional(),
  mainCategories: z.string().optional(),
  // Buyer specific optional fields on registration
  buyerType: z.enum(['household', 'retailer', 'restaurant', 'wholesaler']).optional().default('household'),
  businessName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  expectedRole: z.enum(['farmer', 'buyer', 'admin']).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const productCreateSchema = z.object({
  name: z.string().min(2, 'Produce name must be at least 2 characters').max(80),
  category: z.enum(['vegetables', 'fruits', 'leafy_greens', 'grains', 'spices_and_others']),
  unit: z.enum(['kg', 'bunch', 'piece']),
  pricePerUnitRupees: z.number().positive('Price must be greater than zero'),
  onHandQuantity: z.number().int('Quantity must be an integer').positive('Quantity must be greater than zero'),
  harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Harvest date must be YYYY-MM-DD'),
  availabilityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Availability date must be YYYY-MM-DD'),
  pickupLocality: z.string().min(2, 'Pickup locality is required'),
  pickupNotes: z.string().max(300).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  isSurplus: z.boolean().default(false),
  surplusDiscountPct: z.number().int().min(0).max(90).default(0),
  surplusDeadline: z.string().optional().nullable(),
  imageUrl: z.string().url().or(z.string().min(1)),
  // Produce Lot info for Harvest Passport
  lotNumber: z.string().optional(),
  harvestTimestamp: z.string().optional(),
  fieldLocation: z.string().optional(),
  harvestNotes: z.string().optional(),
}).refine((data) => {
  if (data.isSurplus) {
    return data.surplusDiscountPct > 0 && !!data.surplusDeadline;
  }
  return true;
}, {
  message: 'Surplus items require a discount percentage > 0 and a sale deadline',
  path: ['surplusDiscountPct'],
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  newOnHandQuantity: z.number().int('Stock must be an integer').min(0, 'Quantity cannot be negative'),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
  expectedUnitPricePaise: z.number().int().positive(),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  paymentMode: z.enum(['cash_on_pickup', 'simulated_upi']),
  idempotencyKey: z.string().min(8, 'Valid idempotency key is required'),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(['accept', 'mark_ready', 'complete', 'cancel']),
  cancelReason: z.string().max(300).optional(),
});

export const listingReportSchema = z.object({
  productId: z.string().min(1),
  reason: z.enum(['duplicate_listing', 'incorrect_pricing_or_unit', 'misleading_harvest_info', 'inappropriate_content', 'other']),
  details: z.string().min(5, 'Please provide at least 5 characters of detail').max(500),
});

export const moderationActionSchema = z.object({
  productId: z.string().min(1),
  action: z.enum(['hide', 'restore', 'reject']),
  reason: z.string().min(3, 'Please provide a reason').max(300),
});

export const aiDraftSchema = z.object({
  input: z.string().min(3, 'Please provide some description or notes'),
  farmerLocality: z.string().optional(),
});
