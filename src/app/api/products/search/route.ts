import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
  return NextResponse.json(
    { products: await searchProducts(query) },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
