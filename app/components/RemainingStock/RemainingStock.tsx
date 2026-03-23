import { type ProductProps } from "@/app/types/types"

export default function RemainingStock({ product }: { product: ProductProps }) {

  const maxBin = product.bin_max_quantity;
  const remaining = product.bin_current_quantity;

  const remainingPercentage = () => {
    if (maxBin === null || maxBin === 0) return 0;
    const invQty = Number(product.inventory_quantity) ?? 0;
    const effectiveMax = (invQty > 0 && invQty < maxBin) ? invQty : maxBin;
    return Math.round((remaining / effectiveMax) * 100);
  }

  const statusColorByPercentage = () => {
    const percentage = remainingPercentage();
    if (percentage >= 61) return "var(--status-high)";
    if (percentage >= 41 && percentage < 61) return "var(--status-medium)";
    if (percentage >= 26 && percentage < 41) return "var(--status-low)";
    if (percentage >= 1 && percentage < 26) return "var(--status-low)";
    if (percentage == 0) return "var(--status-empty)";
    return "var(--status-empty)";
  }

  return (
    <>
      <span
        className="restante-value relative text-2xl"
        style={{ color: statusColorByPercentage() }}>
        { product.bin_current_quantity }
        {
          product.variants[0] && product.variants[0].commitedInventory > 0 && <small className="absolute top-0 left-3">-{ product.variants[0]?.commitedInventory }</small>
        }
      </span>
      <span className="restante-pct text-lg" style={{ color: statusColorByPercentage() }}>{remainingPercentage()}%</span>
      <div
        className="progress-mini">
        <div
          className="progress-mini-fill"
          style={{ width: `${remainingPercentage()}%`, background: statusColorByPercentage() }}>
        </div>
      </div>
    </>
  )
}