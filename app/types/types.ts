export type ProductProps = {
  id: number;
  shopify_id: string;
  title: string;
  sku: string;
  upc: string;
  image_url: string;
  vendor: string;
  product_type: string;
  updated_at: string;
  variant_title: string;
  inventory_quantity: number;
  bin_max_quantity: number;
  bin_current_quantity: number;
  bin_location: string;
}