import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { fetchRecentSales } from "../../../lib/data/fetchRecentSales";

const sql = neon(process.env.DATABASE_URL || "");

// Run on the Node.js runtime and never cache: this is a scheduled job.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hourly cron job (configured in vercel.json) that performs, server-side, the
 * same work the ".get-selled-products-button" used to trigger on click:
 *   1. Read the last sync date.
 *   2. Fetch the recent paid sales from Shopify since that date.
 *   3. Subtract the sold quantities from each product in the DB.
 *   4. Record the new sync date.
 *
 * Runs even when no device is using the app.
 */
export async function GET(req: Request) {
  // Protect the endpoint: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  try {
    // 1. Last sync date
    const lastRow = await sql`
      SELECT last_date FROM history_sales ORDER BY last_date DESC LIMIT 1;
    `;
    const lastSyncDate: string | null = lastRow[0]?.last_date ?? null;

    if (!lastSyncDate) {
      console.error("[cron/sync-sales] No sync date found in history_sales table");
      return NextResponse.json(
        { error: "No sync date found in history_sales table" },
        { status: 422 }
      );
    }

    // 2. Recent sales from Shopify
    const sales = await fetchRecentSales(lastSyncDate, now);

    // 3. Apply each sale to the stored products
    let updatedCount = 0;
    for (const sale of sales) {
      if (!sale.sku || sale.sku === "NO_SKU") continue;

      const result = await sql`
        UPDATE store_products
        SET
          bin_current_quantity = bin_current_quantity - ${sale.quantity},
          inventory_quantity = inventory_quantity - ${sale.quantity}
        WHERE sku = ${sale.sku}
      `;
      // neon returns row count metadata on the result array
      const affected = (result as unknown as { rowCount?: number }).rowCount ?? 0;
      updatedCount += affected;
    }

    // 4. Record the new sync date
    await sql`
      INSERT INTO history_sales (last_date)
      VALUES (${now});
    `;

    console.log(
      `[cron/sync-sales] Done. Sales SKUs: ${sales.length}, products updated: ${updatedCount}, new sync date: ${now}`
    );

    return NextResponse.json({
      success: true,
      salesCount: sales.length,
      updatedCount,
      from: lastSyncDate,
      to: now,
    });
  } catch (error) {
    console.error("[cron/sync-sales] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
