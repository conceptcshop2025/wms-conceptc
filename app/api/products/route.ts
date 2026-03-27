import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { type ProductProps } from "@/app/types/types";

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
        update_at, inventory_quantity, bin_max_quantity, bin_location, variants, b_alias, status
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