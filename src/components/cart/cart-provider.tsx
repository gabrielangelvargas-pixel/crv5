"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { normalizeCart, type CartItem } from "@/lib/cart";

const STORAGE_KEY = "crv4-cart-v1";
type CartContextValue = {
  items: CartItem[]; products: Product[]; ready: boolean; storageError: boolean;
  addItem: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try { setItems(normalizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"), products)); }
    catch { setStorageError(true); }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try { setItems(normalizeCart(JSON.parse(event.newValue ?? "[]"), products)); }
      catch { setStorageError(true); }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [products]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch { setStorageError(true); }
  }, [items, ready]);
  function addItem(productId: string, quantity: number) {
    if (!ready || !Number.isSafeInteger(quantity) || quantity < 1) return;
    setItems((current) => normalizeCart([...current, { productId, quantity }], products));
  }
  function setQuantity(productId: string, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    setItems((current) => normalizeCart(current.map((item) => item.productId === productId ? { productId, quantity } : item), products));
  }
  function removeItem(productId: string) { setItems((current) => current.filter((item) => item.productId !== productId)); }
  return <CartContext.Provider value={{ items, products, ready, storageError, addItem, setQuantity, removeItem }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe utilizarse dentro de CartProvider");
  return context;
}
