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

  const root = path.resolve(configuredRoot);
  return path.basename(root).toLowerCase() === "productos" ? path.dirname(root) : root;
}

export async function GET(
  request: Request,
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
    const stats = await fs.stat(filePath);
    const etag = `"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
    // Uploads overwrite the same file name, so only URLs carrying a content version (?v=) are immutable.
    const headers = {
      "Cache-Control": new URL(request.url).searchParams.has("v")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
      ETag: etag,
      "Last-Modified": stats.mtime.toUTCString(),
    };

    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers });
    }

    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return new Response(file, {
      headers: {
        ...headers,
        "Content-Type": contentTypeByExtension[extension] ?? "application/octet-stream",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
