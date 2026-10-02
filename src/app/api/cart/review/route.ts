import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasAllowedOrigin } from "@/lib/request-origin";
import { ConfirmedCartError } from "@/lib/confirmed-carts-repository";
import { respondToCartReview } from "@/lib/cart-review-repository";
const schema = z.object({ cartId: z.uuid(), version: z.number().int().nonnegative(), action: z.enum(["continue", "accept"]), expectedTotalCents: z.number().int().nonnegative().max(99999999999999).optional() }).refine(input => input.action !== "accept" || input.expectedTotalCents !== undefined);
export async function POST(request: Request) {
 if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
 try {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Revisá los datos del carrito." }, { status: 400 });
  return NextResponse.json(await respondToCartReview(user.id, input.data));
 } catch (error) {
  if (error instanceof ConfirmedCartError) return NextResponse.json({ error: error.message }, { status: 409 });
  console.error("No se pudo responder a la revisión", error);
  return NextResponse.json({ error: "No se pudo procesar el carrito." }, { status: 503 });
 }
}
