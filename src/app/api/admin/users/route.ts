import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdministrator } from "@/lib/authorization";
import { createAdminUser, updateAdminUser } from "@/lib/users-repository";

const userSchema = z.object({
  name: z.string(),
  username: z.string(),
  password: z.string().optional(),
  roleId: z.string(),
  active: z.boolean(),
  address: z.object({
    label: z.enum(["casa", "trabajo", "deposito", "otro"]),
    phone: z.string().max(30),
    address: z.string().max(180),
    neighborhood: z.string().max(100),
    city: z.string().max(100),
    province: z.string().max(100),
    postalCode: z.string().max(15),
    reference: z.string().max(255),
  }).optional(),
});

async function requireAdministrator() {
  const user = await getCurrentUser();
  return user && isAdministrator(user) ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireAdministrator())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const parsed = userSchema.parse(await request.json());
    const input = { ...parsed, password: parsed.password, address: parsed.address };
    await createAdminUser(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el usuario";
    const status = message.includes("Duplicate") || message.includes("duplicate") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdministrator())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = z.string().parse(body.id);
    const parsed = userSchema.parse(body);
    const input = { ...parsed, password: parsed.password, address: parsed.address };
    await updateAdminUser(id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el usuario";
    const status = message.includes("Duplicate") || message.includes("duplicate") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
