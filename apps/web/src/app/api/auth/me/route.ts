import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ usuario: user }, { headers: { "Cache-Control": "no-store" } });
}
