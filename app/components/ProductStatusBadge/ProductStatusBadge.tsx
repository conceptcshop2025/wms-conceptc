import { type ProductItemProps } from "@/app/types/types";

export default function ProductStatusBadge({ product }: { product: ProductItemProps }) {

  const maxBin = product.bin_max_quantity;
  const remaining = product.bin_current_quantity;

  const remainingPercentage = () => {
    if (maxBin === null || maxBin === 0) return 0;
    const invQty = Number(product.inventory_quantity) ?? 0;
    const effectiveMax = (invQty > 0 && invQty < maxBin) ? invQty : maxBin;
    const finalPercentage = Math.round((remaining / effectiveMax) * 100);
    return finalPercentage < 0 ? 0 : finalPercentage;
  }

  const statusBadge = () => {
    const percentage = remainingPercentage();
    if (percentage >= 61) return "Stock élevé";
    if (percentage >= 41 && percentage < 61) return "Stock moyen";
    if (percentage >= 26 && percentage < 41) return "Stock faible";
    if (percentage >= 1 && percentage < 26) return "Stock très faible";
    if (percentage <= 0) return "Sans stock";
    return "Pas disponible";
  }

  const statusColorBadge = () => {
    const percentage = remainingPercentage();
    if (percentage >= 61) return "var(--status-high)";
    if (percentage >= 41 && percentage < 61) return "var(--status-medium)";
    if (percentage >= 26 && percentage < 41) return "var(--status-low)";
    if (percentage >= 1 && percentage < 26) return "var(--status-low)";
    if (percentage <= 0) return "var(--status-empty)";
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