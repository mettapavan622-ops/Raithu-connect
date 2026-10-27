import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../../shared/types';

export interface CartItem {
  product: Product;
  quantity: number; // grams for kg, whole numbers for piece/bunch
  unitPricePaise: number; // snapshot at time added or refreshed
  subtotalPaise: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalPaise: number;
  totalItemsCount: number;
  itemsGroupedByFarmer: Record<string, { farmerName: string; farmName?: string; locality: string; items: CartItem[] }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('rc_active_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('rc_active_cart', JSON.stringify(items));
    } catch (_) {}
  }, [items]);

  const calculateEffectivePrice = (product: Product): number => {
    if (product.isSurplus && product.surplusDiscountPct > 0) {
      return Math.round(product.pricePerUnitPaise * (1 - product.surplusDiscountPct / 100));
    }
    return product.pricePerUnitPaise;
  };

  const calculateSubtotal = (product: Product, quantity: number, unitPricePaise: number): number => {
    if (product.unit === 'kg') {
      return Math.round((quantity * unitPricePaise) / 1000);
    }
    return quantity * unitPricePaise;
  };

  const addToCart = (product: Product, customQuantity?: number) => {
    // Default quantity: 1000g (1kg) for kg, 1 for bunch/piece
    const defaultQty = product.unit === 'kg' ? 1000 : 1;
    const qtyToAdd = customQuantity !== undefined ? customQuantity : defaultQty;

    const effectivePrice = calculateEffectivePrice(product);

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + qtyToAdd;
        // Check available quantity limit
        const cappedQty = Math.min(newQty, product.availableQuantity);
        const updated = [...prev];
        updated[existingIndex] = {
          product,
          quantity: cappedQty,
          unitPricePaise: effectivePrice,
          subtotalPaise: calculateSubtotal(product, cappedQty, effectivePrice),
        };
        return updated;
      } else {
        const cappedQty = Math.min(qtyToAdd, product.availableQuantity);
        return [
          ...prev,
          {
            product,
            quantity: cappedQty,
            unitPricePaise: effectivePrice,
            subtotalPaise: calculateSubtotal(product, cappedQty, effectivePrice),
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const effectivePrice = calculateEffectivePrice(item.product);
          const cappedQty = Math.min(quantity, item.product.availableQuantity);
          return {
            ...item,
            quantity: cappedQty,
            unitPricePaise: effectivePrice,
            subtotalPaise: calculateSubtotal(item.product, cappedQty, effectivePrice),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPaise = items.reduce((acc, item) => acc + item.subtotalPaise, 0);
  const totalItemsCount = items.length;

  const itemsGroupedByFarmer = items.reduce((groups, item) => {
    const farmerId = item.product.farmerId;
    if (!groups[farmerId]) {
      groups[farmerId] = {
        farmerName: item.product.farmerName || 'Local Farmer',
        farmName: item.product.farmName,
        locality: item.product.pickupLocality,
        items: [],
      };
    }
    groups[farmerId].items.push(item);
    return groups;
  }, {} as Record<string, { farmerName: string; farmName?: string; locality: string; items: CartItem[] }>);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPaise,
        totalItemsCount,
        itemsGroupedByFarmer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
