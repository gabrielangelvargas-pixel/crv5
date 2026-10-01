import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "La creación de pedidos está pausada. Confirmá el carrito desde /api/cart/confirm." }, { status: 410 });
}
