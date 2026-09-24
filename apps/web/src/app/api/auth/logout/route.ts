import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, hashSessionToken, sessionCookieOptions } from "@/server/auth";
import { database } from "@/server/db";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await database.query(
      "UPDATE sesiones SET revocada_en = NOW() WHERE token_hash = ?",
      [hashSessionToken(token)],
    );
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
