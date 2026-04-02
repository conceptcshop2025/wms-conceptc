import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

export async function PATCH(req: Request) {
  try {
    const { sku, bin_current_quantity, updated_at } = await req.json() as {
      sku: string;
      bin_current_quantity: number;
      updated_at: string;
    };

    await sql`
      UPDATE store_products
      SET
        bin_current_quantity = ${bin_current_quantity},
        updated_at = ${updated_at}
      WHERE sku = ${sku}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}