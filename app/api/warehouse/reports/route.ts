import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

interface warehouseReportRow {
  id: string;
  name: string;
  totalProducts: string;
  totalPrice: string;
  totalCosts: string;
  totalCommitted: string;
}

const sql = neon(process.env.DATABASE_URL || "");
const CHUNK_SIZE = 25;

async function upsertWarehouse(warehouse: warehouseReportRow) {
  try {
    await sql`
      INSERT INTO warehouse_reports (
        warehouse_id,
        warehouse_name,
        total_products,
        total_price,
        total_costs,
        total_committed
      )
      VALUES (
        ${warehouse.id},
        ${warehouse.name},
        ${warehouse.totalProducts},
        ${warehouse.totalPrice},
        ${warehouse.totalCosts},
        ${warehouse.totalCommitted}
      ) returning id
    `;
    return { success: true, warehouse };
  } catch (error) {
    return { success: false, warehouse, error: String(error) };
  }
}

export async function POST(req: Request) {
  try {
    const warehouses: warehouseReportRow[] = await req.json();
    const failed: { warehouse: warehouseReportRow; error: string }[] = [];

    for (let i = 0; i < warehouses.length; i += CHUNK_SIZE) {
      const chunk = warehouses.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(chunk.map(upsertWarehouse));

      for (const r of results) {
        if (!r.success) {
          failed.push({ warehouse: r.warehouse, error: r.error || "Unknown error" });
        }
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      count: warehouses.length,
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

