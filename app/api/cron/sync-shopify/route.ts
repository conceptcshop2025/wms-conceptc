import { NextResponse } from "next/server";
import { runShopifySync } from "../../../lib/data/syncService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The Shopify bulk operation + iPacky enrichment can take a while.
export const maxDuration = 300;

/**
 * Cron job (configured in vercel.json) that runs the same work as the
 * "Sync from Shopify" button, server-side, even when no device is using the app.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { products, shopifyCount } = await runShopifySync();
    console.log(
      `[cron/sync-shopify] Done. Shopify products: ${shopifyCount}, products in DB after sync: ${products.length}`
    );
    return NextResponse.json({ success: true, shopifyCount, productsCount: products.length });
  } catch (error) {
    console.error("[cron/sync-shopify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
