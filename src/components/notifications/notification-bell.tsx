"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBell, FaXmark, FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
import { useAuth } from "@/components/auth/auth-provider";
import { hasRole } from "@/lib/authorization";
import type { CartNotification } from "@/lib/cart-notifications";
import { playNotificationSound } from "@/lib/notification-sound";

export function NotificationBell() {
  const { user } = useAuth();
  return user && hasRole(user, "admin", "administrador", "vendedor") ? <Notifications key={user.id} userId={user.id} /> : null;
}

function Notifications({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ unread: number; notifications: CartNotification[] }>({ unread: 0, notifications: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const [soundError, setSoundError] = useState("");
  const soundPreference = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const newestSeen = useRef<bigint | null>(null);
  const soundKey = `crv4-notification-sound-${userId}`;
  const unlockAudio = useCallback(async () => {
    try {
      audio.current ??= new AudioContext();
      if (audio.current.state !== "running") await audio.current.resume();
      if (mounted.current) { setSoundReady(audio.current.state === "running"); setSoundError(""); }
      return audio.current;
    } catch { if (mounted.current) setSoundError("No se pudo activar el sonido en este navegador."); return null; }
  }, []);
  const container = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const reading = useRef(false);
  const load = useCallback(async () => {
    if (busy.current || reading.current) return;
    busy.current = true;
    try {
      const response = await fetch("/api/notifications", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("No se pudieron cargar los avisos.");
      const result = await response.json();
      if (mounted.current) {
        const notifications = result.notifications as CartNotification[];
        const newest = notifications.reduce((max, n) => BigInt(n.id) > max ? BigInt(n.id) : max, 0n);
        const hasNew = newestSeen.current !== null && notifications.some(n => !n.read && BigInt(n.id) > newestSeen.current!);
        newestSeen.current = newestSeen.current === null || newest > newestSeen.current ? newest : newestSeen.current;
        if (hasNew && soundPreference.current && audio.current) {
          try { if (!playNotificationSound(audio.current)) setSoundReady(false); }
          catch { setSoundReady(false); setSoundError("No se pudo reproducir el sonido. Volvé a activarlo."); }
        }
        setData(result); setLoaded(true); setError("");
      }
    } catch { if (mounted.current) setError("No se pudieron cargar los avisos. Reintentá en unos segundos."); }
    finally { busy.current = false; }
  }, []);
  useEffect(() => {
    try { soundPreference.current = localStorage.getItem(soundKey) === "true"; setSoundEnabled(soundPreference.current); } catch { /* Sound can still be enabled for this visit. */ }
    const unlock = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-notification-sound-control]")) return;
      if (soundPreference.current) void unlockAudio();
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => { document.removeEventListener("pointerdown", unlock); document.removeEventListener("keydown", unlock); const context = audio.current; audio.current = null; if (context && context.state !== "closed") void context.close().catch(() => {}); };
  }, [soundKey, unlockAudio]);
  async function toggleSound() {
    const enabled = !(soundEnabled && soundReady);
    soundPreference.current = enabled;
    setSoundEnabled(enabled);
    setSoundError("");
    try { localStorage.setItem(soundKey, String(enabled)); } catch { /* Keep the preference for this visit. */ }
    if (enabled) {
      const context = await unlockAudio();
      if (context && mounted.current && soundPreference.current) {
        try { playNotificationSound(context); } catch { setSoundReady(false); setSoundError("No se pudo reproducir el sonido."); }
      }
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    const outside = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("visibilitychange", visible);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { mounted.current = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, [load]);
  async function read(id?: string) {
    if (reading.current) return;
    reading.current = true;
    setSaving(true);
    try {
      // Finish older reads before the mutation so a stale response cannot restore the badge.
      while (busy.current && mounted.current) await new Promise(resolve => window.setTimeout(resolve, 25));
      if (!mounted.current) return;
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("read");
      if (mounted.current) { setData(current => ({ ...current, unread: id ? Math.max(0, current.unread - (current.notifications.find(n => n.id === id)?.read ? 0 : 1)) : 0, notifications: current.notifications.map(n => !id || n.id === id ? { ...n, read: true } : n) })); }
    } catch { if (mounted.current) setError("No se pudo marcar el aviso como leído."); }
    finally { reading.current = false; if (mounted.current) setSaving(false); }
  }
  return <div ref={container} className="ml-1">
    <button type="button" aria-label={`Notificaciones, ${data.unread} sin leer`} aria-expanded={open} aria-controls="cart-notifications" className="relative flex size-11 items-center justify-center hover:bg-black/5" onClick={() => { setOpen(!open); if (!open) void load(); }}>
      <FaBell aria-hidden="true" className="size-5" />
      {data.unread > 0 ? <span className="absolute right-0 top-0 rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-5 text-white">{data.unread > 99 ? "99+" : data.unread}</span> : null}
    </button>
    {open ? <section id="cart-notifications" aria-label="Notificaciones de carritos" className="fixed right-3 top-20 w-[calc(100vw-1.5rem)] max-w-sm border border-black/10 bg-white text-foreground shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b p-3"><h2 className="font-bold">Notificaciones</h2><button type="button" aria-label="Cerrar notificaciones" className="flex size-10 items-center justify-center" onClick={() => setOpen(false)}><FaXmark aria-hidden="true" /></button></div>
      <div className="border-b p-3">
        <button type="button" data-notification-sound-control onClick={() => void toggleSound()} className="flex min-h-10 items-center gap-2 text-sm font-bold">{soundEnabled && soundReady ? <FaVolumeHigh aria-hidden="true" /> : <FaVolumeXmark aria-hidden="true" />}{soundEnabled && soundReady ? "Silenciar avisos" : "Activar sonido"}</button>
        <p className="text-xs text-foreground/60">{soundEnabled && soundReady ? "Sonará cuando llegue un aviso nuevo con la app visible." : "Activá el sonido para escuchar los avisos nuevos. Se reproducirá una prueba."}</p>
        {soundError ? <p role="alert" className="mt-1 text-xs text-red-700">{soundError}</p> : null}
      </div>
      {data.unread > 0 ? <button type="button" disabled={saving} className="m-3 text-sm underline disabled:opacity-40" onClick={() => void read()}>Marcar todas como leídas</button> : null}
      {error ? <p role="alert" className="px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <ul className="max-h-[60vh] overflow-y-auto">{data.notifications.map(n => <li key={n.id} className={`border-t p-3 ${n.read ? "" : "bg-emerald-50"}`}>
        <Link href={`/admin/carritos?carrito=${n.cartId}#carrito-${n.cartId}`} className="block" onClick={() => { if (!n.read) void read(n.id); setOpen(false); }}>
          <p className="text-sm font-bold">{n.customer} envió un carrito a revisión{!n.read ? <span className="ml-2 inline-block size-2 rounded-full bg-emerald-600" aria-label="Sin leer" /> : null}</p>
          <p className="mt-1 text-xs">{n.products} {n.products === 1 ? "producto" : "productos"} · {n.units} unidades · {n.total.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
          <p className="mt-1 text-xs text-foreground/60">{new Date(n.created).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires", hourCycle: "h23" })}</p>
          <span className="mt-2 block text-xs font-bold text-emerald-700">Ver carrito →</span>
        </Link>
      </li>)}</ul>
      {!data.notifications.length ? <p className="p-4 text-sm">{loaded ? "No tenés notificaciones todavía." : "Cargando avisos…"}</p> : null}
    </section> : null}
  </div>;
}
