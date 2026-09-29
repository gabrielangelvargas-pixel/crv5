import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({ user: await getCurrentUser() });
  } catch (error) {
    console.error("No se pudo consultar la sesión", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
