import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { ProductProps } from "../../types/types";

const sql = neon(process.env.DATABASE_URL || "");

const CHUNK_SIZE = 25;

function upsertProduct(product: ProductProps) {
  const sku = product.variants[0]?.sku || '';
  const inventoryQuantity = product.variants[0]?.inventoryQuantity ?? 0;
  const binLocation = Array.isArray(product.bin_location)
    ? product.bin_location.join(', ')
    : (product.bin_location || '');

  return sql`
    INSERT INTO products (
      id, shopify_id, title, sku, image_url, vendor, product_type,
      update_at, inventory_quantity, bin_max_quantity,
      bin_current_quantity, bin_location, variants
    )
    VALUES (
      ${product.id},
      ${product.shopify_id},
      ${product.title},
      ${sku},
      ${product.image_url},
      ${product.vendor},
      ${product.product_type},
      ${product.updated_at},
      ${inventoryQuantity},
      ${product.bin_max_quantity},
      ${product.bin_current_quantity},
      ${binLocation},
      ${JSON.stringify(product.variants)}
    )
    ON CONFLICT (sku) DO UPDATE SET
      shopify_id = EXCLUDED.shopify_id,
      title = EXCLUDED.title,
      image_url = EXCLUDED.image_url,
      vendor = EXCLUDED.vendor,
      product_type = EXCLUDED.product_type,
      update_at = EXCLUDED.update_at,
      inventory_quantity = EXCLUDED.inventory_quantity,
      bin_max_quantity = EXCLUDED.bin_max_quantity,
      bin_current_quantity = EXCLUDED.bin_current_quantity,
      bin_location = EXCLUDED.bin_location,
      variants = EXCLUDED.variants
  `;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "200", 10)));
    const offset = (page - 1) * limit;

    const [countResult, rows] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total FROM products`,
      sql`
        SELECT
          id, shopify_id, title, image_url, vendor, product_type,
          update_at AS updated_at, bin_max_quantity,
          bin_current_quantity, bin_location, variants
        FROM products
        ORDER BY id
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = (countResult[0]?.total ?? 0) as number;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ products: rows, total, page, totalPages });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { sku, bin_current_quantity, update_at } = await req.json() as {
      sku: string;
      bin_current_quantity: number;
      update_at: string;
    };

    await sql`
      UPDATE products
      SET
        bin_current_quantity = ${bin_current_quantity},
        update_at = ${update_at}
      WHERE sku = ${sku}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const products: ProductProps[] = await req.json();

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(upsertProduct));
    }

    return NextResponse.json({ success: true, count: products.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}


