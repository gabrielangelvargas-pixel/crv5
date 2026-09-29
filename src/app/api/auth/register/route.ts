import { NextResponse } from "next/server";
import { z } from "zod";
import { registerCustomer, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(128),
});

function isDuplicateError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = registerSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json(
      { error: "Completá nombre, usuario y una contraseña de al menos 8 caracteres" },
      { status: 400 },
    );
  }

  try {
    const result = await registerCustomer(input.data.name, input.data.username, input.data.password);
    const response = NextResponse.json({ user: result.user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (isDuplicateError(error)) {
      return NextResponse.json({ error: "Ese usuario ya está registrado" }, { status: 409 });
    }

    console.error("No se pudo registrar el cliente", error);
    return NextResponse.json({ error: "No se pudo crear la cuenta" }, { status: 500 });
  }
}
