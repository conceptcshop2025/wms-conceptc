import { useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface StockyStockAdjustmentsProps {
  id: number;
  adjusted_at: string;
  previous_quantity: number;
  quantity:number;
  new_quantity: number;
  status: string;
  variant: {
    shopify_id: number;
    sku: string;
    barcode: string;
  }
}

export default function StockAdjustment() {
const [stockAdjustments, setStockAdjustments] = useState<StockyStockAdjustmentsProps[]>([]);

  const getStockAdjustments = async () => {
    try {
      const response = await fetch('/api/stocky/stock-adjustment');
      const data = await response.json();
      console.log(data);
      const orderedData = data.stock_adjustment_items.sort(
        (a: StockyStockAdjustmentsProps, b: StockyStockAdjustmentsProps) =>
          new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime()
      );
      setStockAdjustments(orderedData);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  }

  return (
    <>
      <button className="action-btn action-btn-confirm" onClick={getStockAdjustments}>
        <ArrowDownTrayIcon className="size-6 text-neutral-50" />
        Get Stock Adjustment
      </button>
      <div className="results py-8!">
        <h2 className="text-3xl">Resultats:</h2>
        <div className="data">
          <div className="table w-full">
            <div className="grid grid-cols-8 w-full gap-4 bg-neutral-900/25 p-2!">
              <span>Date d&apos;ajustement</span>
              <span>Shopify Id</span>
              <span>SKU</span>
              <span>UPC</span>
              <span>Ancien quantité</span>
              <span>Quantité</span>
              <span>Nouveaux quantité</span>
              <span>Status</span>
            </div>
            <div>
              {
                stockAdjustments.length > 0 && stockAdjustments.map((product) => (
                  <div key={product.id} className="grid grid-cols-8 w-full gap-4 p-2! even:bg-neutral-900/10">
                    <span>{product.adjusted_at}</span>
                    <span>{product.variant.shopify_id}</span>
                    <span>{product.variant.sku}</span>
                    <span>{product.variant.barcode}</span>
                    <span>{product.previous_quantity}</span>
                    <span>{product.quantity}</span>
                    <span>{product.new_quantity}</span>
                    <span>{product.status}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}