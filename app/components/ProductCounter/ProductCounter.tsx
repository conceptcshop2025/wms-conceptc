interface ProductCounterProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export default function ProductCounter({ currentPage, itemsPerPage, totalItems }: ProductCounterProps) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="table-header-bar">
      <div className="result-count">
        Montre <strong>{from}–{to}</strong> de <strong>{totalItems}</strong> produits
      </div>
    </div>
  )
}
