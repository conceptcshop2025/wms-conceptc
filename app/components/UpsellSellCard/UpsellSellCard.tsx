"use client";

import { useState } from "react";
import { type UpsellSellCardProps, type SelledProductsByUpsellProps } from "@/app/types/types"

export default function UpsellSellCard({ campaignTitle, colorCard, begginingDate, data }:UpsellSellCardProps) {

  const [clicks, setClicks] = useState<number>(0);
  const [views, setViews] = useState<number>(0);

  const borderStyles = {
    borderColor: colorCard,
  }

  const backgroundStyles = {
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

  const clickRates = (c:number, v:number) => {
    try {
      const value = c/v;
      return Number.isFinite(value) ? value.toFixed(2) + '%' : "";
    } catch {
      return ""
    }
  }

  const conversions = () => {
    try {
      const value:number = data.reduce((acc, a:SelledProductsByUpsellProps) => acc + a.quantity, 0)
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0
    }
  }

  const conversionsRate = (con:number, v:number) => {
    try {
      const value = con/v;
      return Number.isFinite(value) ? value.toFixed(2) + '%' : 0;
    } catch {
      return 0
    }
  }

  const aovViews = (totalSales:number, views:number) => {
    try {
      const value = totalSales/views;
      return Number.isFinite(value) ? value.toFixed(2) + '$' : 0;
    } catch {
      return 0
    }
  }

  const aovConversions = (totalSales:number, views:number) => {
    try {
      const value = totalSales/views;
      return Number.isFinite(value) ? value.toFixed(2) + '$' : 0;
    } catch {
      return 0
    }
  }

  return (
    <div className={`upsell-sell-card bg-neutral-50 rounded-lg p-4! shadow-lg border-t-2`} style={borderStyles}>
      <div className="heading-card text-xl mb-4!">
        <h2>Campagne: { campaignTitle }</h2>
        <p className="text-sm p-2! flex justify-between items-center gap-4"><span>Date de début de campagne: </span> <strong>{ begginingDate }</strong></p>
        <p className="text-sm p-2! flex justify-between items-center gap-4 bg-neutral-200/50">Revenus générés par la campagne: <strong>{ totalSelled() }$</strong></p>
        <p className="text-sm p-2! flex justify-between items-center gap-4">Prix moyen par produit: <strong>{ Number(totalSelled() / averagePrice()).toFixed(2) }$</strong></p>
        <div className="manual-data p-2! bg-neutral-200 rounded-lg">
          <p className="text-sm p-2! flex justify-between items-center gap-4">
            <span>Clicks: </span>
            <input type="number" name="clicks" id="clicks" placeholder="0" min={0} className="py-1! px-2! text-right text-neutral-50 rounded-lg font-bold" style={backgroundStyles} onChange={(e) => setClicks(Number(e.target.value))} />
          </p>
          <p className="text-sm p-2! flex justify-between items-center gap-4">
            <span>Views: </span>
            <input type="number" name="views" id="views" placeholder="0" min={0} className="py-1! px-2! text-right text-neutral-50 rounded-lg font-bold" style={backgroundStyles} onChange={(e) => setViews(Number(e.target.value))} />
          </p>
          <p className="text-sm p-2! flex justify-between items-center gap-4"><span>Clicks Rate: </span><strong>{ clickRates(clicks, views) }</strong></p>
          <p className="text-sm p-2! flex justify-between items-center gap-4"><span>Conversions: </span><strong>{ conversions() }</strong></p>
          <p className="text-sm p-2! flex justify-between items-center gap-4"><span>Conversions Rate: </span><strong>{ conversionsRate(conversions(), views) }</strong></p>
          <p className="text-sm p-2! flex justify-between items-center gap-4"><span>Conversion Value: </span><strong>{ totalSelled() }$</strong></p>
          <p className="text-sm p-2! flex justify-between items-center gap-4"><span>AOV Views: </span><strong>{ aovViews(totalSelled(), views) }</strong></p>
          <p className="text-sm p-2! flex justify-between items-center gap-4"><span>AOV Conversions: </span><strong>{ aovConversions(totalSelled(), conversions()) }</strong></p>
        </div>
      </div>
      <div className="body-card">
        <div className={`product-heading grid grid-cols-[1fr_minmax(90px,95px)_minmax(50px,80px)] gap-4 py-4! rounded-t-lg text-neutral-50`} style={backgroundStyles}>
          <p className="pl-4! text-left">Titre</p>
          <p className="text-center">SKU</p>
          <p className="text-right pr-4!">Quantité</p>
        </div>
        { data.length === 0 ? <p className="py-4! text-center">Il n&apos;y a pas des produits vendus pour cette capagne.</p> : data.slice(0, 5).map((product: SelledProductsByUpsellProps, index: number) => (
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