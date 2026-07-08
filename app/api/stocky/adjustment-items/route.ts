import { NextResponse } from "next/server";

const STOCKY_API_KEY = process.env.STOCKY_API_KEY

const BASE_URL='https://stocky.shopifyapps.com/api/v2/stock_adjustment_items.json';

export async function GET() {
  try {
    const response = await fetch(
      BASE_URL,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Store-Name": "concept-c-shop.myshopify.com",
          Authorization: `API KEY=${STOCKY_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Stocky API" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
