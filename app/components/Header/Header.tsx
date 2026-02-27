interface HeaderProps {
  onSync: () => void;
  onGetAllProducts: () => void;
}

export default function Header({ onSync, onGetAllProducts }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <div className="logo-mark">C</div>
          <div>
            <div className="logo-text">CONCEPT C</div>
            <div className="logo-sub">WMS · Québec</div>
          </div>
        </div>
        <span className="version-badge">v1.2.0</span>
      </div>
      <div className="topbar-actions">
        <button
          className="btn btn-ghost btn-icon disabled:pointer-events-none disabled:opacity-50" title="Sincronizar datos"
          onClick={onSync}
          disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </button>
        <button className="btn btn-secondary" >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Listes gardées
        </button>
        <button className="btn btn-secondary" onClick={onGetAllProducts}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Tous les produits
        </button>
        <button className="btn btn-secondary" onClick={onGetAllProducts}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Obtenir les ventes plus récents
        </button>
      </div>
    </header>
  )
}