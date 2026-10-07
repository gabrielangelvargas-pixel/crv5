/** Short content hash appended as ?v= so a re-uploaded image gets a new, cacheable URL. */
export function contentVersion(content: Uint8Array) {
  let hash = 0x811c9dc5;
  for (const byte of content) hash = Math.imul(hash ^ byte, 0x01000193);
  return (hash >>> 0).toString(36);
}

const configuredAssetBaseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.trim();
const assetBaseUrl = configuredAssetBaseUrl?.replace(/\/+$/, "") || null;

function normalizeAssetPath(value: string) {
  return value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/?public\//i, "")
    .replace(/^\/?imagenes\//i, "")
    .replace(/^\/+/, "");
}

export function getAssetUrl(value: string | null, directory: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().replaceAll("\\", "/");

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const normalizedPath = normalizeAssetPath(normalizedValue).replace(
    new RegExp(`^${directory}/`, "i"),
    "",
  );

  if (assetBaseUrl) {
    if (!/^https?:\/\//i.test(assetBaseUrl)) {
      return `/api/media/${directory}/${normalizedPath}`;
    }

    return `${assetBaseUrl}/${directory}/${normalizedPath}`;
  }

  return `/${normalizedPath}`;
}

