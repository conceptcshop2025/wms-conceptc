import { type ProductItemProps } from "@/app/types/types";

export async function updateProducts(products:ProductItemProps[]) {
  
  const baseUrl = '/api/store-products';
  const CHUNK_SIZE = 500;

  try {
    for (let i = 0; i < products.length; i+= CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const res = await fetch(baseUrl,{
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chunk)
      });

      const data = await res.json();

      if (data.failedCount > 0) {
        console.warn("Productos que fallaron:", data.failed);
      }
    }
  } catch(error) {
    console.error("Error saving products in DB:", error);
  }
}