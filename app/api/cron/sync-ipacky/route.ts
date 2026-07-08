import { NextResponse } from "next/server";
import { runIpackySync } from "../../../lib/data/syncService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// iPacky enrichment can take a while; give it room (seconds).
export const maxDuration = 300;

/**
 * Daily cron job (configured in vercel.json) that runs the same work as the
 * "Sync from iPacky" button, server-side, even when no device is using the app.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const synced = await runIpackySync();
    console.log(`[cron/sync-ipacky] Done. Products synced from iPacky: ${synced.length}`);
    return NextResponse.json({ success: true, syncedCount: synced.length });
  } catch (error) {
    console.error("[cron/sync-ipacky] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
