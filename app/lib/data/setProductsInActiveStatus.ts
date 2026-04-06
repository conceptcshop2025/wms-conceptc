import { type ProductItemProps, type ProductPayloadProps } from "@/app/types/types";

export async function setProductsInActiveStatus(products: ProductItemProps[]) {

  try {
    const baseUrl = '/api/store-products';
    try {
      const payload:ProductPayloadProps[] = products.map((product) => {
        return {
          sku: product.sku,
          status: "ACTIVE",
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