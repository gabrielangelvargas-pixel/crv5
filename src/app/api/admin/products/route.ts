import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/authorization";
import { saveAdminProduct } from "@/lib/admin-products-repository";
import { CATALOG_TAG } from "@/lib/products-repository";

const productSchema = z.object({
  id: z.string().optional(), groupId: z.string().nullable(), newGroupName: z.string().max(180), newGroupSlug: z.string().max(200), categoryId: z.string(),
  code: z.string().trim().min(1).max(13), name: z.string().trim().min(2).max(180), variantName: z.string().max(80), slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(5000), costPrice: z.number().nonnegative().max(9999999999.99), salePrice: z.number().nonnegative(), offerPrice: z.number().nonnegative().nullable(), stock: z.number().int().nonnegative(), imageUrl: z.string().max(500), order: z.number().int().nonnegative(), active: z.boolean(),
  priceTiers: z.array(z.object({ minimumQuantity: z.number().int().positive(), unitPrice: z.number().nonnegative() })).max(20),
});

async function requireCommercialUser() {
  const user = await getCurrentUser();
  return user && hasRole(user, "admin", "administrador", "vendedor", "supervisor") ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireCommercialUser())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const input = productSchema.parse(await request.json());
    await saveAdminProduct({ ...input, id: input.id });
    revalidateTag(CATALOG_TAG);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el producto";
    const duplicate = message.toLowerCase().includes("duplicate");
    return NextResponse.json({ error: duplicate ? "El código, slug o grupo ya existe" : message }, { status: 400 });
  }
}
