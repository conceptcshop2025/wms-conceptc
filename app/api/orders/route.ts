import { NextResponse } from "next/server";
import { type OrdersDataProps, type SelledProductsByUpsellProps } from "../../types/types";

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
                customAttributes {
                  key
                  value
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

    const resultData:SelledProductsByUpsellProps[] = [];
    data.data.orders.edges.forEach((order:OrdersDataProps) => {
      order.node.lineItems.edges.map((item) => {
        const productSelled:SelledProductsByUpsellProps = {
          productTitle: item.node.product.title,
          variantTitle: item.node.variant.title,
          sku: item.node.variant.sku,
          quantity: item.node.quantity,
          orderNumber: order.node.number,
          orderId: order.node.id,
          campaignId: ""
        }

        if (item.node.customAttributes.length > 0) {
          const upsellPropertyFinded = item.node.customAttributes.find(k => k.key === "_lb-product")
          if (upsellPropertyFinded){
            productSelled.campaignId = upsellPropertyFinded.value;
            resultData.push(productSelled);
          }
        }
        
      })
    });


    return NextResponse.json({ data: resultData }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}