import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

export async function GET() {

  try {
    const result = await sql`
      SELECT * FROM product_list_to_restock ORDER BY date DESC;
    `;

    if (result.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}