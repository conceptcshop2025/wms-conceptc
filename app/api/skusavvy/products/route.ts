import { NextResponse } from "next/server";
import { auth } from "@/auth";

const baseUrl = process.env.SKUSAVVY_BASE_URL || "";
const apiKey = process.env.SKUSAVVY_API_KEY || "";

export const maxDuration = 60;

const PAGE_SIZE = 100;
const WAREHOUSE_ID = "019ed719-70dc-717e-b011-78ef1e665bc8";

const QUERY = `
  query InventoryTotals($limit: Int, $offset: Int) {
    inventoryItems(limit: $limit, offset: $offset) {
      totalQuantity(warehouseId: "${WAREHOUSE_ID}")
    }
  }
`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  const session = await auth();

  if (!session?.user?.canAccessSkusavvy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let totalQuantity = 0;
    let offset = 0;

    for (let page = 0; page < 1000; page++) {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": apiKey,
        },
        body: JSON.stringify({
          query: QUERY,
          variables: { limit: PAGE_SIZE, offset },
        }),
        cache: "no-store",
      });

      const json = await res.json();

      if (json.errors) {
        return NextResponse.json({ error: json.errors }, { status: 400 });
      }

      const batch: Array<{ totalQuantity: number }> = json?.data?.inventoryItems ?? [];

      for (const item of batch) {
        totalQuantity += Number(item?.totalQuantity) || 0;
      }

      if (batch.length < PAGE_SIZE) break;

      offset += batch.length;
      await sleep(150);
    }

    return NextResponse.json({ data: { totalQuantity } }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
