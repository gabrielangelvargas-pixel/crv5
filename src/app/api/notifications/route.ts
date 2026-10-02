import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasAllowedOrigin } from "@/lib/request-origin";
import { getCartNotifications, readCartNotification } from "@/lib/cart-notifications";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });
    return NextResponse.json(await getCartNotifications(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("No se pudieron consultar las notificaciones", error);
    return NextResponse.json({ error: "No se pudieron cargar los avisos." }, { status: 503 });
  }
}
export async function PATCH(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });
    const input = z.union([z.object({ id: z.string().regex(/^[1-9][0-9]*$/).max(20) }), z.object({ all: z.literal(true) })]).safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ error: "Aviso inválido." }, { status: 400 });
    await readCartNotification(user.id, "id" in input.data ? input.data.id : undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("No se pudo marcar el aviso", error);
    return NextResponse.json({ error: "No se pudo guardar la lectura." }, { status: 503 });
  }
}
