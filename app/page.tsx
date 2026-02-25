"use client";

import { useState } from "react";
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

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    console.log([...syncProducts]);
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

  return (
    <div>
      <main>
        <p>{status}</p>
        
        {/* <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"> */}


        {/* <!-- ==================== TOP BAR ==================== --> */}
        <Header onSync={handleSync}/>

        {/* <!-- ==================== CONTROLS PANEL ==================== --> */}
        <ControlPanel/>

        {/* ==================== MAIN CONTENT ==================== */}
        {
          loading ?
            <Loading text={"Chargement des données"} /> :
            <div className="main-content">
              {/* Product Counter */}
              <ProductCounter/>

              {/* <!-- ===== PRODUCT CARD 1 — Sin stock ===== --> */}
              {
                products.length > 0 && paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              }

              {/* ===== PRODUCT CARD 2 — Bajo stock ===== */}
              {/* <div className="product-card">
                <div className="product-card-inner">
                  <div className="product-image-col">
                    <div className="product-thumb">
                      <div className="product-thumb-placeholder">📦</div>
                    </div>
                  </div>
                  <div className="product-details-col">
                    <div className="product-row-1">
                      <div>
                        <div className="product-name">O&M · Masque Réparateur Protéiné The Power Base</div>
                        <div className="product-variant">250 ml</div>
                      </div>
                      <span className="status-badge status-low">
                        <span className="status-dot"></span>
                        Bajo stock
                      </span>
                    </div>
                    <div className="product-row-2">
                      <span className="code-tag"><span className="code-label">SKU</span> 210000021530</span>
                      <span className="code-tag"><span className="code-label">UPC</span> 9333478000298</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <div className="data-cell">
                        <span className="data-cell-label">Qty Total</span>
                        <span className="data-cell-value">27</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Max Bin</span>
                        <span className="data-cell-value">8</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Restante</span>
                        <span className="restante-value" style={{ color: "var(--status-low)" }}>2</span>
                        <span className="restante-pct" style={{ color: "var(--status-low)" }}>25%</span>
                        <div className="progress-mini"><div className="progress-mini-fill progress-low" style={{ width: "25%" }}></div></div>
                      </div>
                      <div className="editable-section" style={{ marginLeft: "auto" }}>
                        <div className="editable-block">
                          <span className="editable-block-label">Restante (editar)</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="2" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                        <div className="editable-block">
                          <span className="editable-block-label">A aprovisionar</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="6" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <span className="data-cell-label" style={{ marginBottom: "4px", display: "block" }}>Ubicaciones</span>
                      <div className="bin-locations">
                        <span className="bin-tag">320.01.01.A</span>
                        <span className="bin-tag">320.06.01</span>
                      </div>
                    </div>
                    <div className="product-row-4">
                      <button className="action-btn action-btn-delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Quitar
                      </button>
                      <button className="action-btn action-btn-fill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        Bin llena
                      </button>
                      <button className="action-btn action-btn-confirm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* ===== PRODUCT CARD 3 — Stock medio ===== */}
              {/* <div className="product-card">
                <div className="product-card-inner">
                  <div className="product-image-col">
                    <div className="product-thumb">
                      <div className="product-thumb-placeholder">📦</div>
                    </div>
                  </div>
                  <div className="product-details-col">
                    <div className="product-row-1">
                      <div>
                        <div className="product-name">Paul Mitchell · Shampoing pour Enfants Baby Don&quot;t Cry</div>
                        <div className="product-variant">1000 ml</div>
                      </div>
                      <span className="status-badge status-medium">
                        <span className="status-dot"></span>
                        Stock medio
                      </span>
                    </div>
                    <div className="product-row-2">
                      <span className="code-tag"><span className="code-label">SKU</span> 670000003750</span>
                      <span className="code-tag"><span className="code-label">UPC</span> 009531138749</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <div className="data-cell">
                        <span className="data-cell-label">Qty Total</span>
                        <span className="data-cell-value">379</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Max Bin</span>
                        <span className="data-cell-value">24</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Restante</span>
                        <span className="restante-value" style={{ color: "var(--status-medium)" }}>9</span>
                        <span className="restante-pct" style={{ color: "var(--status-medium)" }}>38%</span>
                        <div className="progress-mini"><div className="progress-mini-fill progress-medium" style={{ width: "38%" }}></div></div>
                      </div>
                      <div className="editable-section" style={{ marginLeft: "auto" }}>
                        <div className="editable-block">
                          <span className="editable-block-label">Restante (editar)</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="9" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                        <div className="editable-block">
                          <span className="editable-block-label">A aprovisionar</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="15" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <span className="data-cell-label" style={{ marginBottom: "4px", display: "block" }}>Ubicaciones</span>
                      <div className="bin-locations">
                        <span className="bin-tag">206.03.02</span>
                        <span className="bin-tag">504.01.01</span>
                        <span className="bin-tag">136.08.01</span>
                      </div>
                    </div>
                    <div className="product-row-4">
                      <button className="action-btn action-btn-delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Quitar
                      </button>
                      <button className="action-btn action-btn-fill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        Bin llena
                      </button>
                      <button className="action-btn action-btn-confirm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* ===== PRODUCT CARD 4 — Alto stock ===== */}
              {/* <div className="product-card">
                <div className="product-card-inner">
                  <div className="product-image-col">
                    <div className="product-thumb">
                      <div className="product-thumb-placeholder">📦</div>
                    </div>
                  </div>
                  <div className="product-details-col">
                    <div className="product-row-1">
                      <div>
                        <div className="product-name">Nioxin · Revitalisant Système 2</div>
                        <div className="product-variant">1000 ml</div>
                      </div>
                      <span className="status-badge status-high">
                        <span className="status-dot"></span>
                        Alto stock
                      </span>
                    </div>
                    <div className="product-row-2">
                      <span className="code-tag"><span className="code-label">SKU</span> 670000000766</span>
                      <span className="code-tag"><span className="code-label">UPC</span> 4064666305202</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <div className="data-cell">
                        <span className="data-cell-label">Qty Total</span>
                        <span className="data-cell-value">35</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Max Bin</span>
                        <span className="data-cell-value">24</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Restante</span>
                        <span className="restante-value" style={{ color: "var(--status-high)" }}>20</span>
                        <span className="restante-pct" style={{ color: "var(--status-high)" }}>83%</span>
                        <div className="progress-mini"><div className="progress-mini-fill progress-high" style={{ width: "83%" }}></div></div>
                      </div>
                      <div className="editable-section" style={{ marginLeft: "auto" }}>
                        <div className="editable-block">
                          <span className="editable-block-label">Restante (editar)</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="20" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                        <div className="editable-block">
                          <span className="editable-block-label">A aprovisionar</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="4" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <span className="data-cell-label" style={{ marginBottom: "4px", display: "block" }}>Ubicaciones</span>
                      <div className="bin-locations">
                        <span className="bin-tag">118.03.04</span>
                        <span className="bin-tag">700.01.02</span>
                      </div>
                    </div>
                    <div className="product-row-4">
                      <button className="action-btn action-btn-delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Quitar
                      </button>
                      <button className="action-btn action-btn-fill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        Bin llena
                      </button>
                      <button className="action-btn action-btn-confirm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* ===== PRODUCT CARD 5 — Stock medio with variant ===== */}
              {/* <div className="product-card">
                <div className="product-card-inner">
                  <div className="product-image-col">
                    <div className="product-thumb">
                      <div className="product-thumb-placeholder">📦</div>
                    </div>
                  </div>
                  <div className="product-details-col">
                    <div className="product-row-1">
                      <div>
                        <div className="product-name">Wella · Koleston Perfect Crème Colorante Permanente</div>
                        <div className="product-variant">60 ml · <strong style={{ color: "var(--text-primary)" }}>Variante: 7/1 Rubio Cendré</strong></div>
                      </div>
                      <span className="status-badge status-medium">
                        <span className="status-dot"></span>
                        Stock medio
                      </span>
                    </div>
                    <div className="product-row-2">
                      <span className="code-tag"><span className="code-label">SKU</span> 810000045320</span>
                      <span className="code-tag"><span className="code-label">UPC</span> 4015600187453</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                      <div className="data-cell">
                        <span className="data-cell-label">Qty Total</span>
                        <span className="data-cell-value">19</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Max Bin</span>
                        <span className="data-cell-value">18</span>
                      </div>
                      <div className="data-cell">
                        <span className="data-cell-label">Restante</span>
                        <span className="restante-value" style={{ color: "var(--status-medium)" }}>7</span>
                        <span className="restante-pct" style={{ color: "var(--status-medium)" }}>39%</span>
                        <div className="progress-mini"><div className="progress-mini-fill progress-medium" style={{ width: "39%" }}></div></div>
                      </div>
                      <div className="editable-section" style={{ marginLeft: "auto" }}>
                        <div className="editable-block">
                          <span className="editable-block-label">Restante (editar)</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="7" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                        <div className="editable-block">
                          <span className="editable-block-label">A aprovisionar</span>
                          <div className="qty-control">
                            <button className="qty-btn qty-btn-fast">−10</button>
                            <button className="qty-btn">−</button>
                            <input type="number" className="qty-value" value="11" readOnly tabIndex={-1} />
                            <button className="qty-btn">+</button>
                            <button className="qty-btn qty-btn-fast">+10</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <span className="data-cell-label" style={{ marginBottom: "4px", display: "block" }}>Ubicaciones</span>
                      <div className="bin-locations">
                        <span className="bin-tag">483.04.03</span>
                        <span className="bin-tag">483.04.04</span>
                        <span className="bin-tag">483.08.01</span>
                      </div>
                    </div>
                    <div className="product-row-4">
                      <button className="action-btn action-btn-delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Quitar
                      </button>
                      <button className="action-btn action-btn-fill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        Bin llena
                      </button>
                      <button className="action-btn action-btn-confirm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* ==================== PAGINATION ==================== */}
              <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            </div>
        }
      </main>
    </div>
  );
}
