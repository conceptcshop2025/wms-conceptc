export default function ProductCard() {
  return (
    <div className="product-card">
      <div className="product-card-inner">
        <div className="product-image-col">
          <div className="product-thumb">
            <div className="product-thumb-placeholder">📦</div>
          </div>
        </div>
        <div className="product-details-col">
          {/* Row 1 */}
          <div className="product-row-1">
            <div>
              <div className="product-name">Paul Mitchell · Démêlant Pour Enfants Taming Spray</div>
              <div className="product-variant">250 ml</div>
            </div>
            <span className="status-badge status-empty">
              <span className="status-dot"></span>
              Sin stock
            </span>
          </div>
          {/* Row 2: Codes */}
          <div className="product-row-2">
            <span className="code-tag"><span className="code-label">SKU</span> 670000004260</span>
            <span className="code-tag"><span className="code-label">UPC</span> 009531138756</span>
          </div>
          {/* Row 3: Data */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div className="data-cell">
              <span className="data-cell-label">Qty Total</span>
              <span className="data-cell-value">8</span>
            </div>
            <div className="data-cell">
              <span className="data-cell-label">Max Bin</span>
              <span className="data-cell-value">16</span>
            </div>
            <div className="data-cell">
              <span className="data-cell-label">Restante</span>
              <span className="restante-value" style={{ color: "var(--status-empty)" }}>0</span>
              <span className="restante-pct" style={{ color: "var(--status-empty)" }}>0%</span>
              <div className="progress-mini"><div className="progress-mini-fill progress-empty" style={{ width: "0%" }}></div></div>
            </div>

            <div className="editable-section" style={{ marginLeft: "auto" }}>
              <div className="editable-block">
                <span className="editable-block-label">Restante (editar)</span>
                <div className="qty-control">
                  <button className="qty-btn qty-btn-fast">−10</button>
                  <button className="qty-btn">−</button>
                  <input type="number" className="qty-value" value="0" readOnly tabIndex={-1} />
                  <button className="qty-btn">+</button>
                  <button className="qty-btn qty-btn-fast">+10</button>
                </div>
              </div>
              <div className="editable-block">
                <span className="editable-block-label">A aprovisionar</span>
                <div className="qty-control">
                  <button className="qty-btn qty-btn-fast">−10</button>
                  <button className="qty-btn">−</button>
                  <input type="number" className="qty-value" value="16" readOnly tabIndex={-1} />
                  <button className="qty-btn">+</button>
                  <button className="qty-btn qty-btn-fast">+10</button>
                </div>
              </div>
            </div>
          </div>
          {/* Bins */}
          <div style={{ marginTop: "8px" }}>
            <span className="data-cell-label" style={{ marginBottom: "4px", display: "block" }}>Ubicaciones</span>
            <div className="bin-locations">
              <span className="bin-tag">238.02.03.G</span>
              <span className="bin-tag">238.02.03.H</span>
            </div>
          </div>
          {/* Actions */}
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
    </div>
  )
}