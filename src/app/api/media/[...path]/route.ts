import { promises as fs } from "node:fs";
import path from "node:path";

const contentTypeByExtension: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function getAssetRoot() {
  const configuredRoot = process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.trim();

  if (!configuredRoot || /^https?:\/\//i.test(configuredRoot)) {
    return null;
  }

  return path.resolve(configuredRoot);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const assetRoot = getAssetRoot();
  const { path: assetPath } = await params;

  if (!assetRoot || assetPath.length < 2) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.resolve(assetRoot, ...assetPath);
  const rootPrefix = `${assetRoot}${path.sep}`;

  if (!filePath.startsWith(rootPrefix)) {
    return new Response("Invalid asset path", { status: 400 });
  }

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypeByExtension[extension] ?? "application/octet-stream",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

