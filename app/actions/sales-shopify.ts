"use server";

const baseUrl = process.env.SHOPIFY_DOMAIN_NAME || "";
const apiVersion = process.env.SHOPIFY_API_VERSION || "";
const apiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";

const SHOPIFY_URL = `https://${baseUrl}/admin/api/${apiVersion}/graphql.json`;

export type SaleItem = {
  sku: string;
  quantity: number;
};

async function fetchShopify(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOPIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": apiToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}

function toShopifyDate(dateStr: string): string {
  // Normaliza el formato Postgres (puede venir con espacio en lugar de T)
  const normalized = dateStr.replace(" ", "T");
  return new Date(normalized).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function getSalesBetweenDates(fromDate: string, toDate: string): Promise<SaleItem[]> {
  const from = toShopifyDate(fromDate);
  const to   = toShopifyDate(toDate);

  const queryStr = `created_at:>=${from} created_at:<=${to} financial_status:paid`;

  const gqlQuery = `
    query GetSales($cursor: String, $queryStr: String!) {
      orders(first: 250, after: $cursor, query: $queryStr, sortKey: CREATED_AT) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            lineItems(first: 100) {
              edges {
                node {
                  sku
                  quantity
                }
              }
            }
          }
        }
      }
    }
  `;

  const salesMap = new Map<string, number>();
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const { data } = await fetchShopify(gqlQuery, { cursor, queryStr });
    const orders = data.orders;

    for (const { node: order } of orders.edges) {
      for (const { node: item } of order.lineItems.edges) {
        if (!item.sku) continue;
        salesMap.set(item.sku, (salesMap.get(item.sku) ?? 0) + item.quantity);
      }
    }

    hasNextPage = orders.pageInfo.hasNextPage;
    cursor = orders.pageInfo.endCursor ?? null;
  }

  return Array.from(salesMap.entries()).map(([sku, quantity]) => ({ sku, quantity }));
}
