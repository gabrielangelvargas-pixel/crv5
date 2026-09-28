import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabasePool } from "@/lib/db";

const visitorCookieName = "crv4_visitor_id";

function cleanValue(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanedValue = value.trim();
  return cleanedValue ? cleanedValue.slice(0, maxLength) : null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const categoryId = Number(body.categoryId);

  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get(visitorCookieName)?.value;
  const visitorId = existingVisitorId ?? crypto.randomUUID();
  const source = cleanValue(body.source, 80);
  const medium = cleanValue(body.medium, 80);
  const campaign = cleanValue(body.campaign, 120);
  const pool = getDatabasePool();

  const [categories] = await pool.query(
    "SELECT id FROM categorias WHERE id = ? AND activa = 1 LIMIT 1",
    [categoryId],
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  await pool.query(
    `
      INSERT INTO categoria_visitas
        (categoria_id, visitante_id, fecha, visitas, fuente, medio, campania)
      VALUES (?, ?, CURDATE(), 1, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        visitas = visitas + 1,
        ultima_visita = CURRENT_TIMESTAMP,
        fuente = COALESCE(fuente, VALUES(fuente)),
        medio = COALESCE(medio, VALUES(medio)),
        campania = COALESCE(campania, VALUES(campania))
    `,
    [categoryId, visitorId, source, medium, campaign],
  );

  const response = NextResponse.json({ ok: true });

  if (!existingVisitorId) {
    response.cookies.set(visitorCookieName, visitorId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
}

