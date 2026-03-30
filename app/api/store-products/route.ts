import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { type ProductItemProps } from "@/app/types/types";

const sql = neon(process.env.DATABASE_URL || "");
const CHUNK_SIZE = 25;

async function upsertProduct(product: ProductItemProps) {
  try {
    await sql`
      INSERT INTO store_products (
        id,
        title,
        variant_title,
        image_url,
        vendor,
        product_type,
        updated_at,
        bin_max_quantity,
        bin_current_quantity,
        bin_location,
        inventory_quantity,
        b_alias,
        status,
        sku,
        barcode,
        parent_id
      )
      VALUES (
        ${ product.id },
        ${ product.title },
        ${ product.variant_title },
        ${ product.image_url },
        ${ product.vendor },
        ${ product.product_type },
        ${ product.updated_at },
        ${ product.bin_max_quantity },
        ${ product.bin_current_quantity },
        ${ product.bin_location },
        ${ product.inventory_quantity },
        ${ product.b_alias },
        ${ product.status },
        ${ product.sku },
        ${ product.barcode },
        ${ product.parent_id }
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        variant_title = EXCLUDED.variant_title,
        image_url = EXCLUDED.image_url,
        vendor = EXCLUDED.vendor,
        product_type = EXCLUDED.product_type,
        updated_at = EXCLUDED.updated_at,
        bin_max_quantity = EXCLUDED.bin_max_quantity,
        bin_current_quantity = EXCLUDED.bin_current_quantity,
        bin_location = EXCLUDED.bin_location,
        inventory_quantity = EXCLUDED.inventory_quantity,
        b_alias = EXCLUDED.b_alias,
        status = EXCLUDED.status,
        sku = EXCLUDED.sku,
        barcode = EXCLUDED.barcode,
        parent_id = EXCLUDED.parent_id
    `;
    return { success: true, product };
  } catch (error) {
    return { success: false, product, error: String(error) };
  }
}

export async function PUT(req: Request) {
  try {
    const products: ProductItemProps[] = await req.json();
    const failed: { product: ProductItemProps; error: string }[] = [];

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