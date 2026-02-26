"use client";

import { useState, useMemo, useCallback } from "react";
import pLimit from "p-limit";
import { fetchBulkProducts } from "./actions/shopify";
import Header from "./components/Header/Header";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import ProductCounter from "./components/ProductCounter/ProductCounter";
import PaginationBar from "./components/PaginationBar/PaginationBar";
import ProductCard from "./components/ProductCard/ProductCard";
import Loading from "./components/Loading/Loading";
import { type ProductProps } from "./types/types";

export default function Home() {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");

  const ITEMS_PER_PAGE = 20;

  const getRemainingPct = (p: ProductProps) => {
    const maxBin = Number(p.bin_max_quantity);
    if (!maxBin) return 0;
    return Math.round((Number(p.bin_current_quantity) / maxBin) * 100);
  };

  const getFirstBinNumber = (p: ProductProps): number => {
    const raw = Array.isArray(p.bin_location)
      ? p.bin_location[0]
      : (p.bin_location || "").split(",")[0]?.trim();
    if (!raw) return Infinity;
    const n = parseFloat(raw);
    return isNaN(n) ? Infinity : n;
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    if (filter === "empty") {
      list = list.filter(p => getRemainingPct(p) === 0);
    } else if (filter === "low") {
      list = list.filter(p => { const pct = getRemainingPct(p); return pct > 0 && pct < 25; });
    } else if (filter === "medium") {
      list = list.filter(p => { const pct = getRemainingPct(p); return pct >= 25 && pct < 80; });
    } else if (filter === "high") {
      list = list.filter(p => getRemainingPct(p) >= 80);
    }

    if (sort === "pct-asc") {
      list.sort((a, b) => getRemainingPct(a) - getRemainingPct(b));
    } else if (sort === "bin-desc") {
      list.sort((a, b) => getFirstBinNumber(a) - getFirstBinNumber(b));
    }

    return list;
  }, [products, filter, sort]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE)),
    [filteredAndSortedProducts.length]
  );

  const paginatedProducts = useMemo(
    () => filteredAndSortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredAndSortedProducts, currentPage]
  );

  const handleFilterChange = useCallback((value: string) => {
    setFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    setCurrentPage(1);
  }, []);

  /* Get data from shopify and iPacky only for get all data (first time) */

  const handleSync = async () => {
    setLoading(true);
    setStatus("Solicitando datos a Shopify...");

    try {
      setStatus("Shopify está preparando el archivo... (Bulk Operation)");
      const bulkProducts = await fetchBulkProducts();
      setCurrentPage(1);
      setStatus(`¡Sincronización completa! ${bulkProducts.length} productos cargados.`);
      await getDataFromIpacky(bulkProducts);
      setLoading(false);

    } catch (error: unknown) {
      console.error("Error:", error);
      setStatus(`Error: ${error}`);
      setLoading(false);
    }
  };

  const getDataFromIpacky = async (bulkProducts: ProductProps[]) => {
    setStatus("Obteniendo datos de stock desde Ipacky...");
    // const productList = [...bulkProducts];
    const limit = pLimit(5);
    const syncProducts = await Promise.all(
      bulkProducts.map((product) => 
        limit(async () => {
          const sku = product.variants[0]?.sku;

          if (!sku) return product;

          try {
            const response = await fetch(`/api/ipacky?code=${sku}&type=sku`);
            const result = await response.json();

            if (response.ok && result.data[0]) {
              return {
                ...product,
                bin_location: result.data[0].binLocations || "",
                bin_max_quantity: result.data[0].htsUS || null,
                image_url: result.data[0].imageURL || '',
                inventoryQuantity: result.data[0].quantityOnHand,
                bin_current_quantity: 0,
              }
            }
          } catch(error) {
            console.error(`Error fetching data for SKU ${sku}:`, error);
          }

          return product;
        })
      )
    )
    setProducts([...syncProducts]);
    saveProductsInDB(syncProducts);
  }

  const saveProductsInDB = async (products: ProductProps[]) => {
    const baseUrl = `/api/warehouse`;
    try {
      const res = await fetch(baseUrl,{
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(products)
      });
      if (res.ok) {
        console.log("Products saved in DB successfully");
      }
    } catch(error) {
      console.error("Error saving products in DB:", error);
    }
  }

  /* END Get data from shopify and iPacky only for get all data (first time) */

  const handleProductConfirm = (sku: string, bin_current_quantity: number, update_at: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.variants[0]?.sku === sku
          ? { ...p, bin_current_quantity, updated_at: update_at }
          : p
      )
    );
  };

  /* Get all products from Neon DB */
  const handleGetAllProductsFromNeon = async () => {
    setLoading(true);
    setStatus("Connexion à la base de données...");

    try {
      const LIMIT = 200;

      const firstRes = await fetch(`/api/warehouse?page=1&limit=${LIMIT}`);
      if (!firstRes.ok) throw new Error(`Error ${firstRes.status}`);
      const firstData = await firstRes.json();

      let allProducts: ProductProps[] = [...firstData.products];
      const { total, totalPages } = firstData as { total: number; totalPages: number };

      setStatus(`Chargement des produits... (${allProducts.length} / ${total})`);

      for (let page = 2; page <= totalPages; page++) {
        const res = await fetch(`/api/warehouse?page=${page}&limit=${LIMIT}`);
        if (!res.ok) throw new Error(`Error ${res.status} en página ${page}`);
        const data = await res.json();
        allProducts = [...allProducts, ...data.products];
        setStatus(`Chargement des produits... (${allProducts.length} / ${total})`);
      }

      setProducts(allProducts);
      setCurrentPage(1);
      setStatus(`${allProducts.length} produits chargés depuis la base de données.`);
    } catch (error: unknown) {
      console.error("Error:", error);
      setStatus(`Error: ${error}`);
    } finally {
      setLoading(false);
      console.log(status);
    }
  }
  /* END Get all products from Neon DB */

  return (
    <div>
      <main>
        
        {/* <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"> */}


        {/* <!-- ==================== TOP BAR ==================== --> */}
        <Header onSync={handleSync} onGetAllProducts={handleGetAllProductsFromNeon} />

        {/* <!-- ==================== CONTROLS PANEL ==================== --> */}
        <ControlPanel onFilterChange={handleFilterChange} onSortChange={handleSortChange} />

        {/* ==================== MAIN CONTENT ==================== */}
        {
          loading ?
            <Loading text={"Chargement des données"} /> :
            <div className="main-content">
              {/* <!-- ===== PRODUCT COUNTER ===== --> */}

              <ProductCounter
                currentPage={currentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredAndSortedProducts.length}
              />

              {/* <!-- ===== PRODUCT CARD ===== --> */}

              {
                products.length > 0 && paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} onConfirm={handleProductConfirm} />
                ))
              }

              {/* ==================== PAGINATION ==================== */}
              <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            </div>
        }
      </main>
    </div>
  );
}
