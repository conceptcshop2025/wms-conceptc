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

interface AdjustmentProductsProps {
  id: number;
  title: string;
  sku: string;
  quantity: number;
}

interface AdjustmentsProps {
  id: number;
  location: string;
  products: AdjustmentProductsProps[];
}

interface AdjustmentsDataResponseProps {
  adjusted_at: string | null;
  archived: boolean;
  created_at: string;
  id: number;
  location: {
    id: number;
    shopify_id: number;
  };
  sequential_id: number;
  stock_adjustment_reason: {
    id: number;
    reason: string;
  } | null;
  updated_at: string;
}

interface AdjustmentsItemsDataResponseProps {
  adjusted_at: string | null;
  id: number;
  new_quantity: number;
  previous_quantity: number;
  quantity: number;
  status: string;
  stock_adjustment_id: number;
  updated_at: string;
  variant: {
    barcode: string;
    id: number;
    shopify_id: number;
    sku: string;
    title: string;
  }
}

export default function StockyPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentsProps[]>([]);
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
      // console.log(data.purchase_orders.find(item => item.number === 19413));
      setOrders(data.purchase_orders || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stocky/adjustments");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      const adjustmentsData: AdjustmentsProps[] = data.stock_adjustments.map((item: AdjustmentsDataResponseProps) => {
        return {
          id: item.id,
          location: getLocationNameById(item.location.shopify_id),
          products: []
        }
      });
      return adjustmentsData || [];
    } catch (err) {
      setError(String(err));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustmentsItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stocky/adjustment-items");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      const adjustmentsItemsData: AdjustmentProductsProps[] = data.stock_adjustment_items.map((item: AdjustmentsItemsDataResponseProps) => {
        return {
          id: item.stock_adjustment_id,
          title: item.variant.title,
          sku: item.variant.sku,
          quantity: item.quantity
        }
      });
      return adjustmentsItemsData || [];
    } catch (err) {
      setError(String(err));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const mergeAdjustmentData = (adjustments: AdjustmentsProps[], adjustmentsItems: AdjustmentProductsProps[]): AdjustmentsProps[] => {
    adjustmentsItems.map((item: AdjustmentProductsProps) => {
      const findItemToAdjustment = adjustments.find((adjustment: AdjustmentsProps) => adjustment.id === item.id);
      if (findItemToAdjustment) {
        findItemToAdjustment.products.push(item);
      }
    });

    return adjustments;

  };

  const fetchAdjustmentReport = async () => {
    const adjustments = await fetchAdjustments();
    if (adjustments && adjustments.length > 0) {
      const adjustmentsItems = await fetchAdjustmentsItems();
      const adjustmentDataMerged = mergeAdjustmentData(adjustments, adjustmentsItems);
      //console.log(adjustmentDataMerged);
      setAdjustments(adjustmentDataMerged || []);
    }
  }

  const getLocationNameById = (locationId:string|number) => {
    const locationString = locationId.toString();

    if (locationString === '67343220887') {
      return 'Entrêpot QC'
    } else if (locationString === '14563147837') {
      return 'Boutique Trois-Rivière'
    } else if (locationString === '67710976151') {
      return 'Boutique Québec'
    } else if (locationString === '6494453821') {
      return 'Concept C. 04 297 Notre-Dame Est - Victoriaville'
    }

    return locationId;
  } 

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
      "items_count",
      "total_quantity",
      "purchase_items",
      "shopify_receive_location_id"
    ];

    const rows: string[] = [headers.join(",")];
    orders.forEach((order) => {
      const items = order.purchase_items || [];

      const itemsList = items
        .map(
          (item) =>
            `${item.quantity} x ${item.product_title}` +
            `${item.variant_title ? ` (${item.variant_title})` : ""}` +
            `${item.sku ? ` [SKU: ${item.sku}]` : ""}` +
            ` [ID: ${item.id}]` +
            ` [Status: ${item.status}]` +
            ` [Updated: ${item.updated_at}]`
        )
        .join(" | ");

      const totalQuantity = items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );

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
        items.length,
        totalQuantity,
        itemsList,
        getLocationNameById(order.shopify_receive_location_id)
      ];
      rows.push(row.map(escapeCsv).join(","));
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
        <div className="p-8! shadow-xl rounded-lg mr-4!">
          <h2 className="text-2xl mb-4!">Purchase Orders</h2>
          <button onClick={fetchPurchaseOrders} disabled={loading} className="bg-sky-600 rounded-lg py-1! px-2! text-neutral-50 mr-4!">
            {loading ? "Loading..." : "Get Purchase Orders"}
          </button>
          <button onClick={exportToCsv} disabled={orders.length === 0} className="bg-green-600 rounded-lg py-1! px-2! text-neutral-50">
            Export to CSV
          </button>
        </div>
        <div className="p-8! shadow-xl rounded-lg mr-4!">
          <h2 className="text-2xl mb-4!">Adjustments</h2>
          <button onClick={fetchAdjustmentReport} disabled={loading} className="bg-sky-600 rounded-lg py-1! px-2! text-neutral-50 mr-4!">
            {loading ? "Loading..." : "Get Adjustments"}
          </button>
          <button onClick={exportToCsv} disabled={adjustments.length === 0} className="bg-green-600 rounded-lg py-1! px-2! text-neutral-50">
            Export to CSV
          </button>
        </div>
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
                          order.purchase_items !== null && order.purchase_items.map((product) => (
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

      {
        adjustments.length > 0 && (
          <>
            <p>
              Showing first 10 of {adjustments.length} adjustment(s).
            </p>
            <table
              border={1}
              cellPadding={6}
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>Products</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.slice(0, 10).map((adjustment) => (
                  <tr key={adjustment.id} className="odd:bg-neutral-300">
                    <td className="py-1!">{adjustment.id}</td>
                    <td className="py-1!">{adjustment.location}</td>
                    <td className="py-1!">
                      <details>
                        <summary>Products</summary>
                        <ul>
                          {
                            adjustment.products !== null && adjustment.products.length > 0 && adjustment.products.map((product:AdjustmentProductsProps) => (
                              <li key={product.id}>{product.sku} ({product.quantity})</li>
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
        )
      }
    </div>
  );
}
