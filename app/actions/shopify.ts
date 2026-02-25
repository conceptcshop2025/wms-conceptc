"use server";

import type { ProductProps, VariantProps } from '../types/types';

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
                      inventoryItem {
                        id
                        inventoryLevels {
                          edges {
                            node {
                              quantities(names: ["committed"]) {
                                name
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

type RawProduct = {
  id: string;
  title: string;
  vendor: string;
  productType: string;
  updatedAt: string;
  featuredImage?: { url: string };
};

type RawVariant = {
  id: string;
  title: string;
  sku: string;
  barcode: string;
  inventoryQuantity: number;
  inventoryItem?: { id: string };
  __parentId: string;
};

type RawInventoryLevel = {
  id: string;
  quantities?: { name: string; quantity: number }[];
  __parentId: string;
};

type RawJSONLLine = { id: string; __parentId?: string } & Record<string, unknown>;

function parseProductsJSONL(jsonlText: string): ProductProps[] {
  const lines = jsonlText.split("\n").filter(Boolean).map((line) => JSON.parse(line) as RawJSONLLine);

  // Bucket 1: productos (sin __parentId)
  const productMap = new Map<string, RawProduct>();
  // Bucket 2: variantes (id contiene "ProductVariant", __parentId = productId)
  const variantsByProduct = new Map<string, RawVariant[]>();
  // Bucket 3: niveles de inventario (id contiene "InventoryLevel", __parentId = inventoryItemId)
  //           → acumulamos committed por inventoryItemId
  const committedByInventoryItem = new Map<string, number>();

  lines.forEach((item) => {
    if (!item.__parentId) {
      productMap.set(item.id, item as RawProduct);
    } else if (item.id?.includes("ProductVariant")) {
      const variant = item as RawVariant;
      const list = variantsByProduct.get(item.__parentId) || [];
      list.push(variant);
      variantsByProduct.set(item.__parentId, list);
    } else if (item.id?.includes("InventoryLevel")) {
      const level = item as RawInventoryLevel;
      const committed = level.quantities?.find((q) => q.name === "committed")?.quantity ?? 0;
      committedByInventoryItem.set(
        item.__parentId,
        (committedByInventoryItem.get(item.__parentId) ?? 0) + committed
      );
    }
  });

  // Limitar a los primeros 200 productos
  const productEntries = Array.from(productMap.entries());
  const result: ProductProps[] = [];
  let seq = 1;

  for (const [productId, product] of productEntries) {
    const variants = variantsByProduct.get(productId) || [];

    result.push({
      id: seq++,
      shopify_id: product.id,
      title: product.title,
      image_url: product.featuredImage?.url || "",
      vendor: product.vendor,
      product_type: product.productType,
      updated_at: product.updatedAt,
      bin_max_quantity: 0,
      bin_current_quantity: 0,
      bin_location: "",
      variants: variants.map((variant): VariantProps => ({
        variant_id: variant.id,
        title: variant.title,
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        inventoryQuantity: variant.inventoryQuantity ?? 0,
        commitedInventory: committedByInventoryItem.get(variant.inventoryItem?.id ?? "") ?? 0,
        __parentId: variant.__parentId,
      })),
    });
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