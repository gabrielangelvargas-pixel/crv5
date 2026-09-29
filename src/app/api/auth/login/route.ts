import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = loginSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json({ error: "Usuario y contraseña son obligatorios" }, { status: 400 });
  }

  try {
    const result = await authenticateUser(input.data.username, input.data.password);

    if (!result) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    const response = NextResponse.json({ user: result.user });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("No se pudo iniciar sesión", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }
}
