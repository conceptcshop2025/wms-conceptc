import { type UpsellSellCardProps, type SelledProductsByUpsellProps } from "@/app/types/types"

export default function UpsellSellCard({ campaignTitle, colorCard, begginingDate, data }:UpsellSellCardProps) {

  const borderStyles = {
    borderColor: colorCard,
  }

  const bakgroundStyles = {
    background: colorCard,
  }

  const totalSelled = () => {
    const total:number = data.reduce((acc, v:SelledProductsByUpsellProps) => acc + (v.quantity * Number(v.productPrice)), 0);
    return Number(total.toFixed(2));
  }

  const averagePrice = () => {
    const averagePrice:number = data.reduce((acc, a:SelledProductsByUpsellProps) => acc + a.quantity, 0)
    return Number(averagePrice);
  }

  return (
    <div className={`upsell-sell-card bg-neutral-50 rounded-lg p-4! shadow-lg border-t-2`} style={borderStyles}>
      <div className="heading-card text-xl mb-4!">
        <h2>Campagne: { campaignTitle }</h2>
        <p className="text-sm">Date de début de campagne: <strong>{ begginingDate }</strong></p>
        <p className="text-sm">Revenus générés par la campagne: <strong>{ totalSelled() }$</strong></p>
        <p className="text-sm">Prix moyen par produit: <strong>{ Number(totalSelled() / averagePrice()).toFixed(2) }$</strong></p>
      </div>
      <div className="body-card">
        <div className={`product-heading grid grid-cols-[1fr_minmax(90px,95px)_minmax(50px,80px)] gap-4 py-4! rounded-t-lg text-neutral-50`} style={bakgroundStyles}>
          <p className="pl-4! text-left">Titre</p>
          <p className="text-center">SKU</p>
          <p className="text-right pr-4!">Quantité</p>
        </div>
        { data.length === 0 ? <p className="py-4! text-center">Il n&apos;y a pas des produits vendus pour cette capagne.</p> : data.slice(0, 10).map((product: SelledProductsByUpsellProps, index: number) => (
          <div className={`product-item grid grid-cols-[1fr_minmax(90px,95px)_minmax(50px,80px)] gap-4 odd:bg-neutral-300/20 py-4!`} key={index}>
            <p className="pl-4!">
              { product.productTitle }
              { product.variantTitle !== 'Default Title' && <small>{ product.variantTitle }</small> }
            </p>
            <p className="text-center">{ product.sku }</p>
            <p className="text-right pr-4! text-xl leading-none">
              <span className="block">{ product.quantity }</span>
              <small className="text-sm text-green-700">{ (Number(product.productPrice) * product.quantity).toFixed(2) }$</small>
            </p>
          </div>
        )) }
      </div>
    </div>
  )
}