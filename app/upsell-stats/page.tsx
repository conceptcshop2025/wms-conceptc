"use client";

import { useState } from "react";
import Menu from "../components/Menu/Menu";
import { Bars3Icon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { type SelledProductsByUpsellProps, type UpsellCampaignProps } from "../types/types";
import UpsellSellCard from "../components/UpsellSellCard/UpsellSellCard";

export default function UpsellStatsPage() {
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [selledProducts, setSelledProducts] = useState<SelledProductsByUpsellProps[]>([]);
  const clickTime = new Date().toISOString();
  const lastSyncDate = '2026-06-01T00:00:00.000Z';
  const activeCampaigns:UpsellCampaignProps[] = [
    {
      name: "Product List in PDP",
      id: "df4a206c"
    },
    {
      name: "Test MC Air Libre",
      id: "25467e5c"
    },
    {
      name: "Upsell Popup before Checkout page",
      id: "bcf05642"
    },
    {
      name: "26-06-03 Checkout page + Test GPT",
      id: "ddb9ba2a"
    }
  ]

  const toggleMenu = () => {
    setOpenMenu(prev => !prev);
  }

  const getUpsellStats = async () => {
    try {
      const getOrders = fetch(`/api/orders`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          last_date: lastSyncDate,
          date: clickTime
        })
      });

      const responseSales = await getOrders;
          
    
      if (!responseSales.ok) {
        console.error(`Error ${responseSales.status} getting sales data from Shopify`);
      }

      
      const data = await responseSales.json();

      console.log("data:", data);
      setSelledProducts(data.data);
    
    } catch(error) {
      console.error("error:", error);
    }
  }

  const getCampaignName = (campaignId:string) => {
    const campaignFormatted = campaignId.split('offer#');
    const id = campaignFormatted[1];

    const campaignFinded = activeCampaigns.find((key:UpsellCampaignProps) => key.id === id);
    if (campaignFinded) {
      return campaignFinded.name;
    }

    return id;
  }

  return (
    <div className="map-bin-page">
          <Menu isOpen={openMenu} onCloseMenu={toggleMenu} />
          <div className="topbar">
            <div className="topbar-left">
              <div className="logo-mark cursor-pointer" onClick={toggleMenu}>
                <Bars3Icon className="size-6" />
              </div>  
              <div>
                <div className="logo-text">CONCEPT C</div>
                <div className="logo-sub">WMS · Québec</div>
              </div>
            </div> 
            <span className="version-badge">v5.0.0</span>
          </div>
          <main className="p-8!">
            <button className="action-btn action-btn-confirm" onClick={getUpsellStats}>
              <ArrowDownTrayIcon className="size-6 text-neutral-50" />
              Obtenir la liste des produits plus vendus du mois
            </button>
            <div className="campaigns-container">
              {
                activeCampaigns.length === 0
                ? <p>Pas de campagnes actives en ce moment.</p>
                : (
                  activeCampaigns.map((campaign:UpsellCampaignProps) => (
                    <UpsellSellCard campaignTitle={campaign.name} data={selledProducts} key={campaign.id} />
                  ))
                )
              }
            </div>
            <div className="selled-product-list mt-4!">
              {
                selledProducts.length === 0
                  ? <p>Zéro résults dans la recherche</p>
                  : <>
                    <div className="product-heading grid grid-cols-[1fr_minmax(90px,95px)_minmax(50px,52px)_minmax(40px,46px)_minmax(100px,233px)] gap-4 py-4! bg-neutral-200">
                      <p className="pl-4! text-left">Titre</p>
                      <p className="text-center">SKU</p>
                      <p className="text-right">Quantité</p>
                      <p className="text-center">Ordre</p>
                      <p className="pr-4! text-right">Nom de Campagne</p>
                    </div>
                    { selledProducts.map((product: SelledProductsByUpsellProps, index: number) => (
                      <div className="product-item grid grid-cols-[1fr_minmax(90px,95px)_minmax(50px,52px)_minmax(40px,46px)_minmax(100px,233px)] gap-4 odd:bg-neutral-300/20 py-4!" key={index}>
                        <p className="pl-4!">
                          { product.productTitle }
                          { product.variantTitle !== 'Default Title' && <small>{ product.variantTitle }</small> }
                        </p>
                        <p className="text-center">{ product.sku }</p>
                        <p className="text-center">{ product.quantity }</p>
                        <p className="text-center">{ product.orderNumber }</p>
                        <p className="pr-4! text-right">{ getCampaignName(product.campaignId) }</p>
                      </div>
                    )) }
                  </>
                
              }
            </div>
          </main>
        </div>
  )
}