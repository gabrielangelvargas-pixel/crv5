import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/authorization";
import { hasAllowedOrigin } from "@/lib/request-origin";
import { OrderError, updateOrder } from "@/lib/orders-repository";
const line = z.object({ productId: z.string(), code: z.string(), name: z.string(), variant: z.string().nullable(), quantity: z.number(), unitPrice: z.number(), subtotal: z.number() });
const schema = z.object({ original: z.array(line).max(500), items: z.array(z.object({ productId: z.string().regex(/^\d+$/).max(30), quantity: z.number().int().min(1).max(1000000) })).min(1).max(500) }).refine(v => new Set(v.items.map(i => i.productId)).size === v.items.length);
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no autorizado" }, { status: 403 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });
    if (!hasRole(user, "admin", "administrador", "vendedor", "supervisor")) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const { id } = await context.params;
    const input = schema.safeParse(await request.json().catch(() => null));
    if (!z.uuid().safeParse(id).success || !input.success) return NextResponse.json({ error: "Revisá las cantidades. El pedido debe tener al menos un producto." }, { status: 400 });
    return NextResponse.json(await updateOrder(id, input.data.original, input.data.items));
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("No se pudo editar el pedido", error);
    return NextResponse.json({ error: "No se pudo guardar el pedido." }, { status: 503 });
  }
}