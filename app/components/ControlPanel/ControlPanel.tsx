"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

interface ControlPanelProps {
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onProductSearch: (query: string) => void;
  onTitleSearch: (value: string) => void;
  onNewList: () => void;
  mode: "list" | "warehouse";
  onAddProduct: (sku: string) => void;
  onSaveList: (nameList: string) => void;
  onChecked: (value: boolean) => void;
}

export default function ControlPanel({ onFilterChange, onSortChange, onProductSearch, onTitleSearch, onNewList, mode, onAddProduct, onSaveList, onChecked }: ControlPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [titleSearchValue, setTitleSearchValue] = useState("");
  const [addProductValue, setAddProductValue] = useState<string>("");
  const addProductTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [customListName, setCustomListName] = useState("");

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      onProductSearch(value);
      setSearchValue("");
    }, 500);
  };

  const handleAddProduct = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sku = e.target.value;
    setAddProductValue(sku);

    if (addProductTimerRef.current) clearTimeout(addProductTimerRef.current);

    addProductTimerRef.current = setTimeout(() => {
      onAddProduct(sku);
      setAddProductValue("");
    }, 500);
  }

  return (
    <section className="controls-panel sticky top-[68px] z-1">
      {/* <!-- Row 1: Add product + Search --> */}
      <div className="controls-row">
        {
          mode === "list" && (
            <>
              <div className="input-group" style={{ width: "240px" }}>
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                </span>
                <input type="text" className="form-input add-product" placeholder="Ajouter par UPC ou SKU..." style={{ width: "100%" }} value={addProductValue} onChange={handleAddProduct} />
              </div>
              <div className="separator"></div>
            </>
          )
        }

        <div className="input-group search-product" style={{ width: "220px" }}>
          <span className="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher dans la liste..."
            style={{ width: "100%" }}
            value={searchValue}
            onChange={handleSearchInput}
          />
        </div>

        <div className="separator"></div>

        <div className="input-group search-product-by-title" style={{ width: "220px" }}>
          <span className="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher par titre..."
            style={{ width: "100%" }}
            value={titleSearchValue}
            onChange={(e) => { setTitleSearchValue(e.target.value); onTitleSearch(e.target.value); }}
          />
        </div>

        <div className="separator"></div>

        <select
          className="form-select"
          style={{ width: "180px" }}
          onChange={e => onFilterChange(e.target.value)}
        >
          <option value="">Filtrer par % de stock</option>
          <option value="empty">Sans stock (0%)</option>
          <option value="very-low">Très faible (&lt; 25%)</option>
          <option value="low">Stock faible (26%-40%)</option>
          <option value="medium">Stock moyen (41%-60%)</option>
          <option value="high">Stock élevé (&gt; 61%)</option>
        </select>

        <select
          className="form-select"
          style={{ width: "180px" }}
          onChange={e => onSortChange(e.target.value)}
        >
          <option value="">Trier par...</option>
          <option value="pct-asc">% restant</option>
          <option value="bin-desc">Emplacement de Bin</option>
        </select>

        <div className="option-group option-group--hide-products-without-stock">
          <div className="container-input">
            <input type="checkbox" id="hide-products-without-stock" name="hide-products-without-stock" onChange={(e) => onChecked(e.target.checked)} />
            <label htmlFor="hide-products-without-stock">Cacher les produits non actives, produits sans stock et produits sans bin location</label>
          </div>
        </div>
      </div>

      {/* <!-- Row 2: List management --> */}
      <div className="controls-row">
        <button className="btn btn-primary new-list-button bg-green-800!" onClick={onNewList}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Nouvelle liste
        </button>

        <Dialog>
        <DialogTrigger className="btn btn-primary new-list-button bg-green-800!">
          <ClipboardDocumentListIcon />
          Nouvelle liste
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className="px-8! pt-8!">
            <DialogTitle className="text-xl">Nom de la nouvelle liste</DialogTitle>
            <DialogDescription className="text-lg">
              Avant de commencer à ajouter des produits à une nouvelle liste, svp nomer la liste pour pouvoir activer le sauvegarde automatique.
            </DialogDescription>
          </DialogHeader>
          <div className="list-name-input px-8! w-full" id="listNameInput">
            <div className="input-group w-full">
              <span className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                </span>
                <input type="text" className="form-input w-full" placeholder="Nom de la liste..." value={customListName} onChange={(e) => setCustomListName(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="px-8! py-2! sm:justify-start">
            <DialogClose asChild>
              <Button type="button" className="px-4! py-2! bg-green-700 hover:bg-green-800">Garder le nom de liste</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {
          mode === "list" && (
            <>
              <button className="btn btn-secondary" onClick={() => onSaveList(customListName)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Enregistrer la liste
              </button>
            </>
          )
        }
      </div>
    </section>
  )
}
