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
import { type ProductProps, type ProductListProps, type ProductListHistoricProps } from "./types/types";
import Modal from "./components/Modal/Modal";
import Toast from "./components/Toast/Toast";

export default function Home() {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [foundedProductId, setFoundedProductId] = useState<number | null>(null);
  const [mode, setMode] = useState<"list" | "warehouse">("warehouse");
  const [showModal, setShowModal] = useState(false);
  const [productListHistoric, setProductListHistoric] = useState<ProductListHistoricProps[]>([]);

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

    const idx = filteredAndSortedProducts.findIndex(p =>{
      const matchInVariants = 
        p.variants[0]?.sku?.toLowerCase() === q ||
        p.variants[0]?.barcode?.toLowerCase() === q;
      
      const matchInAlias = (Array.isArray(p.b_alias) ? p.b_alias : p.b_alias?.split(',') || [])
        .some(alias => alias.trim().toLowerCase() === q);

      return matchInVariants || matchInAlias;
    });

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
                b_alias: result.data[0].barcodeAliases
              }
            }
          } catch(error) {
            console.error(`Error fetching data for SKU ${sku}:`, error);
          }

          return product;
        })
      )
    )

    if (products.length > 0) {
      const updatedProducts = [...products];
      syncProducts.forEach((item: ProductProps) => {
        const findProductToModify = updatedProducts.find(key => key.variants[0]?.sku === item.variants[0]?.sku);
        if (findProductToModify) {
          findProductToModify.updated_at = new Date().toISOString();
          findProductToModify.bin_max_quantity = item.bin_max_quantity;
          findProductToModify.bin_location = Array.isArray(item.bin_location) ? item.bin_location.join(",") : item.bin_location;
          findProductToModify.inventory_quantity = item.inventory_quantity;
          findProductToModify.b_alias = Array.isArray(item.b_alias) ? item.b_alias.join(",") : item.b_alias;
        }
      });
      setProducts([...updatedProducts]);
      saveProductsInDB(updatedProducts);
      alert("Produit mis à jour avec succès");
    } else {
      setProducts([...syncProducts]);
      saveProductsInDB(syncProducts);
    }
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
    const findedProduct = products.find(p => p.variants[0]?.sku === sku);
    if (!findedProduct) {
      console.error(`Product with SKU ${sku} not found in current products list.`);
      return;
    } else {
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

  /* Save List function */
  const handleSaveList = async (nameList: string) => {
    const listToSave = [...products];
    const productList:ProductListProps[] = [];
    listToSave.forEach((product) => {
      const sku = product.variants[0]?.sku;
      const productDiv = document.querySelector(`[data-product-id="${product.id}"]`) as HTMLElement;
      if (sku) {
        const remainingInput = productDiv.querySelector(".remaining-input") as HTMLInputElement;
        const restockInput = productDiv.querySelector(".restock-input") as HTMLInputElement;
        const item:ProductListProps = {
          sku: sku,
          remaining: remainingInput ? Number(remainingInput.value) : 0,
          restock: restockInput ? Number(restockInput.value) : 0,
          id: product.id
        }
        productList.push(item);
      }
    });
    try {
      const result = await fetch('/api/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameList.length > 0 ? nameList : `Restocking Bin - ${new Date().toISOString()}`,
          products: productList,
        }),
      });

      if (result.ok) {
        alert("Liste enregistrée avec succès !");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error saving list:", error);
    }
  }

  /* Show Modal */
  const handleShowProductListModal = async () => {
    try {
      const result = await fetch('/api/historylist');
      if (!result.ok) {
        console.error(`Error ${result.status} fetching product list history from DB`);
        return;
      }
      const data = await result.json();
      setProductListHistoric(data.data);
    } catch(error) {
      console.error("Error fetching product list history from DB:", error);
    }
    setShowModal(true);
  }

  /* Load Product List History */
  const setProductListFromHistory = async (list: ProductListHistoricProps) => {
    setMode("list");
    setLoading(true);
    list.products.forEach(async (item) => {
      handleAddProduct(item.sku);
    });

    setTimeout(() => {
      list.products.forEach((item) => {
        const findProduct = document.querySelector(`[data-product-id="${item.id}"]`) as HTMLElement;
        if (findProduct) {
          const remainingInput = findProduct.querySelector(".remaining-input") as HTMLInputElement;
          const restockInput = findProduct.querySelector(".restock-input") as HTMLInputElement;
          if (remainingInput) remainingInput.value = String(item.remaining);
          if (restockInput) restockInput.value = String(item.restock);
        }
      });
    }, 300);    

    setShowModal(false);
    setLoading(false);
  }

  return (
    <div>
      <main>
        {/* TOAST */}
        <Toast type={"success"} title={"Lorem ipsum!"} text={"Lorem ipsum dolor sit amet!"} />
        {/* <!-- ==================== TOP BAR ==================== --> */}
        <Header onSync={handleSync} onGetAllProducts={handleGetAllProductsFromNeon} onGetSelledProducts={handleGetSelledProducts} mode={mode} onShowProductListModal={handleShowProductListModal} />

        {/* <!-- ==================== CONTROLS PANEL ==================== --> */}
        <ControlPanel onFilterChange={handleFilterChange} onSortChange={handleSortChange} onProductSearch={handleProductSearch} onNewList={handleNewList} mode={mode} onAddProduct={handleAddProduct} onSaveList={handleSaveList} />

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
                  <ProductCard key={product.id} product={product} onConfirm={handleProductConfirm} onDelete={handleProductDelete} foundedProductId={foundedProductId} onRefresh={handleRefreshProduct} />
                ))
              }

              {/* ==================== PAGINATION ==================== */}
              <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            </div>
        }
      </main>
      <Modal
        isOpen={showModal}
        title="Confirmer la mise à jour"
        message={
          <div>
            <p>Listes d&apos;approvisionnement</p>
            <div className="product-list-content flex flex-col gap-2">
              {
                productListHistoric.length > 0 ? (
                  productListHistoric.map(list => (
                    <div key={list.id} className="product-list-item flex justify-between items-center px-4 py-2 bg-gray-100 rounded" onClick={() => setProductListFromHistory(list)}>
                      <h4 className=" px-4 block">
                        <span className="pl-4!">{list.name}</span>
                      </h4>
                      <button className="action-btn-delete-list action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p>Aucune liste enregistrée</p>
                )
              }
            </div>
          </div>
        }
        confirmText="Confirmer"
        cancelText="Annuler"
        onConfirm={() => console.log('confirm')}
        onClose={() => setShowModal(false)}
        inline
      />
    </div>
  );
}
