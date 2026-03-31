import { type ProductItemProps } from "@/app/types/types";
import pLimit from "p-limit";

export async function syncProductsFromIpacky(products:ProductItemProps[]): Promise<ProductItemProps[]> {
  const limit = pLimit(5);

  function fieldFormat(fields:string[]) {
    return fields.join(",");
  }

  const syncProducts = await Promise.all(
    products.map((product) => 
      limit(async () => {
        const sku = product.sku;

        if (!sku) return product;

        try {
          const response = await fetch(`../../api/ipacky?code=${sku}&type=sku`);
          const result = await response.json();

          if (response.ok && result.data[0]) {
            return {
              ...product,
              bin_location: fieldFormat(result.data[0].binLocations),
              bin_max_quantity: result.data[0].htsUS || null,
              b_alias: fieldFormat(result.data[0].barcodeAliases),
              updated_at: new Date().toISOString()
            }
          }
        } catch(error) {
          console.error(`Error fetching data for SKU ${sku}:`, error);
        }

        return product;
      })
    )
  )

  return syncProducts;
}