import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { type BinProps } from "@/app/types/types";

const sql = neon(process.env.DATABASE_URL || "");
const CHUNK_SIZE = 25;

async function upsertProduct(location: BinProps) {
  try {
    await sql`
      SELECT sku, bin_current_quantity FROM store_products WHERE bin_location = '${location.id}'
    `;
    return { success: true, location };
  } catch (error) {
    return { success: false, location, error: String(error) };
  }
}

export async function POST(req: Request) {
  try {
    const locations: BinProps[] = await req.json();
    const failed: { location: BinProps; error: string }[] = [];

    for (let i = 0; i < locations.length; i += CHUNK_SIZE) {
      const chunk = locations.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(chunk.map(upsertProduct));

      for (const r of results) {
        if (!r.success) {
          failed.push({ location: r.location, error: r.error || "Unknown error" });
        }
      }
    }

    console.log(NextResponse.json({
      success: failed.length === 0,
      count: locations.length,
      failedCount: failed.length,
      failed,
    }));

    return NextResponse.json({
        data: locations,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}