import { type ProductItemProps, type ProductPayloadProps } from "@/app/types/types";
import { getBaseUrl } from "../utils/getBaseUrl";

export async function setProductsExpirationStatus(products: ProductItemProps[]) {
  try {
    const baseUrl = `${getBaseUrl()}/api/store-products`;

    const payload:ProductPayloadProps[] = products.map((product:ProductItemProps) => {
      return {
        sku: product.sku,
        updated_at: new Date().toISOString(),
        expiration: product.expiration
      }
    });

    const res = await fetch(baseUrl, {
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
  } catch (error) {
    const errorObject = {
      message: "Error trying change expiration Status for products",
      error: error,
      data: products
    }
    console.error(errorObject);
  }
}