import { type ProductProps } from "@/app/types/types";

export async function getAllProductsFromNeon() {
  try {
    const LIMIT = 200;

    const firstRes = await fetch(`../../api/store-products?page=1&limit=${LIMIT}`);
    if (!firstRes.ok) throw new Error(`Error ${firstRes.status}`);
    const firstData = await firstRes.json();

    let allProducts: ProductProps[] = [...firstData.products];
    const { totalPages } = firstData as { total: number; totalPages: number };


    for (let page = 2; page <= totalPages; page++) {
      const res = await fetch(`/api/store-products?page=${page}&limit=${LIMIT}`);
      if (!res.ok) throw new Error(`Error ${res.status} en página ${page}`);
      const data = await res.json();
      allProducts = [...allProducts, ...data.products];
    }

    return allProducts;
  } catch (error: unknown) {
    return error;
  }
}