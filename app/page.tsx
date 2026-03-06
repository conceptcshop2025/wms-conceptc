"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import pLimit from "p-limit";
import { fetchBulkProducts } from "./actions/shopify";
// import { getSalesBetweenDates } from "./actions/sales-shopify";
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
  const [foundedProductId, setFoundedProductId] = useState<number | null>(null);
  const [mode, setMode] = useState<"list" | "warehouse">("warehouse");

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

  const handleProductSearch = useCallback((query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    const idx = filteredAndSortedProducts.findIndex(p =>
      p.variants[0]?.sku?.toLowerCase() === q ||
      p.variants[0]?.barcode?.toLowerCase() === q
    );

    if (idx === -1) {
      console.error(`Product not found: "${query}"`);
      setFoundedProductId(null);
      return;
    }

    const found = filteredAndSortedProducts[idx];
    if (!found) return;
    const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;
    setCurrentPage(targetPage);
    setFoundedProductId(found.id);
  }, [filteredAndSortedProducts]);

  useEffect(() => {
    if (!foundedProductId) return;
    const el = document.querySelector(`[data-product-id="${foundedProductId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [foundedProductId, currentPage]);

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
                inventory_quantity: result.data[0].quantityOnHand,
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
    console.log("syncProducts:", syncProducts);
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

  const handleProductDelete = useCallback((id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

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
    setMode("warehouse");

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

  const handleGetSelledProducts = async () => {
    const clickTime = new Date().toISOString();

    const res = await fetch("/api/sync");
    const data = await res.json();
    const lastSyncDate: string | null = data.data?.last_date ?? null;


    if (!lastSyncDate) {
      console.error("No sync date found in sync_history table");
      return;
    }

    try {
      const getSales = fetch(`/api/shopify`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          last_date: lastSyncDate,
          date: clickTime
        })
      });
      const responseSales = await getSales;
      const data = await responseSales.json();
      

      if (!responseSales.ok) {
        console.error(`Error ${responseSales.status} getting sales data from Shopify`);
      }
      
      const productsCopy = [...products];
      
      data.data.forEach((sale: { sku: string; quantity: number }) => {
        const findProduct = productsCopy.find(p => p.variants[0]?.sku === sale.sku);
        if (findProduct) {
          findProduct.bin_current_quantity = Number(findProduct.bin_current_quantity) - sale.quantity;
          findProduct.inventory_quantity = Number(findProduct.inventory_quantity) - sale.quantity;
        }
      });

      setProducts(productsCopy);
      saveProductsInDB(productsCopy);

      try {
        const postDate = fetch(`/api/sync`,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            last_date: clickTime
          })
        });
        const responsePostDate = await postDate;

        if (!responsePostDate.ok) {
          console.error(`Error ${responsePostDate.status} updating sync date in DB`);
        }
        console.log("Sync date updated in DB successfully");
      } catch(error) {
        console.error("Error updating sync date in DB:", error);
      }

    } catch(error) {
      console.error("error:", error);
    } finally {
      alert("Stock mis à jour avec les ventes récentes !");
    }

  };

  /* New list function */
  const handleNewList = async () => {
    setProducts([]);
    setMode("list");
  }

  /* Get refresh product function */
  async function handleRefreshProduct(sku:string | undefined) {
    console.log(`Refreshing product with SKU: ${sku}`);
    const findedProduct = products.find(p => p.variants[0]?.sku === sku);
    if (!findedProduct) {
      console.error(`Product with SKU ${sku} not found in current products list.`);
      return;
    } else {
      console.log(`Product found:`, findedProduct);
      getDataFromIpacky([findedProduct]);
    }
  }

  /* Add product function */
  const handleAddProduct = async (sku: string) => {
    try {
      const result = await fetch(`/api/list?sku=${encodeURIComponent(sku)}`);
      
      if (!result.ok) return;

      const data = await result.json();
      if (!data.data || data.data.length === 0) return;

      const fetchedProduct: ProductProps = data.data[0];

      const existingProduct = products.find(p => p.id === fetchedProduct.id);

      if (existingProduct) {
        setTimeout(() => {
          const productDivItem = document.querySelector(`[data-product-id="${fetchedProduct.id}"]`);
          const buttonPlusOne = productDivItem?.querySelector('.plus-one') as HTMLElement;
          
          if (buttonPlusOne) {
            buttonPlusOne.click();
          }
        }, 100);
        
      } else {
        setProducts(prev => [fetchedProduct, ...prev]);
        setTimeout(() => {
          const productDivItem = document.querySelector(`[data-product-id="${fetchedProduct.id}"]`);
          const buttonPlusOne = productDivItem?.querySelector('.plus-one') as HTMLElement;
          
          if (buttonPlusOne) {
            buttonPlusOne.click();
          }
        }, 100);
      }
      
    } catch(error) {
      console.error("Error en handleAddProduct:", error);
    }
  };

  return (
    <div>
      <main>
        {/* <!-- ==================== TOP BAR ==================== --> */}
        <Header onSync={handleSync} onGetAllProducts={handleGetAllProductsFromNeon} onGetSelledProducts={handleGetSelledProducts} mode={mode} />

        {/* <!-- ==================== CONTROLS PANEL ==================== --> */}
        <ControlPanel onFilterChange={handleFilterChange} onSortChange={handleSortChange} onProductSearch={handleProductSearch} onNewList={handleNewList} mode={mode} onAddProduct={handleAddProduct} />

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
                  <ProductCard key={product.id} product={product} onConfirm={handleProductConfirm} onDelete={handleProductDelete} foundedProductId={foundedProductId} onRefresh={handleRefreshProduct} mode={mode}/>
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
