import {
  type SalesDataProps,
  type SummarizedItemProps,
  type SummarizedOrderProps,
  type SummarizedAccProps,
} from "@/app/types/types";

const baseUrl = process.env.SHOPIFY_DOMAIN_NAME || "";
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const apiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";

export type RecentSale = { sku: string; quantity: number };

/**
 * Fetches paid orders from Shopify created between `last_date` and `date`,
 * and returns the total sold quantity grouped by SKU.
 *
 * Shared by the `/api/shopify` POST route (manual, dev) and the hourly
 * `/api/cron/sync-sales` cron job (automatic, server-side).
 */
export async function fetchRecentSales(last_date: string, date: string): Promise<RecentSale[]> {
  const queryGraphQL = `created_at:>='${last_date}' created_at:<='${date}' financial_status:paid`;

  const query = `query {
    orders(first: 250, query: "${queryGraphQL}", sortKey: CREATED_AT, reverse: true) {
      edges {
        cursor
        node {
          id
          number
          lineItems(first: 100) {
            edges {
              node {
                quantity
                variant {
                  sku
                  title
                }
                product {
                  title
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }`;

  const result = await fetch(`https://${baseUrl}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": apiToken,
    },
    body: JSON.stringify({ query }),
  });

  const data = await result.json();

  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }

  const formattedData = data.data.orders.edges.map((orderEdge: SalesDataProps) => ({
    orderShopifyId: orderEdge.node.id,
    orderId: orderEdge.node.number,
    items: orderEdge.node.lineItems.edges.map((itemEdge) => ({
      sku: itemEdge.node.variant?.sku || "NO_SKU",
      quantity: itemEdge.node.quantity,
      product_title: itemEdge.node.product?.title || "NO_PRODUCT_TITLE",
    })),
  }));

  const summarizedSales = formattedData.reduce((acc: SummarizedAccProps, order: SummarizedOrderProps) => {
    order.items.forEach((item: SummarizedItemProps) => {
      const { sku, quantity } = item;
      if (acc[sku]) {
        acc[sku].quantity += quantity;
      } else {
        acc[sku] = { sku, quantity };
      }
    });
    return acc;
  }, {});

  return Object.values(summarizedSales);
}
