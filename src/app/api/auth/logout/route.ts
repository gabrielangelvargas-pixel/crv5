import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeSession, SESSION_COOKIE } from "@/lib/auth";
import { CART_COOKIE } from "@/lib/carts-repository";

export async function POST() {
  const cookieStore = await cookies();
  await revokeSession(cookieStore.get(SESSION_COOKIE)?.value);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(CART_COOKIE);
  return response;
}
