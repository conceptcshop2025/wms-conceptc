const baseUrl = process.env.SKUSAVVY_BASE_URL || "";
const apiKey = process.env.SKUSAVVY_API_KEY || "";

export const maxDuration = 60;

const PAGE_SIZE = 100;


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchInfoWarehouses(warehouseId: string) {
  const WAREHOUSE_ID = warehouseId;

  const QUERY = `
    query InventoryTotals($limit: Int, $offset: Int) {
      inventoryItems(limit: $limit, offset: $offset) {
        totalQuantity(warehouseId: "${WAREHOUSE_ID}")
        variants {
          price
          committedQuantity(warehouseId: "${WAREHOUSE_ID}")
        }
      }
    }
  `;

  try {
    let totalQuantity = 0;
    let totalPrice = 0;
    let totalCommitted = 0;
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
        return json.errors;
      }

      const batch: Array<{ totalQuantity: number, variants: Array<{ price: string, committedQuantity: number }> }> = json?.data?.inventoryItems ?? [];

      for (const item of batch) {
        totalQuantity += Number(item?.totalQuantity) || 0;
        totalPrice += item?.variants?.reduce((sum, variant) => sum + (Number(variant?.price) * Number(item?.totalQuantity) || 0), 0) || 0;
        totalCommitted += item?.variants?.reduce((sum, variant) => sum + (Number(variant?.price) * Number(variant?.committedQuantity) || 0), 0) || 0;
      }

      if (batch.length < PAGE_SIZE) break;

      offset += batch.length;
      await sleep(150);
    }

    return { data: { totalQuantity, totalPrice, totalCommitted } };
  } catch (error) {
    return error;
  }
}
