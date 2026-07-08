import { type ProductItemProps, type DraftProductPayload } from "@/app/types/types";
import { getBaseUrl } from "../utils/getBaseUrl";

export async function setProductsInDraftStatus(products: ProductItemProps[]) {

  try {
    const baseUrl = `${getBaseUrl()}/api/store-products`;
    try {
      const payload:DraftProductPayload[] = products.map((product) => {
        return {
          sku: product.sku,
          newStatus: "DRAFT",
          updated_at: new Date().toISOString()
        };
      });

      const res = await fetch(baseUrl,{
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.failedCount > 0) {
        console.warn("Productos que fallaron:", data.failed);
      }
    } catch(error) {
      console.error("Error saving products in DB:", error);
    }
  } catch (error) {
    const errorObject = {
      message: "Error trying change status to DRAFT for products",
      error: error,
      data: products
    }
    console.error(errorObject);
  }
}