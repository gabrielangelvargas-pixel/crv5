import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { confirmCart, ConfirmedCartError } from "@/lib/confirmed-carts-repository";
import { hasAllowedOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
const schema = z.object({ version: z.number().int().nonnegative(), expectedTotalCents: z.number().int().nonnegative().max(99999999999999), delivery: z.object({ method: z.enum(["retiro", "envio"]), addressId: z.string().regex(/^\d+$/).max(20).nullable().optional(), phone: z.string().trim().min(6).max(30), address: z.string().trim().max(500), notes: z.string().trim().max(1000) }).refine((value) => value.method === "retiro" || Boolean(value.addressId)) });

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Iniciá sesión o registrate para confirmar el carrito." }, { status: 401 });
    const input = schema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ error: "Completá el teléfono y los datos de entrega." }, { status: 400 });
    const result = await confirmCart(user.id, input.data);
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ConfirmedCartError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("No se pudo confirmar el carrito", error);
    return NextResponse.json({ error: "No se pudo guardar el carrito. Podés reintentar." }, { status: 503 });
  }
}
