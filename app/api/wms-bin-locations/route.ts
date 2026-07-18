import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { type WmsBinLocationProps, type BinsToModifyProps } from "@/app/types/types";

const sql = neon(process.env.DATABASE_URL || "");
const CHUNK_SIZE = 25;

async function upsertProduct(location: WmsBinLocationProps) {
  try {
    await sql`
      INSERT INTO wms_bin_locations (
        id,
        sku,
        bin_quantity
      )
      VALUES (
      ${location},
      '',
      0
      )
    `;
    return { success: true, location };
  } catch (error) {
    return { success: false, location, error: String(error) };
  }
}

export async function GET() {
  try {
    const response = await sql`SELECT id, sku, bin_quantity FROM wms_bin_locations`;

    const data = response;
    return NextResponse.json(data);
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const locations: WmsBinLocationProps[] = await req.json();
    const failed: { location: WmsBinLocationProps; error: string }[] = [];

    for (let i = 0; i < locations.length; i += CHUNK_SIZE) {
      const chunk = locations.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(chunk.map(upsertProduct));

      for (const r of results) {
        if (!r.success) {
          failed.push({ location: r.location, error: r.error || "Unknown error" });
        }
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      count: locations.length,
      failedCount: failed.length,
      failed,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {

  const { id, sku, bin_quantity } = await req.json() as BinsToModifyProps;

  try {
    await sql`
      UPDATE wms_bin_locations SET sku = ${ sku }, bin_quantity = ${ bin_quantity } WHERE id = ${ id }
    `;

    return NextResponse.json(
      {data: {id, sku, bin_quantity}},
      {status: 200}
    );
  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}