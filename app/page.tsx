"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { fetchBulkProducts } from "./actions/shopify";
// import { getSalesBetweenDates } from "./actions/sales-shopify";
import Header from "./components/Header/Header";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import ProductCounter from "./components/ProductCounter/ProductCounter";
import PaginationBar from "./components/PaginationBar/PaginationBar";
import ProductCard from "./components/ProductCard/ProductCard";
import Loading from "./components/Loading/Loading";
import { type ProductListProps, type ProductListHistoricProps, type ProductItemProps } from "./types/types";
import Modal from "./components/Modal/Modal";
import Toast from "./components/Toast/Toast";
import { getAllProductsFromNeon } from "./lib/data/getAllProductsFromNeon";
import { syncProductsFromIpacky } from "./lib/data/syncProductsFromIpacky";
import { updateProducts } from "./lib/data/updateProducts";
import { setProductsInDraftStatus } from "./lib/data/setProductsInDraftStatus";
import { setProductsInActiveStatus } from "./lib/data/setProductsInActiveStatus";
import { setProductsExpirationStatus } from "./lib/data/setProductsExpirationStatus";
import Menu from "./components/Menu/Menu";

export default function Home() {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState<ProductItemProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [titleSearch, setTitleSearch] = useState("");
  const [foundedCardKey, setFoundedCardKey] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "warehouse">("warehouse");
  const [showModal, setShowModal] = useState(false);
  const [productListHistoric, setProductListHistoric] = useState<ProductListHistoricProps[]>([]);
  const [hideNotActiveProducts, setHideNotActiveProducts] = useState<boolean>(false);
  const [openMenu, setOpenMenu] = useState<boolean>(false);

  const ITEMS_PER_PAGE = 20;

  const getRemainingPct = (p: ProductItemProps) => {
    const maxBin = Number(p.bin_max_quantity);
    if (!maxBin) return 0;
    const invQty = Number(p.inventory_quantity) ?? 0;
    const effectiveMax = (invQty > 0 && invQty < maxBin) ? invQty : maxBin;
    return Math.round((Number(p.bin_current_quantity) / effectiveMax) * 100);
  };

  const getFirstBinNumber = (p: ProductItemProps): number => {
    const raw = Array.isArray(p.bin_location)
      ? p.bin_location[0]
      : (p.bin_location || "").split(",")[0]?.trim();
    if (!raw) return Infinity;
    const n = parseFloat(raw);
    return isNaN(n) ? Infinity : n;
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    if (titleSearch.trim()) {
      const query = titleSearch.trim().toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(query));
    }

    if (filter === "empty") {
      list = list.filter(p => getRemainingPct(p) <= 0);
    } else if (filter === "very-low") {
      list = list.filter(p => { const pct = getRemainingPct(p); return pct > 0 && pct < 25; });
    } else if (filter === "low") {
      list = list.filter(p => { const pct = getRemainingPct(p); return pct > 25 && pct < 41; });
    } else if (filter === "medium") {
      list = list.filter(p => { const pct = getRemainingPct(p); return pct >= 41 && pct < 61; });
    } else if (filter === "high") {
      list = list.filter(p => getRemainingPct(p) >= 61);
    }

    if (sort === "pct-asc") {
      list.sort((a, b) => getRemainingPct(a) - getRemainingPct(b));
    } else if (sort === "bin-desc") {
      list.sort((a, b) => getFirstBinNumber(a) - getFirstBinNumber(b));
    }

    if(hideNotActiveProducts) {
      list = list.filter(p => p.status === 'ACTIVE');
    }

    return list;
  }, [products, filter, sort, titleSearch, hideNotActiveProducts]);

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
    const q = query.trim();
    if (!q) return;

    const idx = filteredAndSortedProducts.findIndex(p => {
      const matchInVariants =
        p.sku === q ||
        p.barcode === q

      const matchInAlias = (Array.isArray(p.b_alias) ? p.b_alias : p.b_alias?.split(',') || [])
        .some(alias => alias.trim().toLowerCase() === q);

      return matchInVariants || matchInAlias;
    });

    if (idx === -1) {
      console.error(`Product not found: "${query}"`);
      setFoundedCardKey(null);
      return;
    }

    const found = filteredAndSortedProducts[idx];
    if (!found) return;
    const cardKey = found.id;
    const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;
    setCurrentPage(targetPage);
    setFoundedCardKey(cardKey);
  }, [filteredAndSortedProducts]);

  useEffect(() => {
    if (!foundedCardKey) return;
    const el = document.querySelector(`[data-card-key="${foundedCardKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [foundedCardKey, currentPage]);

  const handleSync = async () => {
    setLoading(true);
    setStatus("Solicitando datos a Shopify...");
    setProducts([]);
    try {

      setStatus("Shopify está preparando el archivo... (Bulk Operation)");
      const bulkProducts = await fetchBulkProducts();
      setCurrentPage(1);
      setStatus(`¡Sincronización completa! ${bulkProducts.length} productos cargados.`);
      const dataFromShopify =  bulkProducts;

      const neonResult = await getAllProductsFromNeon();

      if (!Array.isArray(neonResult)) {
        throw new Error("Expected getAllProductsFromNeon to return an array");
      }

      const dataFromNeon = neonResult as ProductItemProps[];

      const skusFromNeon = new Set(dataFromNeon.map(p => p.sku));
      const skusFromShopify = new Set(dataFromShopify.map(p => p.sku));

      const newProducts = dataFromShopify.filter(p => !skusFromNeon.has(p.sku));
      const productsInDraftOrArchived = dataFromNeon.filter(p => !skusFromShopify.has(p.sku));
      const productsInActiveAgain = dataFromNeon.filter(p => skusFromShopify.has(p.sku) && p.status === "DRAFT");

      const completeProductFromIpackyForNewProducts = await syncProductsFromIpacky(newProducts);
      
      const productsWithExpirationTag = dataFromShopify.filter(p => p.expiration === true);
      
      if (newProducts.length > 0) {
        updateProducts(completeProductFromIpackyForNewProducts);
      }
      if (productsInDraftOrArchived.length > 0) {
        setProductsInDraftStatus(productsInDraftOrArchived);
      }
      if (productsInActiveAgain.length > 0) {
        setProductsInActiveStatus(productsInActiveAgain);
      }
      if (productsWithExpirationTag.length > 0) {
        setProductsExpirationStatus(productsWithExpirationTag);
      }

      const refreshProductsFromNeon = await getAllProductsFromNeon();
      setProducts(refreshProductsFromNeon as ProductItemProps[]);

      setLoading(false);

    } catch (error: unknown) {
      console.error("Error:", error);
      setStatus(`Error: ${error}`);
      setLoading(false);
    }
  };

  const handleProductDelete = useCallback((id: string, variantSku?: string) => {
    setProducts(prev => prev.filter(p => !(p.id === id && (p.sku ?? p.sku) === variantSku)));
  }, []);

  const handleProductConfirm = (sku: string, bin_current_quantity: number, update_at: string) => {
    setProducts(prev =>
      prev.map(p =>
        (p.sku ?? p.sku) === sku
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

      const firstRes = await fetch(`/api/store-products?page=1&limit=${LIMIT}`);
      if (!firstRes.ok) throw new Error(`Error ${firstRes.status}`);
      const firstData = await firstRes.json();

      let allProducts: ProductItemProps[] = [...firstData.products];
      const { total, totalPages } = firstData as { total: number; totalPages: number };

      setStatus(`Chargement des produits... (${allProducts.length} / ${total})`);

      for (let page = 2; page <= totalPages; page++) {
        const res = await fetch(`/api/store-products?page=${page}&limit=${LIMIT}`);
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
    setLoading(true);
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
        const findProduct = productsCopy.find(p => p.sku === sale.sku);
        if (findProduct) {
          findProduct.bin_current_quantity = Number(findProduct.bin_current_quantity) - sale.quantity;
          findProduct.inventory_quantity = Number(findProduct.inventory_quantity) - sale.quantity;
        }
      });

      setProducts(productsCopy);
      updateProducts(productsCopy);

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
      setLoading(false);
    }
  };

  /* New list function */
  const handleNewList = async () => {
    setProducts([]);
    setMode("list");
  }

  /* Get refresh product function */
  async function handleRefreshProduct(sku:string | undefined) {
    const findedProduct = products.find(p => p.sku === sku);
    if (!findedProduct) {
      console.error(`Product with SKU ${sku} not found in current products list.`);
      return;
    } else {
      const productReady = await syncProductsFromIpacky([findedProduct]);
      const productToUpdate = productReady[0];
      if (!productToUpdate) {
        console.error(`Failed to refresh product with SKU ${sku}`);
        return;
      }
      updateProducts(productReady);
      setProducts(prev =>
        prev.map(p => (p.sku === productToUpdate.sku ? productToUpdate : p))
      );
      alert(`Produit avec sku ${productToUpdate.sku} est à jour correctement!`);
    }
  }

  /* Add product function */
  const handleAddProduct = async (code: string) => {
    try {
      const result = await fetch(`/api/list?sku=${encodeURIComponent(code)}`);

      if (!result.ok) return;

      const data = await result.json();
      if (!data.data || data.data.length === 0) {
        try {
          /* const shopifyResult = await fetch(`/api/shopify?code=${code}`);
          if (!result.ok) {
            console.error('Error trying data from iPacky');
          }
          const shopifyResponse = await shopifyResult.json();
          data = shopifyResponse;
          console.log('get product from shopify: ', data);
          await addNewProductInNeonDB(data.data[0]); */
          alert(`Produit avec code "${code}" non trouvé dans la base de données locale. Veuillez vérifier le code ou synchroniser les produits pour mettre à jour la base de données.`);
        } catch (error) {
          console.error("Error trying data from iPacky: ", error);
        }
      }

      const fetchedProduct: ProductItemProps = data.data[0];


      // Check if a card for this exact variant already exists
      const cardKey = fetchedProduct.id;
      const existingCard = products.find(p =>
        p.id === cardKey
      );

      if (existingCard) {
        setTimeout(() => {
          const cardDiv = document.querySelector(`[data-card-key="${cardKey}"]`);
          const buttonPlusOne = cardDiv?.querySelector('.plus-one') as HTMLElement;
          if (buttonPlusOne) buttonPlusOne.click();
        }, 100);
      } else {
        const productToAdd: ProductItemProps = { ...fetchedProduct };
        setProducts(prev => [productToAdd, ...prev]);
        setTimeout(() => {
          const cardDiv = document.querySelector(`[data-card-key="${cardKey}"]`);
          const buttonPlusOne = cardDiv?.querySelector('.plus-one') as HTMLElement;
          if (buttonPlusOne) buttonPlusOne.click();
        }, 100);
      }
    } catch(error) {
      console.error("Error en handle Add Product:", error);
    }
  };

  /* Save List function */
  const handleSaveList = async (nameList: string) => {
    const listToSave = [...products];
    const productList:ProductListProps[] = [];
    listToSave.forEach((product) => {
      const sku = product.sku ?? product.sku;
      const cardKey = product.id;
      const productDiv = document.querySelector(`[data-card-key="${cardKey}"]`) as HTMLElement;
      if (sku) {
        const remainingInput = productDiv?.querySelector(".remaining-input") as HTMLInputElement;
        const restockInput = productDiv?.querySelector(".restock-input") as HTMLInputElement;
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
      setProducts([]);
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
    setShowModal(false);

    try {
      for (const item of list.products) {
        await handleAddProduct(item.sku);
      }

      setTimeout(() => {
        list.products.forEach((item) => {
          const cardKey = `${item.id}`;
          const findProduct = document.querySelector(`[data-card-key="${cardKey}"]`) as HTMLElement;
          if (findProduct) {
            const remainingInput = findProduct.querySelector(".remaining-input") as HTMLInputElement;
            const restockInput = findProduct.querySelector(".restock-input") as HTMLInputElement;
            if (remainingInput) remainingInput.value = String(item.remaining);
            if (restockInput) restockInput.value = String(item.restock);
          }
        });
      }, 150);
    } catch (error) {
      console.error('Error trying show list of products from history list: ', error);
    } finally {
      setLoading(false);
    }
  }

  /* Delete product List Element */
  const deleteProductList = async (id: number) => {
    try {
      const result = await fetch("/api/list", {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id
        }),
      });

      if (!result.ok) {
        console.error('Error in delete product list');
      }

      const response = await result.json();
      if (response) {
        console.log("Product list deleted successfully");
        const productListFiltered = productListHistoric.filter(key => key.id !== id);
        setProductListHistoric(productListFiltered)
      }
    } catch (error) {
      console.error('Error in delete product list: ', error);
    }
  }

  /* Remove product from product List */
  const handleRemoveProductFromProductList = async (variantSku: string | undefined) => {
    const filteredList = [...products].filter(key => key.sku !== variantSku);
    setProducts(filteredList);
  }

  /* save new products to neon DB */
  /* const addNewProductInNeonDB = async (newProduct: ProductItemProps) => {
    const sku = newProduct.sku; 
    try {
      const response = await fetch(`/api/ipacky?code=${sku}&type=sku`);
      const result = await response.json();

      if (response.ok && result.data[0]) {
        newProduct.bin_location = result.data[0].binLocations || "",
        newProduct.bin_max_quantity = result.data[0].htsUS || null,
        newProduct.image_url = result.data[0].imageURL || '',
        newProduct.inventory_quantity = result.data[0].quantityOnHand,
        newProduct.bin_current_quantity = 0,
        newProduct.b_alias = result.data[0].barcodeAliases
      }

      try {
        const response = await fetch('/api/warehouse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProduct)
        });

        const data = await response.json();

        if (data.data.length === 0) {
          console.error('Error trying save product in DB');
          return;
        } else {
          console.log('Product saved successfully');
        }
      } catch(error) {
        console.error(`Error in api service for save product ${newProduct}:`, error);
      }
    } catch(error) {
      console.error(`Error fetching data for SKU ${sku}:`, error);
    }
    console.log('NEW Product with iPacky data: ', newProduct);
  } */

  const handleSyncGetAllProductsFromNeon = async () => {
    setProducts([]);
    setLoading(true);
    setMode("warehouse");

    const allProductFromNeon = await getAllProductsFromNeon() as ProductItemProps[];
    const syncedProductsFromIpacky = await syncProductsFromIpacky(allProductFromNeon);
  
    setProducts(syncedProductsFromIpacky);
    updateProducts(syncedProductsFromIpacky);

    setLoading(false);
  }

  const handleHideNotActiveProducts = async (value:boolean) => {
    setHideNotActiveProducts(value);
  }

  const toggleMenu = () => {
    setOpenMenu(prev => !prev);
  }

  return (
    <div>
      <main>
        {/* TOAST */}
        <Toast type={"success"} title={"Lorem ipsum!"} text={"Lorem ipsum dolor sit amet!"} />
        
        {/* TOAST */}
        <Menu isOpen={openMenu} onCloseMenu={toggleMenu} />
        {/* <!-- ==================== TOP BAR ==================== --> */}
        <Header onSync={handleSync} onGetAllProducts={handleGetAllProductsFromNeon} onGetSelledProducts={handleGetSelledProducts} mode={mode} onShowProductListModal={handleShowProductListModal} onGetAllProductsFromNeon={handleSyncGetAllProductsFromNeon} onShowMenu={toggleMenu}/>

        {/* <!-- ==================== CONTROLS PANEL ==================== --> */}
        <ControlPanel onFilterChange={handleFilterChange} onSortChange={handleSortChange} onProductSearch={handleProductSearch} onNewList={handleNewList} mode={mode} onAddProduct={handleAddProduct} onSaveList={handleSaveList} onTitleSearch={setTitleSearch} onChecked={handleHideNotActiveProducts} />

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
                  <ProductCard
                    key={`${product.id}`}
                    product={product}
                    onConfirm={handleProductConfirm}
                    onDelete={handleProductDelete}
                    foundedCardKey={foundedCardKey}
                    onRefresh={handleRefreshProduct}
                    onDeleteFromProductList={handleRemoveProductFromProductList} />
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
                    <div key={list.id} className="product-list-item flex justify-between items-center px-4 py-2 bg-gray-100 rounded">
                      <h4 className=" px-4 block cursor-pointer" onClick={() => setProductListFromHistory(list)}>
                        <span className="pl-4!">{list.name}</span>
                      </h4>
                      <button className="action-btn-delete-list action-btn" onClick={() => deleteProductList(list.id)}>
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
