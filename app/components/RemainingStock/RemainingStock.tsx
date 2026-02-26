import { type ProductProps } from "@/app/types/types"

export default function RemainingStock({ product }: { product: ProductProps }) {

  /* const remainingPercentage =  */
  console.log("qty total", product.variants[0]?.inventoryQuantity);
  console.log("qty in bins", product.bin_current_quantity);
  console.log("max in bins", product.bin_max_quantity);
  console.log("-------------------------------------");

  const maxBin = product.bin_max_quantity;
  // const productTotal = product.variants[0]?.inventoryQuantity;
  const remaining = product.bin_current_quantity;

  const remainingPercentage = () => {
    if (maxBin === null || maxBin === 0) return 0;
    return Math.round((remaining / maxBin) * 100);
  }

  const statusColorByPercentage = () => {
    const percentage = remainingPercentage();
    if (percentage >= 80) return "var(--status-high)";
    if (percentage >= 50) return "var(--status-medium)";
    if (percentage >= 25) return "var(--status-low)";
    if (percentage == 0) return "var(--status-empty)";
    return "var(--status-empty)";
  }

  return (
    <>
      <span
        className="restante-value relative"
        style={{ color: statusColorByPercentage() }}>
        { product.bin_current_quantity }
        {
          product.variants[0] && product.variants[0].commitedInventory > 0 && <small className="absolute top-0 left-3">-{ product.variants[0]?.commitedInventory }</small>
        }
      </span>
      <span className="restante-pct" style={{ color: statusColorByPercentage() }}>{remainingPercentage()}%</span>
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