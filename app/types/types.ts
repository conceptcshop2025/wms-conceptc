export type ProductProps = {
  id: number;
  shopify_id: string;
  title: string;
  image_url: string;
  vendor: string;
  product_type: string;
  updated_at: string;
  bin_max_quantity: number;
  bin_current_quantity: number;
  bin_location: string | string[];
  variants: VariantProps[];
  inventoryQuantity: number;
  inventory_quantity?:number;
}

export type VariantProps = {
  variant_id: string;
  title: string;
  sku: string;
  barcode: string;
  inventoryQuantity: number;
  commitedInventory: number;
  __parentId: string;
}

export type SalesDataProps = {
  node: {
    id: string;
    number: number;
    lineItems: {
      edges: {
        node: {
          sku: string;
          quantity: number;
          product_title: string;
          variant: {
            sku: string;
          },
          product: {
            title: string;
          }
        }
      }[];
    }
  }
}

export type SummarizedItemProps = {
  sku: string;
  quantity: number;
  product_title: string;
}

export type SummarizedOrderProps = {
  orderShopifyId: string;
  orderId: number;
  items: SummarizedItemProps[];
}

export type SummarizedAccProps = {
  [sku: string]: {
    quantity: number;
    sku: string;
  }
}

export type ProductListProps = {
  sku: string;
  remaining: number;
  restock: number;
}