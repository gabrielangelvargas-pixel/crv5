import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { clearLoginFailures, loginRetryAfter, recordLoginFailure, requestIp } from "@/lib/login-rate-limit";

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

  const ip = requestIp(request);
  const retryAfter = loginRetryAfter(ip, input.data.username);

  if (retryAfter > 0) {
    return NextResponse.json(
      { error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(retryAfter / 60)} minutos.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const result = await authenticateUser(input.data.username, input.data.password);

    if (!result) {
      recordLoginFailure(ip, input.data.username);
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    clearLoginFailures(ip, input.data.username);

    const response = NextResponse.json({ user: result.user });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("No se pudo iniciar sesión", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }
}
