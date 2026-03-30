import { type ProductItemProps } from "@/app/types/types";

export async function updateProducts(products:ProductItemProps[]) {
  
  const baseUrl = '/api/store-products';

  try {
    const res = await fetch(baseUrl,{
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(products)
    });

    const data = await res.json();

    if (data.failedCount > 0) {
      console.warn("Productos que fallaron:", data.failed);
    }
  } catch(error) {
    console.error("Error saving products in DB:", error);
  }
}