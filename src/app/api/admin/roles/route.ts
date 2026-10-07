import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdministrator } from "@/lib/authorization";
import { saveAdminRole } from "@/lib/roles-repository";

const roleSchema = z.object({ id: z.string().optional(), code: z.string().trim().min(2).max(40), name: z.string().trim().min(2).max(100), description: z.string().max(1000), active: z.boolean(), permissionIds: z.array(z.string()) });

async function requireAdministrator() {
  const user = await getCurrentUser();
  return user && isAdministrator(user) ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireAdministrator())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const input = roleSchema.parse(await request.json());
    await saveAdminRole(input.id, input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el rol";
    return NextResponse.json({ error: message.includes("Duplicate") ? "Ese código de rol ya existe" : message }, { status: 400 });
  }
}
