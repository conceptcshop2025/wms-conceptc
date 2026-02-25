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