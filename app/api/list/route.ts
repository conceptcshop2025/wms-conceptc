import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get('sku');

  try {
    const result = await sql`
      SELECT * FROM store_products 
      WHERE 
        sku = ${sku} 
        OR barcode = ${sku}
        OR ${sku} = ANY(string_to_array(b_alias, ','));
    `;

    if (result.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, products } = body;

    if (!name || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO product_list_to_restock (date, name, products) VALUES (NOW(), ${name}, ${JSON.stringify(products)}::jsonb) returning id;
    `;

    return NextResponse.json({ message: "Restocking bin saved successfully", id: result?.[0]?.id }, { status: 201 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "No ID founded in this request"},
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM product_list_to_restock WHERE id = ${id};
    `;

    return NextResponse.json({ message: "Historic item success deleted", info: result}, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}