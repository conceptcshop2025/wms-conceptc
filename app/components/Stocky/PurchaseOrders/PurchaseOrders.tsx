import { useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface StockyPurchaseOrdersProps {
  id: number;
  created_at: string;
  invoice_number: string;
  number: number;
  purchase_items: {
    product_title: string;
    quantity: number;
    cost_price: number;
  }[];
}

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<StockyPurchaseOrdersProps[]>([]);

  const getPurchaseOrders = async () => {
    try {
      const response = await fetch('/api/stocky/purchase-orders');
      const data = await response.json();
      setPurchaseOrders(data.purchase_orders);
      console.log(data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  }

  return (
    <>
      <button className="action-btn action-btn-confirm" onClick={getPurchaseOrders}>
        <ArrowDownTrayIcon className="size-6 text-neutral-50" />
        Get Purchase Orders
      </button>
      <div className="results py-8!">
        <h2 className="text-3xl">Resultats:</h2>
        <div className="data">
          <div className="table w-full">
            <div className="grid grid-cols-[200px_500px_80px_1fr] w-full bg-neutral-900/25 p-2!">
              <span>Création</span>
              <span>Nom de facture</span>
              <span>Numéro</span>
              <span>Produits</span>
            </div>
            <div>
              {
                purchaseOrders.length > 0 && purchaseOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-[200px_500px_80px_1fr] w-full p-2! even:bg-neutral-900/10">
                    <span>{order.created_at}</span>
                    <span>{order.invoice_number}</span>
                    <span>{order.number}</span>
                    <details>
                      <summary className="cursor-pointer">Montrer les produits</summary>
                      <div className="items">
                        {
                          order.purchase_items && order.purchase_items.length > 0 ? order.purchase_items.map((product, index) => (
                            <div key={index} className="item p-2! even:bg-neutral-900/10">
                              <p>{product.product_title}</p>
                              <p>Quantité: {product.quantity}</p>
                              <p>Prix: {product.cost_price}</p>
                            </div>
                          ))
                          : <span>No products to show</span>
                        }
                      </div>
                    </details>
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