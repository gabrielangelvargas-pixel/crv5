import { NextResponse } from "next/server";
import { z } from "zod";
import { registerCustomer, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(128),
  address: z.object({
    label: z.enum(["casa", "trabajo", "deposito", "otro"]),
    phone: z.string().trim().min(6).max(30),
    address: z.string().trim().min(3).max(180),
    neighborhood: z.string().trim().max(100),
    city: z.string().trim().min(2).max(100),
    province: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(15),
    reference: z.string().trim().max(255),
  }),
});

function isDuplicateError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = registerSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json(
      { error: "Completá todos los datos requeridos para crear tu cuenta" },
      { status: 400 },
    );
  }

  try {
    const result = await registerCustomer(input.data.name, input.data.username, input.data.password, input.data.address);
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
