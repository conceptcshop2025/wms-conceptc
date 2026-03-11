"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { type ProductProps } from "../../types/types";
import RemainingStock from "../RemainingStock/RemainingStock";
import ProductStatusBadge from "../ProductStatusBadge/ProductStatusBadge";
import Modal from "../Modal/Modal";

interface ProductCardProps {
  product: ProductProps;
  onConfirm: (sku: string, bin_current_quantity: number, update_at: string) => void;
  onDelete: (id: number) => void;
  foundedProductId?: number | null;
  onRefresh: (sku: string | undefined) => void;
}

export default function ProductCard({ product, onConfirm, onDelete, foundedProductId, onRefresh }: ProductCardProps) {
  const modeDev = process.env.NODE_ENV === "development";
  const [remaining, setRemaining] = useState<number>(Number(product.bin_current_quantity) || 0);
  const [restock, setRestock] = useState<number>(0);
  const [confirmed, setConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFillModal, setShowFillModal] = useState(false);
  const [showNoMaxModal, setShowNoMaxModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const isAnyModalOpen = showModal || showFillModal || showNoMaxModal || showDeleteModal || showImageModal;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (isAnyModalOpen) {
      const h = card.scrollHeight;
      card.style.minHeight = `${h * 2}px`;
    } else {
      card.style.minHeight = "";
    }
  }, [isAnyModalOpen]);

  async function handleConfirm() {
    const sku = product.variants[0]?.sku;
    if (!sku) return;

    const bin_current_quantity = remaining + restock;
    const update_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

    try {
      const res = await fetch("/api/warehouse", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, bin_current_quantity, update_at }),
      });

      if (res.ok) {
        setConfirmed(true);
        onConfirm(sku, bin_current_quantity, update_at);
      }
    } catch (error) {
      console.error("Error confirming product:", error);
    }
  }

  async function handleDeleteConfirm() {
    try {
      const res = await fetch("/api/warehouse", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });

      if (res.ok) {
        console.log(`Product deleted successfully: ${product.title} (SKU: ${product.variants[0]?.sku || "N/A"})`);
        onDelete(product.id);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }

  function handleFillBinClick() {
    const maxQty = Number(product.bin_max_quantity);
    if (!product.bin_max_quantity || maxQty === 0) {
      setShowNoMaxModal(true);
      return;
    }
    setShowFillModal(true);
  }

  async function handleFillBinConfirm() {
    const sku = product.variants[0]?.sku;
    if (!sku) return;

    const bin_current_quantity = Number(product.bin_max_quantity);
    const update_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

    try {
      const res = await fetch("/api/warehouse", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, bin_current_quantity, update_at }),
      });

      if (res.ok) {
        setRemaining(bin_current_quantity);
        setRestock(0);
        setConfirmed(true);
        onConfirm(sku, bin_current_quantity, update_at);
        console.log(`Bin filled successfully for SKU: ${sku}. New quantity: ${bin_current_quantity}`);
      }
    } catch (error) {
      console.error("Error filling bin:", error);
    }
  }

  function binFormat(bin_location: string | string[] | null) {
    if (typeof bin_location === "string") {
      if (bin_location === "") {
        return <div className="skeleton skeleton-bin"></div>;
      } else {
        return bin_location.split(',').map((loc, idx) => (
          <div key={idx} className="bin-tag text-2xl">{loc.trim()}</div>
        ));
      }
    } else if (Array.isArray(product.bin_location)) {
      return product.bin_location
    } else {
      return [product.bin_location].map((location:string, index:number) => (
        <div key={index} className="bin-tag text-2xl">{ location }</div>
      ));
    }
  }

  return (
    <div
      ref={cardRef}
      className={`product-card${confirmed ? " confirmed" : ""} ${foundedProductId === product.id ? " founded" : ""}`}
      data-product-id={product.id}
      style={{ position: "relative", overflow: "hidden", transition: "min-height 0.25s ease" }}
    >
      <div className="product-card-inner">
        <div className="product-image-col">
          {
            product.image_url ? (
              <Image src={product.image_url} alt={product.title} width={100} height={100} className="product-image product-thumb" style={{ cursor: "zoom-in" }} onClick={() => setShowImageModal(true)} />
            ) : (
              <div className="product-thumb">
                <div className="product-thumb-placeholder">📦</div>
              </div>
            )
          }
        </div>
        <div className="product-details-col">
          {/* Row 1 */}
          <div className="product-row-1">
            <div>
              <div className="product-name">{ product.title }</div>
              {
                product.variants[0] && product.variants[0].title !== "Default Title" ? (
                  <div className="product-variant">
                    { product.variants[0].title }
                  </div>
                ) : null
              }
            </div>
            <ProductStatusBadge product={product} />
          </div>
          {/* Row 2: Codes */}
          <div className="product-row-2">
            <span className="code-tag text-2xl">
              <span className="code-label">SKU</span> { product.variants[0]?.sku || "N/A" }
            </span>
            <span className="code-tag text-2xl"><span className="code-label">UPC</span>
              {
                product.variants[0]?.barcode === "" ? <div className="skeleton"></div> : product.variants[0]?.barcode || "N/A"
              }
            </span>
          </div>
          {
            product.b_alias && (
              <div className="product-row-2-1">
                <span className="code-label">
                  B-Alias
                  {
                    typeof product.b_alias === "string"
                      ? product.b_alias.split(",").map((alias, idx) => (
                          <span key={idx} className="alias-tag bin-tag text-md">{alias.trim()}</span>
                        ))
                      : product.b_alias.map((alias, idx) => (
                          <span key={idx} className="alias-tag bin-tag text-md">{alias}</span>
                        ))
                  }
                </span>
              </div>
            )
          }
          {/* Row 3: Data */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div className="data-cell">
              <span className="data-cell-label">Qty Total</span>
              <span className="data-cell-value text-2xl">{ product.inventoryQuantity || product.inventory_quantity }</span>
            </div>
            <div className="data-cell">
              <span className="data-cell-label">Max Bin</span>
              <span className="data-cell-value text-2xl">
                {
                  product.bin_max_quantity !== null ? product.bin_max_quantity : "N/A"
                }
              </span>
            </div>
            <div className="data-cell">
              <span className="data-cell-label">Restant</span>
              <RemainingStock product={product} />
            </div>

            <div className="editable-section" style={{ marginLeft: "auto" }}>
              <div className="editable-block">
                <span className="editable-block-label">Restant (éditer)</span>
                <div className="qty-control control-restant">
                  <button className="qty-btn qty-btn-fast" onClick={() => setRemaining(v => v - 10)}>−10</button>
                  <button className="qty-btn" onClick={() => setRemaining(v => v - 1)}>−</button>
                  <input type="number" className="qty-value remaining-input" value={remaining} readOnly tabIndex={-1} />
                  <button className="qty-btn" onClick={() => setRemaining(v => v + 1)}>+</button>
                  <button className="qty-btn qty-btn-fast" onClick={() => setRemaining(v => v + 10)}>+10</button>
                </div>
              </div>
              <div className="editable-block">
                <span className="editable-block-label">à approvisionner </span>
                <div className="qty-control control-restock">
                  <button className="qty-btn qty-btn-fast" onClick={() => setRestock(v => v - 10)}>−10</button>
                  <button className="qty-btn" onClick={() => setRestock(v => v - 1)}>−</button>
                  <input type="number" className="qty-value restock-input" value={restock} readOnly tabIndex={-1} />
                  <button className="qty-btn plus-one" onClick={() => setRestock(v => v + 1)}>+</button>
                  <button className="qty-btn qty-btn-fast" onClick={() => setRestock(v => v + 10)}>+10</button>
                </div>
              </div>
            </div>
          </div>
          {/* Bins */}
          <div style={{ marginTop: "8px" }}>
            <span className="data-cell-label" style={{ marginBottom: "4px", display: "block" }}>Locations</span>
            <div className="bin-locations">
              {
                binFormat(product.bin_location)
              }
            </div>
          </div>
          {/* Actions */}
          <div className="product-row-4">
            <button className="action-btn action-btn-refresh bg-orange-200! text-orange-500!" onClick={() => onRefresh(product.variants[0]?.sku)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Rafraichir
            </button>
            {
              modeDev && (
                <button className="action-btn action-btn-delete" onClick={() => setShowDeleteModal(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  Enlever
                </button>
              )
            }
            <button className="action-btn action-btn-fill" onClick={handleFillBinClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              Bin plein
            </button>
            <button className="action-btn action-btn-confirm" onClick={() => setShowModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Confirmer
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        title="Confirmer la mise à jour"
        message={
          <div>
            <p>Voulez-vous confirmer la mise à jour du produit&nbsp;?</p>
            <p style={{ marginTop: "8px" }}><strong>{product.title}</strong></p>
            <span className="modal-sku">SKU: {product.variants[0]?.sku || "N/A"}</span>
          </div>
        }
        confirmText="Confirmer"
        cancelText="Annuler"
        onConfirm={handleConfirm}
        onClose={() => setShowModal(false)}
        inline
      />

      <Modal
        isOpen={showFillModal}
        title="Remplir la bin"
        message={
          <div>
            <p>Voulez-vous marquer la bin comme pleine&nbsp;?</p>
            <p style={{ marginTop: "8px" }}><strong>{product.title}</strong></p>
            <span className="modal-sku">SKU: {product.variants[0]?.sku || "N/A"}</span>
            <p style={{ marginTop: "10px" }}>
              La quantité sera mise à <strong>{product.bin_max_quantity}</strong> (max bin).
            </p>
          </div>
        }
        confirmText="Remplir"
        cancelText="Annuler"
        onConfirm={handleFillBinConfirm}
        onClose={() => setShowFillModal(false)}
        inline
      />

      <Modal
        isOpen={showDeleteModal}
        title="Supprimer le produit"
        message={
          <div>
            <p>Voulez-vous supprimer ce produit de la liste&nbsp;?</p>
            <p style={{ marginTop: "8px" }}><strong>{product.title}</strong></p>
            <span className="modal-sku">SKU: {product.variants[0]?.sku || "N/A"}</span>
          </div>
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteConfirm}
        onClose={() => setShowDeleteModal(false)}
        inline
      />

      <Modal
        isOpen={showNoMaxModal}
        title="Quantité max non définie"
        message={
          <div>
            <p>Impossible de remplir la bin — la quantité maximale de ce produit n&apos;est pas définie.</p>
            <p style={{ marginTop: "8px" }}><strong>{product.title}</strong></p>
            <span className="modal-sku">SKU: {product.variants[0]?.sku || "N/A"}</span>
          </div>
        }
        confirmText="OK"
        cancelText="Fermer"
        onConfirm={() => setShowNoMaxModal(false)}
        onClose={() => setShowNoMaxModal(false)}
        inline
      />

      {product.image_url && (
        <Modal
          isOpen={showImageModal}
          title={product.title}
          message={
            <div style={{ textAlign: "center" }}>
              <Image
                src={product.image_url}
                alt={product.title}
                width={400}
                height={400}
                style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: "6px" }}
              />
            </div>
          }
          confirmText="Fermer"
          cancelText=""
          onConfirm={() => setShowImageModal(false)}
          onClose={() => setShowImageModal(false)}
          inline
        />
      )}
    </div>
  )
}
