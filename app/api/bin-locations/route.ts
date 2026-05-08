import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

export async function GET() {
  try {
    const response = await sql`SELECT bin_location, bin_current_quantity FROM products`;

    const data = response;
    return NextResponse.json(data);
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}