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

