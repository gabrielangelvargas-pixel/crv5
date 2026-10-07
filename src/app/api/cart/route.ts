import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAllowedOrigin } from "@/lib/request-origin";
import { getCurrentUser } from "@/lib/auth";
import { CART_COOKIE, readCart, synchronizeCart } from "@/lib/carts-repository";
import { getCartProducts } from "@/lib/products-repository";

export const runtime = "nodejs";
const schema = z.object({ items: z.array(z.object({ productId: z.string().regex(/^[1-9][0-9]*$/).max(20), quantity: z.number().int().positive().max(1000000) })).max(500), version: z.number().int().nonnegative().optional() });

/** Lightweight read used for periodic polling. The ETag lets unchanged carts answer 304 without a body. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const token = (await cookies()).get(CART_COOKIE)?.value;
    const result = await readCart(user?.id ?? null, token);
    const products = await getCartProducts(result.items.map((item) => item.productId), result.stock);
    const body = JSON.stringify({ ...result, products });
    const etag = `"${createHash("sha1").update(body).digest("base64url")}"`;
    const headers = { "Cache-Control": "private, no-cache", ETag: etag, Vary: "Cookie" };
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
    return new Response(body, { headers: { ...headers, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("No se pudo leer el carrito", error);
    return NextResponse.json({ error: "No se pudo leer el carrito" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Carrito inválido" }, { status: 400 });
  try {
    const user = await getCurrentUser();
    const token = (await cookies()).get(CART_COOKIE)?.value;
    const result = await synchronizeCart(user?.id ?? null, token, input.data);
    // Only the cart's own products are sent; the client no longer receives the whole catalog.
    const products = await getCartProducts(result.items.map((item) => item.productId), result.stock);
    const response = NextResponse.json({ id: result.id, adjustments: result.adjustments ?? [], items: result.items, products, version: result.version, status: result.status, lines: result.lines, total: result.total, stock: result.stock ?? {} }, { status: result.conflict ? 409 : 200, headers: { "Cache-Control": "no-store" } });
    if (result.newToken) response.cookies.set(CART_COOKIE, result.newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180 });
    if (result.clearToken) response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) {
    console.error("No se pudo sincronizar el carrito", error);
    return NextResponse.json({ error: "No se pudo sincronizar el carrito" }, { status: 503 });
  }
}
