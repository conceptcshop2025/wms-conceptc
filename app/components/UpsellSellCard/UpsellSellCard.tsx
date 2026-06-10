import { type UpsellSellCardProps, type SelledProductsByUpsellProps } from "@/app/types/types"

export default function UpsellSellCard({ campaignTitle, data }:UpsellSellCardProps) {
  return (
    <div className="upsell-sell-card bg-neutral-50 rounded-lg p-4! shadow-lg">
      <div className="heading-card text-xl">
        Campagne: { campaignTitle }
      </div>
      <div className="body-card">
        <div className="product-heading grid grid-cols-[1fr_minmax(90px,95px)_minmax(50px,80px)] gap-4 py-4! bg-neutral-200 rounded-t-lg">
          <p className="pl-4! text-left">Titre</p>
          <p className="text-center">SKU</p>
          <p className="text-right pr-4!">Quantité</p>
        </div>
        { data.length === 0 ? <p className="py-4! text-center">Il n&apos;y a pas des produits vendus pour cette capagne.</p> : data.map((product: SelledProductsByUpsellProps, index: number) => (
          <div className="product-item grid grid-cols-[1fr_minmax(90px,95px)_minmax(50px,80px)] gap-4 odd:bg-neutral-300/20 py-4!" key={index}>
            <p className="pl-4!">
              { product.productTitle }
              { product.variantTitle !== 'Default Title' && <small>{ product.variantTitle }</small> }
            </p>
            <p className="text-center">{ product.sku }</p>
            <p className="text-right pr-4!">{ product.quantity }</p>
          </div>
        )) }
      </div>
    </div>
  )
}