"use server";

import type { ProductProps } from '../types/types';

const baseUrl = process.env.SHOPIFY_DOMAIN_NAME || "";
const apiVersion = process.env.SHOPIFY_API_VERSION || "";
const apiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";

const SHOPIFY_URL = `https://${ baseUrl }/admin/api/${ apiVersion }/graphql.json`;

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

export async function getQuickProducts() {
  const query = `
    query {
      products(first: 100) {
        nodes {
          id
          title
          variants(first: 50) {
            nodes {
              id
              title
              inventoryItem {
                inventoryLevels(first: 1) {
                  nodes {
                    quantities(names: ["committed"]) {
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const { data } = await fetchShopify(query);
  
  // La query estándar devuelve los datos ya anidados, 
  // no necesitas el parser de JSONL.
  return data.products.nodes; 
}

export async function startProductsBulkOperation(): Promise<string> {
  const mutation = `
    mutation {
      bulkOperationRunQuery(
        query: """
        {
          products(query: "status:active") {
            edges {
              node {
                id
                title
                vendor
                productType
                updatedAt
                featuredImage {
                  url
                }
                variants {
                  edges {
                    node {
                      id
                      title
                      sku
                      barcode
                      inventoryQuantity
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

function parseProductsJSONL(jsonlText: string): ProductProps[] {
  const lines = jsonlText.split("\n").filter(Boolean).map((line) => JSON.parse(line));

  const productMap = new Map<string, ProductProps>();
  const variantsByParent = new Map<string, ProductProps[]>();

  lines.forEach((item) => {
    if (item.__parentId) {
      const list = variantsByParent.get(item.__parentId) || [];
      list.push(item);
      variantsByParent.set(item.__parentId, list);
    } else {
      productMap.set(item.id, item);
    }
  });

  // Limitar a los primeros 200 productos
  const productEntries = Array.from(productMap.entries()).slice(0, 200);
  const result: ProductProps[] = [];
  let seq = 1;

  for (const [productId, product] of productEntries) {
    const variants = variantsByParent.get(productId) || [];

    if (variants.length === 0) {
      result.push({
        id: product.id,
        shopify_id: product.shopify_id,
        title: product.title,
        sku: "",
        upc: "",
        image_url: product.image_url || "",
        vendor: product.vendor,
        product_type: product.product_type,
        updated_at: product.updated_at,
        variant_title: "",
        inventory_quantity: 0,
        bin_max_quantity: 0,
        bin_current_quantity: 0,
        bin_location: "",
      });
    } else {
      for (const variant of variants) {
        result.push({
          id: seq++,
          shopify_id: product.shopify_id,
          title: product.title,
          sku: variant.sku || "",
          upc: variant.upc || "",
          image_url: product.image_url || "",
          vendor: product.vendor,
          product_type: product.product_type,
          updated_at: product.updated_at,
          variant_title: variant.title || "",
          inventory_quantity: variant.inventory_quantity || 0,
          bin_max_quantity: 0,
          bin_current_quantity: 0,
          bin_location: "",
        });
      }
    }
  }

  return result;
}

export async function fetchBulkProducts(): Promise<ProductProps[]> {
  const operationId = await startProductsBulkOperation();
  const downloadUrl = await pollBulkOperation(operationId);

  const res = await fetch(downloadUrl);
  const text = await res.text();

  return parseProductsJSONL(text);
}