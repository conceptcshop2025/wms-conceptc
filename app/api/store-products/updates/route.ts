import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

/**
 * Returns the products whose `updated_at` is greater than the `since`
 * timestamp passed as a query param. Used by the client to poll for
 * real-time changes and re-render only the modified products.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");

    if (!since) {
      return NextResponse.json(
        { error: "Missing 'since' query parameter" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT
        id,
        title,
        variant_title,
        image_url,
        vendor,
        product_type,
        updated_at,
        bin_max_quantity,
        bin_current_quantity,
        bin_location,
        inventory_quantity,
        b_alias,
        status,
        sku,
        barcode,
        parent_id,
        expiration
      FROM store_products
      WHERE updated_at > ${since}
      ORDER BY updated_at ASC
    `;

    return NextResponse.json({ products: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
