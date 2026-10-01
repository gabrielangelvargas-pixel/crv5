"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { normalizeCart, type CartItem } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[]; products: Product[]; ready: boolean; storageError: boolean; syncError: boolean;
  addItem: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ products, children, userId = null }: { products: Product[]; children: ReactNode; userId?: string | null }) {
  const storageKey = userId ? `crv4-cart-user-${userId}` : "crv4-cart-v1";
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const version = useRef<number | undefined>(undefined);
  const acknowledged = useRef("[]");
  const currentItems = useRef(items);
  const productsRef = useRef(products);
  const dirty = useRef(false);
  const syncNow = useRef<() => void>(() => {});
  currentItems.current = items;
  productsRef.current = products;

  useEffect(() => {
    let cancelled = false;
    let busy = false;
    let nextAttemptAt = 0;
    const controller = new AbortController();
    let local: CartItem[] = [];
    let cachedVersion: number | undefined;
    try {
      local = normalizeCart(JSON.parse(localStorage.getItem(storageKey) ?? (userId ? localStorage.getItem("crv4-cart-v1") : null) ?? "[]"), productsRef.current);
      const metadata = JSON.parse(localStorage.getItem(`${storageKey}-sync`) ?? "{}");
      dirty.current = metadata.pending === true;
      if (Number.isInteger(metadata.version) && metadata.version >= 0) cachedVersion = metadata.version;
      if (dirty.current) version.current = cachedVersion;
    }
    catch { setStorageError(true); }
    currentItems.current = local;
    setItems(local);
    async function request(payload: object) {
      const requestController = new AbortController();
      const abort = () => requestController.abort();
      controller.signal.addEventListener("abort", abort);
      const timeout = window.setTimeout(abort, 10000);
      try {
        const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: requestController.signal });
        if (!response.ok && response.status !== 409) throw new Error("sync");
        const data = await response.json();
        if (!Array.isArray(data.items) || !Number.isInteger(data.version)) throw new Error("response");
        return { items: normalizeCart(data.items, productsRef.current), version: data.version as number, conflict: response.status === 409 };
      } finally { window.clearTimeout(timeout); controller.signal.removeEventListener("abort", abort); }
    }
    async function sync() {
      if (busy || cancelled || Date.now() < nextAttemptAt) return;
      busy = true;
      try {
        if (dirty.current && version.current === undefined && cachedVersion !== undefined) version.current = cachedVersion;
        if (version.current === undefined) {
          const remote = await request({ items: local });
          if (cancelled) return;
          version.current = remote.version;
          if (!dirty.current) {
            acknowledged.current = JSON.stringify(remote.items);
            currentItems.current = remote.items;
            setItems(remote.items);
            if (userId) {
              try { localStorage.removeItem("crv4-cart-v1"); } catch { setStorageError(true); }
            }
          } else {
            // Preserve remote variants that were not edited while the initial request was offline.
            const draft = new Map(remote.items.map((item) => [item.productId, item.quantity]));
            const base = new Map(local.map((item) => [item.productId, item.quantity]));
            const pending = new Map(currentItems.current.map((item) => [item.productId, item.quantity]));
            for (const id of new Set([...base.keys(), ...pending.keys()])) {
              if ((base.get(id) ?? 0) === (pending.get(id) ?? 0)) continue;
              if (pending.has(id)) draft.set(id, pending.get(id)!);
              else draft.delete(id);
            }
            currentItems.current = normalizeCart(Array.from(draft, ([productId, quantity]) => ({ productId, quantity })), productsRef.current);
            setItems(currentItems.current);
            acknowledged.current = JSON.stringify(remote.items);
          }
        }
        const snapshot = JSON.stringify(currentItems.current);
        if (dirty.current || snapshot !== acknowledged.current) {
          const remote = await request({ items: JSON.parse(snapshot), version: version.current });
          if (cancelled) return;
          version.current = remote.version;
          acknowledged.current = JSON.stringify(remote.items);
          if (remote.conflict || snapshot === JSON.stringify(currentItems.current)) {
            dirty.current = false;
            currentItems.current = remote.items;
            setItems(remote.items);
          }
          setSyncError(remote.conflict);
        } else {
          setSyncError(false);
        }
      } catch { nextAttemptAt = Date.now() + 15000; if (!cancelled) setSyncError(true); }
      finally { busy = false; if (!cancelled) setReady(true); }
    }
    syncNow.current = () => { void sync(); };
    void sync();
    const timer = window.setInterval(() => void sync(), 2000);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      // Fetch server state instead of writing another tab's snapshot over it.
      if (!dirty.current) { version.current = undefined; void sync(); }
    };
    window.addEventListener("storage", onStorage);
    const flush = () => {
      if (busy || !dirty.current || version.current === undefined) return;
      void fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: currentItems.current, version: version.current }), keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    const reconnect = () => { nextAttemptAt = 0; void sync(); };
    window.addEventListener("online", reconnect);
    return () => { cancelled = true; controller.abort(); window.clearInterval(timer); window.removeEventListener("storage", onStorage); window.removeEventListener("pagehide", flush); window.removeEventListener("online", reconnect); };
  }, [storageKey, userId]);

  useEffect(() => { if (ready && dirty.current) syncNow.current(); }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      localStorage.setItem(`${storageKey}-sync`, JSON.stringify({ pending: dirty.current, version: version.current }));
    }
    catch { setStorageError(true); }
  }, [items, ready, storageKey]);

  function addItem(productId: string, quantity: number) {
    if (!ready || !Number.isSafeInteger(quantity) || quantity < 1) return;
    dirty.current = true;
    setItems((current) => normalizeCart([...current, { productId, quantity }], products));
  }
  function setQuantity(productId: string, quantity: number) {
    if (!ready || !Number.isSafeInteger(quantity) || quantity < 1) return;
    dirty.current = true;
    setItems((current) => normalizeCart(current.map((item) => item.productId === productId ? { productId, quantity } : item), products));
  }
  function removeItem(productId: string) {
    if (!ready) return;
    dirty.current = true;
    setItems((current) => current.filter((item) => item.productId !== productId));
  }
  return <CartContext.Provider value={{ items, products, ready, storageError, syncError, addItem, setQuantity, removeItem }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe utilizarse dentro de CartProvider");
  return context;
}
