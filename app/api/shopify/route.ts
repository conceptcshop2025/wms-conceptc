import { NextResponse } from "next/server";
import { type SalesDataProps, type SummarizedItemProps, type SummarizedOrderProps, type SummarizedAccProps, type ProductProps, type ShopifyProductVariantsProps, type ShopifyProductProps } from "../../types/types";

const baseUrl = process.env.SHOPIFY_DOMAIN_NAME || "";
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
const apiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";

export async function POST(req: Request) {
  const body = await req.json();
  const { date, last_date } = body;

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

  try {
    const result = await fetch(`https://${baseUrl}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": apiToken,
      },
      body: JSON.stringify({query}),
    });

    const data = await result.json();

    if (data.errors) {
      return NextResponse.json({ error: data.errors }, { status: 400 });
    }

    const formattedData = data.data.orders.edges.map((orderEdge: SalesDataProps) => ({
      orderShopifyId: orderEdge.node.id,
      orderId: orderEdge.node.number,
      items: orderEdge.node.lineItems.edges.map((itemEdge) => ({
        sku: itemEdge.node.variant?.sku || "NO_SKU",
        quantity: itemEdge.node.quantity,
        product_title: itemEdge.node.product?.title || "NO_PRODUCT_TITLE",
      }))
    }));

    const summarizedSales = formattedData.reduce((acc:SummarizedAccProps, order:SummarizedOrderProps) => {
      order.items.forEach((item:SummarizedItemProps) => {
        const { sku, quantity } = item;
        if (acc[sku]) {
          acc[sku].quantity += quantity;
        } else {
          acc[sku] = { sku, quantity };
        }
      });
      return acc;
    }, {});

    const finalResult: { sku: string; quantity: number }[] = Object.values(summarizedSales);

    return NextResponse.json({ data: finalResult }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  const query = `
    query {
      productVariants(first: 1, query:"sku:${code} OR barcode:${code}") {
        edges {
          node {
            id
            sku
            barcode
            product {
              id
              title
              handle
              media(first:1) {
                edges {
                  node {
                    preview {
                      image {
                        url
                      }
                    }
                  }
                }
              }
              vendor
              productType
              variants(first: 250) {
                edges {
                  node {
                    id
                    title
                    sku
                    barcode
                    inventoryItem {
                      id
                      inventoryLevel(locationId: "gid://shopify/Location/67343220887") {
                        id
                        location {
                          id
                          name
                        }
                        quantities(names: ["available"]) {
                          id
                          name
                          quantity
                        }
                      }
                    }
                  }
                }
              }
            }
            media(first: 1) {
              edges {
                node {
                  __typename
                  ... on MediaImage {
                    id
                    alt
                    image {
                      url
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

  try {
    const result = await fetch(`https://${baseUrl}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": apiToken,
      },
      body: JSON.stringify({query}),
    });

    const data = await result.json();

    const formattedData:ProductProps = data.data.productVariants.edges.map((item: ShopifyProductProps) => ({
      shopify_id: item.node.product.id,
      title: item.node.product.title,
      image_url: item.node.product.media.edges[0]?.node.preview.image.url,
      vendor: item.node.product.vendor,
      product_type: item.node.product.productType,
      updated_at: new Date().toISOString(),
      bin_max_quantity: 0,
      bin_current_quantity: 0,
      bin_location: "",
      variants: item.node.product.variants.edges.map((variantItem: ShopifyProductVariantsProps) => ({
        variant_id: variantItem.node.id,
        title: variantItem.node.title,
        sku: variantItem.node.sku,
        barcode: variantItem.node.barcode,
        inventoryQuantity: variantItem.node.inventoryItem.inventoryLevel.quantities?.[0]?.quantity ?? 0,
        commitedInventory: 0,
        __parentId: item.node.product.id
      })),
    }));

    if (data.errors) {
      return NextResponse.json({ error: data.errors }, { status: 400 });
    }

    return NextResponse.json({ data: formattedData }, { status: 200 });

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}