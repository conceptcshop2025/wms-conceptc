"use server";

import { type SelledProductsByUpsellProps } from "../types/types";

const baseUrl = process.env.SHOPIFY_DOMAIN_NAME || "";
const apiVersion = process.env.SHOPIFY_API_VERSION || "";
const apiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";

const SHOPIFY_URL = `https://${ baseUrl }/admin/api/${ apiVersion }/graphql.json`;
// const locationID = "gid://shopify/Location/67343220887"; // Location from Quebec warehouse

async function fetchShopify(query: string) {
  const res = await fetch(SHOPIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": apiToken,
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  return res.json();
}
const last_date = '2026-06-01T00:00:00.000Z';
const date = new Date().toISOString();
const queryGraphQL = `created_at:>='${last_date}' created_at:<='${date}' financial_status:paid`;

export async function startProductsBulkOperation(): Promise<string> {
  const mutation = `
    mutation {
      bulkOperationRunQuery(
        query: """
        {
          orders(query: "${queryGraphQL}", sortKey: CREATED_AT, reverse: true) {
            edges {
              cursor
              node {
                id
                number
                lineItems {
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
                      customAttributes {
                        key
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """
      ) {
        bulkOperation { id status }
        userErrors { field message }
      }
    }
  `;

  const { data } = await fetchShopify(mutation);

  if (data.bulkOperationRunQuery.userErrors.length > 0) {
    throw new Error(data.bulkOperationRunQuery.userErrors[0].message);
  }

  return data.bulkOperationRunQuery.bulkOperation.id;
}

async function pollBulkOperation(operationId: string): Promise<string> {
  const query = `
    query {
      node(id: "${operationId}") {
        ... on BulkOperation {
          id
          status
          url
          errorCode
        }
      }
    }
  `;

  const { data } = await fetchShopify(query);
  const op = data.node;

  if (op.status === "COMPLETED") return op.url;

  if (op.status === "FAILED" || op.status === "CANCELED") {
    throw new Error(`Bulk operation ${op.status}${op.errorCode ? `: ${op.errorCode}` : ""}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
  return pollBulkOperation(operationId);
}

function parseProductsJSONL(jsonlText: string): SelledProductsByUpsellProps[] {
  const lines = jsonlText
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const orders = lines.filter((l) => l.id?.includes("/Order/"));
  const lineItems = lines.filter((l) => l.__parentId?.includes("/Order/"));

  const resultData: SelledProductsByUpsellProps[] = [];

  lineItems.forEach((item) => {
    const order = orders.find((o) => o.id === item.__parentId);
    if (!order) return;

    const upsellAttr = item.customAttributes?.find(
      (attr: { key: string; value: string }) => attr.key === "_lb-product"
    );

    if (!upsellAttr) return; // solo nos interesan items con campaña

    resultData.push({
      productTitle: item.product?.title ?? "",
      variantTitle: item.variant?.title ?? "",
      sku: item.variant?.sku ?? "",
      quantity: item.quantity,
      orderNumber: order.number,
      orderId: order.id,
      campaignId: upsellAttr.value,
    });
  });

  return resultData;
}

export async function fetchBulkUpsellOrders(): Promise<SelledProductsByUpsellProps[]> {
  const operationId = await startProductsBulkOperation();
  const downloadUrl = await pollBulkOperation(operationId);

  const res = await fetch(downloadUrl);
  const text = await res.text();

  return parseProductsJSONL(text);
}