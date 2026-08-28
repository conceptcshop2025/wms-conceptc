const baseUrl = process.env.SKUSAVVY_BASE_URL || "";
const apiKey = process.env.SKUSAVVY_API_KEY || "";

export const maxDuration = 600;

const PAGE_SIZE = 100;


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchWeightedAvgCosts(warehouseId: string) {
  const WAREHOUSE_ID = warehouseId;

  const QUERY = `
    query WeightedAvgCosts($limit: Int, $offset: Int) {
      weightedAvgCosts(warehouseId: "${WAREHOUSE_ID}", scope: WAREHOUSE, limit: $limit, offset: $offset) {
        totalCost
      }
    }
  `;

  let totalWeightedAvgCosts = 0;
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

    if (!res.ok) {
      throw new Error(`Skusavvy HTTP ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();

    if (json.errors) {
      throw new Error(`Skusavvy GraphQL: ${JSON.stringify(json.errors)}`);
    }

    const batch: Array<{ totalCost: string }> = json?.data?.weightedAvgCosts ?? [];

    for (const item of batch) {
      totalWeightedAvgCosts += Number(item.totalCost || 0);
    }

    if (batch.length < PAGE_SIZE) break;

    offset += batch.length;
    await sleep(400);
  }

  return { totalWeightedAvgCosts };
}
