"use client";

import { useRef, useState } from "react";

interface ControlPanelProps {
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onProductSearch: (query: string) => void;
}

export default function ControlPanel({ onFilterChange, onSortChange, onProductSearch }: ControlPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      onProductSearch(value);
      setSearchValue("");
    }, 500);
  };

  return (
    <section className="controls-panel sticky top-[68px] z-1">
      {/* <!-- Row 1: Add product + Search --> */}
      <div className="controls-row">
        <div className="input-group" style={{ width: "240px" }}>
          <span className="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </span>
          <input type="text" className="form-input" placeholder="Ajouter par UPC ou SKU..." style={{ width: "100%" }}/>
        </div>
        <button className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter
        </button>

        <div className="separator"></div>

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

        <select
          className="form-select"
          style={{ width: "180px" }}
          onChange={e => onFilterChange(e.target.value)}
        >
          <option value="">Filtrer par % de stock</option>
          <option value="empty">Sans stock (0%)</option>
          <option value="low">Stock faible (&lt; 25%)</option>
          <option value="medium">Stock moyen (25%-79%)</option>
          <option value="high">Stock élevé (&gt; 80%)</option>
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
      </div>

      {/* <!-- Row 2: List management --> */}
      <div className="controls-row">
        <button className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Nouvelle liste
        </button>

        <button className="btn btn-secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Enregistrer la liste
        </button>

        <label className="checkbox-group">
          <input type="checkbox" id="listNameToggle"/>
          <span>Nom personnalisé</span>
        </label>

        <div className="list-name-input" id="listNameInput">
          <div className="input-group" style={{ width: "220px" }}>
            <span className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              </span>
              <input type="text" className="form-input" placeholder="Nom de la liste..." style={{ width: "100%" }}/>
          </div>
        </div>
      </div>
    </section>
  )
}
