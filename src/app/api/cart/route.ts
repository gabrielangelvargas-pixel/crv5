import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAllowedOrigin } from "@/lib/request-origin";
import { getCurrentUser } from "@/lib/auth";
import { CART_COOKIE, synchronizeCart } from "@/lib/carts-repository";

export const runtime = "nodejs";
const schema = z.object({ items: z.array(z.object({ productId: z.string().regex(/^[1-9][0-9]*$/).max(20), quantity: z.number().int().positive().max(1000000) })).max(500), version: z.number().int().nonnegative().optional() });

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Carrito inválido" }, { status: 400 });
  try {
    const user = await getCurrentUser();
    const token = (await cookies()).get(CART_COOKIE)?.value;
    const result = await synchronizeCart(user?.id ?? null, token, input.data);
    const response = NextResponse.json({ id: result.id, adjustments: result.adjustments ?? [], items: result.items, version: result.version, status: result.status, lines: result.lines, total: result.total, stock: result.stock ?? {} }, { status: result.conflict ? 409 : 200, headers: { "Cache-Control": "no-store" } });
    if (result.newToken) response.cookies.set(CART_COOKIE, result.newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180 });
    if (result.clearToken) response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) {
    console.error("No se pudo sincronizar el carrito", error);
    return NextResponse.json({ error: "No se pudo sincronizar el carrito" }, { status: 503 });
  }
}
