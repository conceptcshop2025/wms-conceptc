interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPagesToShow(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | '...')[] = [1];
  const winStart = Math.max(2, current - 2);
  const winEnd = Math.min(total - 1, current + 2);

  if (winStart > 2) result.push('...');
  for (let i = winStart; i <= winEnd; i++) result.push(i);
  if (winEnd < total - 1) result.push('...');
  result.push(total);

  return result;
}

export default function PaginationBar({ currentPage, totalPages, onPageChange }: PaginationBarProps) {
  const pages = getPagesToShow(currentPage, totalPages);

  return (
    <nav className="pagination-bar">
      <button
        className={`page-btn${currentPage === 1 ? ' disabled' : ''}`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="page-info">···</span>
        ) : (
          <button
            key={page}
            className={`page-btn${page === currentPage ? ' active' : ''}`}
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </button>
        )
      )}

      <button
        className={`page-btn${currentPage === totalPages ? ' disabled' : ''}`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </nav>
  );
}
