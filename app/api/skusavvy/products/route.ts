import { NextResponse } from "next/server";

const baseUrl = process.env.SKUSAVVY_BASE_URL || "";
const apiKey = process.env.SKUSAVVY_API_KEY || "";

export async function POST() {
  const query = `query {
    products {
      name
      id
      variants {
        id
        sku
        price
        totalQuantity
        unitCosts {
          cost
        }
        inventory {
          quantity
          warehouse {
            id
            name
          }
        }
      }
    }
  }`;

  try {
    const result = await fetch (baseUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'X-Token': apiKey
      },
      body: JSON.stringify({query})
    })

    const data = await result.json();

    if (data.errors) {
      return NextResponse.json({ error: data.errors }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}