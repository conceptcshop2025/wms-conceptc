"use server";

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

/* export async function startBulkOperation() {
  const mutation = `
    mutation {
      bulkOperationRunQuery(
        query: """
        {
          products(first: 100) {
            edges {
              node {
                id
                title
                variants {
                  edges {
                    node {
                      id
                      title
                      inventoryItem {
                        inventoryLevels(first: 1) {
                          edges {
                            node {
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
            }
          }
        }
        """
      ) {
        bulkOperation { id status }
        userErrors { message }
      }
    }
  `;
  return await fetchShopify(mutation);
}

export async function getBulkOperationStatus() {
  const query = `
    query {
      currentBulkOperation {
        id
        status
        url
      }
    }
  `;
  const { data } = await fetchShopify(query);
  const operation = data.currentBulkOperation;

  // Si terminó, descargamos y parseamos
  if (operation?.status === "COMPLETED" && operation.url) {
    const fileRes = await fetch(operation.url);
    const text = await fileRes.text();
    return { 
      status: "COMPLETED", 
      data: parseBulkJSONL(text) 
    };
  }

  return { status: operation?.status || "IDLE", data: null };
} */

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

/* function parseBulkJSONL(jsonlString: string) {
  const lines = jsonlString.split("\n").filter(Boolean).map(line => JSON.parse(line));
  const products: any[] = [];
  const variants: any[] = [];

  lines.forEach(item => {
    if (item.id.includes("ProductVariant")) {
      variants.push(item);
    } else {
      products.push({ ...item, variants: [] });
    }
  });

  variants.forEach(variant => {
    const product = products.find(p => p.id === variant.__parentId);
    if (product) product.variants.push(variant);
  });

  return products;
} */