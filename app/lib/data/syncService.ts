import { type ProductItemProps } from "@/app/types/types";
import { fetchBulkProducts } from "@/app/actions/shopify";
import { getAllProductsFromNeon } from "./getAllProductsFromNeon";
import { syncProductsFromIpacky } from "./syncProductsFromIpacky";
import { updateProducts } from "./updateProducts";
import { setProductsInDraftStatus } from "./setProductsInDraftStatus";
import { setProductsInActiveStatus } from "./setProductsInActiveStatus";
import { setProductsExpirationStatus } from "./setProductsExpirationStatus";

/**
 * iPacky sync: reads all products from Neon, enriches them with iPacky data
 * (bin location, max quantity, inventory, aliases) and persists the result.
 * Returns the synced products. Shared by the UI ("Sync from iPacky") and the
 * daily cron job so the behaviour stays identical.
 */
export async function runIpackySync(): Promise<ProductItemProps[]> {
  const allProductFromNeon = await getAllProductsFromNeon();

  if (!Array.isArray(allProductFromNeon)) {
    throw new Error("Expected getAllProductsFromNeon to return an array");
  }

  const syncedProductsFromIpacky = await syncProductsFromIpacky(allProductFromNeon as ProductItemProps[]);
  await updateProducts(syncedProductsFromIpacky);

  return syncedProductsFromIpacky;
}

export type ShopifySyncResult = {
  products: ProductItemProps[];
  shopifyCount: number;
};

/**
 * Shopify sync: pulls the full catalog from Shopify (bulk operation), compares
 * it with what's stored in Neon and:
 *   - inserts brand-new products (enriched from iPacky),
 *   - marks missing products as DRAFT,
 *   - reactivates products that came back as ACTIVE,
 *   - updates the expiration flag.
 * Returns the refreshed product list from Neon plus the Shopify product count.
 * Shared by the UI ("Sync from Shopify") and the cron job.
 */
export async function runShopifySync(): Promise<ShopifySyncResult> {
  const dataFromShopify = await fetchBulkProducts();

  const neonResult = await getAllProductsFromNeon();
  if (!Array.isArray(neonResult)) {
    throw new Error("Expected getAllProductsFromNeon to return an array");
  }
  const dataFromNeon = neonResult as ProductItemProps[];

  const skusFromNeon = new Set(dataFromNeon.map(p => p.sku));
  const skusFromShopify = new Set(dataFromShopify.map(p => p.sku));

  const newProducts = dataFromShopify.filter(p => !skusFromNeon.has(p.sku));
  const productsInDraftOrArchived = dataFromNeon.filter(p => !skusFromShopify.has(p.sku));
  const productsInActiveAgain = dataFromNeon.filter(p => skusFromShopify.has(p.sku) && p.status === "DRAFT");

  const completeProductFromIpackyForNewProducts = await syncProductsFromIpacky(newProducts);

  const productsWithExpirationTag = dataFromShopify.filter(p => p.expiration === true);

  if (newProducts.length > 0) {
    await updateProducts(completeProductFromIpackyForNewProducts);
  }
  if (productsInDraftOrArchived.length > 0) {
    await setProductsInDraftStatus(productsInDraftOrArchived);
  }
  if (productsInActiveAgain.length > 0) {
    await setProductsInActiveStatus(productsInActiveAgain);
  }
  if (productsWithExpirationTag.length > 0) {
    await setProductsExpirationStatus(productsWithExpirationTag);
  }

  const refreshProductsFromNeon = await getAllProductsFromNeon();

  return {
    products: Array.isArray(refreshProductsFromNeon) ? (refreshProductsFromNeon as ProductItemProps[]) : [],
    shopifyCount: dataFromShopify.length,
  };
}
