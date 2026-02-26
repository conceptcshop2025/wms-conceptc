import { type ProductProps } from "@/app/types/types";

export default function ProductStatusBadge({ product }: { product: ProductProps }) {

  const maxBin = product.bin_max_quantity;
  const remaining = product.bin_current_quantity;

  const remainingPercentage = () => {
    if (maxBin === null || maxBin === 0) return 0;
    return Math.round((remaining / maxBin) * 100);
  }

  const statusBadge = () => {
    const percentage = remainingPercentage();
    if (percentage >= 80) return "Stock élevé";
    if (percentage >= 25 && percentage < 80) return "Stock moyen";
    if (percentage >= 1 && percentage < 25) return "Stock faible";
    if (percentage == 0) return "Sans stock";
    return "Pas disponible";
  }

  const statusColorBadge = () => {
    const percentage = remainingPercentage();
    if (percentage >= 80) return "var(--status-high)";
    if (percentage >= 25 && percentage < 80) return "var(--status-medium)";
    if (percentage >= 1 && percentage < 25) return "var(--status-low)";
    if (percentage == 0) return "var(--status-empty)";
    return "var(--status-empty)";
  }

  return (
    <>
      <span
        className="status-badge text-neutral-50"
        style={{ backgroundColor: statusColorBadge() }}>
        <span className="status-dot bg-neutral-50"></span>
        { statusBadge() }
      </span>
    </>
  )
}