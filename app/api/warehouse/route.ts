import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { ProductProps } from "../../types/types";

const sql = neon(process.env.DATABASE_URL || "");

const CHUNK_SIZE = 25;

async function upsertProduct(product: ProductProps) {
  try {
    const sku = product.variants[0]?.sku || '';
    const inventory_quantity = product?.inventory_quantity;
    const binLocation = Array.isArray(product.bin_location)
      ? product.bin_location.join(', ')
      : (product.bin_location || '');
    const b_alias = Array.isArray(product.b_alias)
      ? product.b_alias.join(', ')
      : (product.b_alias || '');

    await sql`
      INSERT INTO products (
        shopify_id, title, sku, image_url, vendor, product_type,
        update_at, inventory_quantity, bin_max_quantity,
        bin_current_quantity, bin_location, variants, b_alias, status
      )
      VALUES (
        ${product.shopify_id},
        ${product.title},
        ${sku},
        ${product.image_url},
        ${product.vendor},
        ${product.product_type},
        ${product.updated_at},
        ${inventory_quantity},
        ${product.bin_max_quantity},
        ${product.bin_current_quantity},
        ${binLocation},
        ${JSON.stringify(product.variants)},
        ${b_alias},
        ${product.status}
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
        variants = EXCLUDED.variants,
        b_alias = EXCLUDED.b_alias,
        status = EXCLUDED.status
    `;
    return { success: true, product };
  } catch (error) {
    return { success: false, product, error: String(error) };
  }
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
          update_at AS updated_at, inventory_quantity, bin_max_quantity,
          bin_current_quantity, bin_location, variants, b_alias, status
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

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json() as { id: number };

    await sql`DELETE FROM products WHERE id = ${id}`;

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
    const failed: { product: ProductProps; error: string }[] = [];

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(chunk.map(upsertProduct));

      for (const r of results) {
        if (!r.success) {
          failed.push({ product: r.product, error: r.error || "Unknown error" });
        }
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      count: products.length,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const binLocation = Array.isArray(body.bin_location)
      ? body.bin_location.join(', ')
      : (body.bin_location || '');
    const b_alias = Array.isArray(body.b_alias)
      ? body.b_alias.join(', ')
      : (body.b_alias || '');

    const result = await sql`
      INSERT INTO products (
        shopify_id, title, sku, image_url, vendor, product_type,
        update_at, inventory_quantity, bin_max_quantity,
        bin_current_quantity, bin_location, variants, b_alias
      ) VALUES (
        ${body.shopify_id},
        ${body.title},
        ${body.variants[0].sku},
        ${body.image_url},
        ${body.vendor},
        ${body.product_type},
        ${body.updated_at},
        ${body.inventory_quantity},
        ${body.bin_max_quantity},
        ${body.bin_current_quantity},
        ${binLocation},
        ${JSON.stringify(body.variants)},
        ${b_alias}
      ) RETURNING *;
    `;

    return NextResponse.json({ data: result[0] }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
