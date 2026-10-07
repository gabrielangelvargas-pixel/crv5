import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/authorization";
import { contentVersion } from "@/lib/asset-url";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const kindSchema = z.enum(["image", "cover"]);

function getAssetRoot() {
  const configuredRoot = process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.trim();
  if (!configuredRoot || /^https?:\/\//i.test(configuredRoot)) return null;
  const root = path.resolve(configuredRoot);
  return path.basename(root).toLowerCase() === "productos" ? path.dirname(root) : root;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, "admin", "administrador")) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(formData.get("slug"));
  const kind = kindSchema.safeParse(formData.get("kind"));

  if (!(file instanceof File) || !slug.success || !kind.success) return NextResponse.json({ error: "Archivo o datos inválidos" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Selecciona una imagen válida" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "La imagen no puede superar 15 MB" }, { status: 400 });

  const root = getAssetRoot();
  if (!root) return NextResponse.json({ error: "No está configurada la ruta de imágenes del servidor" }, { status: 500 });

  const directory = kind.data === "cover" ? "portadas" : "categorias";
  const filePath = path.resolve(root, directory, `${slug.data}.webp`);
  const rootPrefix = `${path.resolve(root, directory)}${path.sep}`;
  if (!filePath.startsWith(rootPrefix)) return NextResponse.json({ error: "Ruta de imagen inválida" }, { status: 400 });

  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1200 })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ path: `/${directory}/${slug.data}.webp?v=${contentVersion(buffer)}` });
  } catch (error) {
    console.error("No se pudo procesar la imagen de categoría", error);
    return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 500 });
  }
}
