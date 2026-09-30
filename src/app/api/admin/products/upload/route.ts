import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/authorization";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function getAssetRoot() {
  const configuredRoot = process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.trim();
  if (!configuredRoot || /^https?:\/\//i.test(configuredRoot)) return null;
  const root = path.resolve(configuredRoot);
  return path.basename(root).toLowerCase() === "productos" ? root : path.join(root, "productos");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, "admin", "administrador", "vendedor", "supervisor")) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const formData = await request.formData();
  const file = formData.get("file");
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(formData.get("slug"));
  if (!(file instanceof File) || !slug.success) return NextResponse.json({ error: "Archivo o slug inválido" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Selecciona una imagen válida" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "La imagen no puede superar 15 MB" }, { status: 400 });
  const root = getAssetRoot();
  if (!root) return NextResponse.json({ error: "No está configurada la ruta de imágenes del servidor" }, { status: 500 });
  const filePath = path.resolve(root, `${slug.data}.webp`);
  const rootPrefix = `${path.resolve(root)}${path.sep}`;
  if (!filePath.startsWith(rootPrefix)) return NextResponse.json({ error: "Ruta de imagen inválida" }, { status: 400 });
  try {
    await fs.mkdir(root, { recursive: true });
    const buffer = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1200 }).webp({ quality: 82, effort: 4 }).toBuffer();
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ path: `/productos/${slug.data}.webp` });
  } catch (error) {
    console.error("No se pudo procesar la imagen de producto", error);
    return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 500 });
  }
}
