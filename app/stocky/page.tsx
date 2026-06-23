"use client";

import { useState } from "react";

interface PurchaseItem {
  id: number;
  sku: string;
  inventory_item_id: number;
  product_title: string;
  variant_title: string;
  asin: string;
  quantity: number;
  status: string;
  retail_price: string | null;
  cost_price: string | null;
  supplier_cost_price: string | null;
  account_code: string | null;
  tax_type_id: number | null;
  accounting_tax_type: string | null;
  received_at: string | null;
  updated_at: string;
}

interface PurchaseOrder {
  id: number;
  number: number;
  sequential_id: number;
  invoice_number: string | null;
  created_at: string;
  updated_at: string;
  generated_at: string;
  ordered_at: string;
  expected_on: string | null;
  ship_on: string | null;
  payment_due_on: string | null;
  archived: boolean;
  supplier_name: string;
  supplier_id: string;
  currency: string;
  shopify_receive_location_id: number;
  paid: boolean;
  adjustments: number;
  adjustments_local: number;
  shipping: number;
  shipping_local: number;
  shipping_tax_type: number;
  invoice_date: string | null;
  purchase_items: PurchaseItem[];
}

export default function StockyPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stocky");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      // console.log(data.purchase_orders.find(key => key.number === 18709));
      console.log(data);
      setOrders(data.purchase_orders || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const escapeCsv = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCsv = () => {
    if (orders.length === 0) return;

    const headers = [
      "purchase_order_id",
      "number",
      "sequential_id",
      "invoice_number",
      "supplier_name",
      "supplier_id",
      "currency",
      "created_at",
      "ordered_at",
      "expected_on",
      "ship_on",
      "archived",
      "paid",
      "adjustments",
      "shipping",
      "item_id",
      "item_sku",
      "item_product_title",
      "item_variant_title",
      "item_quantity",
      "item_status",
      "item_retail_price",
      "item_cost_price",
      "item_accounting_tax_type",
      "item_received_at",
      "item_updated_at",
    ];

    const rows: string[] = [headers.join(",")];
    orders.forEach((order) => {
      const items = order.purchase_items !== null && order.purchase_items.length > 0 ? order.purchase_items : [null];
      items.forEach((item) => {
        const row = [
          order.id,
          order.number,
          order.sequential_id,
          order.invoice_number,
          order.supplier_name,
          order.supplier_id,
          order.currency,
          order.created_at,
          order.ordered_at,
          order.expected_on,
          order.ship_on,
          order.archived,
          order.paid,
          order.adjustments,
          order.shipping,
          item?.id,
          item?.sku,
          item?.product_title,
          item?.variant_title,
          item?.quantity,
          item?.status,
          item?.retail_price,
          item?.cost_price,
          item?.accounting_tax_type,
          item?.received_at,
          item?.updated_at,
        ];
        rows.push(row.map(escapeCsv).join(","));
      });
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stocky-purchase-orders-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stocky" style={{ padding: "1.5rem" }}>
      <h1>Stocky - Purchase Orders</h1>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
        <button onClick={fetchPurchaseOrders} disabled={loading} className="bg-sky-600 rounded-lg py-1! px-2! text-neutral-50">
          {loading ? "Loading..." : "Get Purchase Orders"}
        </button>
        <button onClick={exportToCsv} disabled={orders.length === 0} className="bg-green-600 rounded-lg py-1! px-2! text-neutral-50">
          Export to CSV
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {orders.length > 0 && (
        <>
          <p>
            Showing first 10 of {orders.length} purchase order(s).
          </p>
          <table
            border={1}
            cellPadding={6}
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Number</th>
                <th>Supplier</th>
                <th>Currency</th>
                <th>Ordered At</th>
                <th>Expected On</th>
                <th>Items</th>
                <th>Total Qty</th>
                <th>Paid</th>
                <th>Archived</th>
                <th>Products</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="odd:bg-neutral-300">
                  <td className="py-1!">{order.id}</td>
                  <td className="py-1!">{order.number}</td>
                  <td className="py-1!">{order.supplier_name}</td>
                  <td className="py-1!">{order.currency}</td>
                  <td className="py-1!">{order.ordered_at}</td>
                  <td className="py-1!">{order.expected_on}</td>
                  {order.purchase_items !== null && <td className="py-1!">{order.purchase_items.length}</td>}
                  <td className="py-1!">
                    {order.purchase_items !== null && order.purchase_items.reduce(
                      (sum, item) => sum + (item.quantity || 0),
                      0
                    )}
                  </td>
                  <td className="py-1!">{order.paid ? "Yes" : "No"}</td>
                  <td className="py-1!">{order.archived ? "Yes" : "No"}</td>
                  <td className="py-1!">
                    <details>
                      <summary>Products</summary>
                      <ul>
                        {
                          order.purchase_items.map((product) => (
                            <li key={product.id}>{product.product_title}</li>
                          ))
                        }
                      </ul>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
