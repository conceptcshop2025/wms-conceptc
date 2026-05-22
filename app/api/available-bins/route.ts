import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

export async function POST(req: Request) {
  try {
    const locations: string[] = await req.json();

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const query = await sql`
      SELECT sku, inventory_quantity, bin_location 
      FROM store_products
    `;
    
    return NextResponse.json({
      data: query,
    });

  } catch (error) {
    console.error("Error en DB:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}