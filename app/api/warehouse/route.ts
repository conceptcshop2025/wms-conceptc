import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { ProductProps } from "../../types/types";

const sql = neon(process.env.DATABASE_URL || "");

export async function PUT(req: Request) {
  try {
    const products: ProductProps[] = await req.json();

    await Promise.all(
      products.map((product) => {
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
      })
    );

    return NextResponse.json({ success: true, count: products.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
