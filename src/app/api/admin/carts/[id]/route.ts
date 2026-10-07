import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/authorization";
import { hasAllowedOrigin } from "@/lib/request-origin";
import { ConfirmedCartError, updateConfirmedCart } from "@/lib/confirmed-carts-repository";
const schema = z.object({ adjustments: z.array(z.object({ description: z.string().trim().min(1).max(120), amountCents: z.number().int().min(-100000000000).max(100000000000) })).max(50).optional(), version: z.number().int().nonnegative(), items: z.array(z.object({ productId: z.string().regex(/^[1-9][0-9]*$/).max(20), quantity: z.number().int().min(1).max(1000000), reserved: z.boolean().optional(), exhausted: z.boolean().optional() })).min(1).max(500) }).refine(v => new Set(v.items.map(i => i.productId)).size === v.items.length);
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });
    if (!canAccessAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const { id } = await context.params;
    const input = schema.safeParse(await request.json().catch(() => null));
    if (!z.uuid().safeParse(id).success || !input.success) return NextResponse.json({ error: "Revisá los conceptos, importes y cantidades. El carrito debe tener al menos un producto." }, { status: 400 });
    return NextResponse.json(await updateConfirmedCart(id, input.data));
  } catch (error) {
    if (error instanceof ConfirmedCartError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("No se pudo editar el carrito", error);
    return NextResponse.json({ error: "No se pudo guardar el carrito." }, { status: 503 });
  }
}