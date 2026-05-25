import { NextResponse } from "next/server";

const STOCKY_API_KEY = process.env.STOCKY_API_KEY;
const STOCKY_BASE_URL = process.env.STOCKY_BASE_URL;
const SHOPIFY_STORE_NAME = process.env.SHOPIFY_DOMAIN_NAME;

export async function GET() {
  try {
    console.log(`${ STOCKY_BASE_URL }/purchase_orders.json`);
    const response = await fetch(`${ STOCKY_BASE_URL }/purchase_orders.json`, {
      method: 'GET',
      headers: {
        'Store-Name': SHOPIFY_STORE_NAME || '',
        'Authorization': `API KEY=${STOCKY_API_KEY}`,
      }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}