"use client";

import { useState } from "react";
import Menu from "../components/Menu/Menu";
import { Bars3Icon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { type SelledProductsByUpsellProps, type UpsellCampaignProps } from "../types/types";
import UpsellSellCard from "../components/UpsellSellCard/UpsellSellCard";
import { fetchBulkUpsellOrders } from "../actions/upsell-orders"; 

export default function UpsellStatsPage() {
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [selledProducts, setSelledProducts] = useState<SelledProductsByUpsellProps[]>([]);
  // const clickTime = new Date().toISOString();
  // const lastSyncDate = '2026-06-01T00:00:00.000Z';
  // const lastSyncDate = '2026-06-10T00:00:00.000Z';
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
    const bulkOperationsOfUpsellOrders = await fetchBulkUpsellOrders();
    console.log(`Data from bulk operation:`, bulkOperationsOfUpsellOrders);
    setSelledProducts(bulkOperationsOfUpsellOrders);
  }

  const filteredDataByCampaign = (campaignId:string) => {
    const filterByCampaign = selledProducts.filter(p => p.campaignId.split('offer#')[1] === campaignId);
    const mergedBySku = filterByCampaign.reduce<Record<string, SelledProductsByUpsellProps>>(
      (acc, product) => {
        const existing = acc[product.sku];
        if (existing) {
          existing.quantity += product.quantity;
        } else {
          acc[product.sku] = { ...product };
        }
        return acc;
      },
      {}
    );
    
    return Object.values(mergedBySku).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
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
            <span className="version-badge">v5.1.0</span>
          </div>
          <main className="p-8!">
            <button className="action-btn action-btn-confirm" onClick={getUpsellStats}>
              <ArrowDownTrayIcon className="size-6 text-neutral-50" />
              Obtenir la liste des produits plus vendus du mois
            </button>
            <div className="campaigns-container grid grid-cols-2 gap-4 mt-4!">
              {
                activeCampaigns.length === 0
                ? <p>Pas de campagnes actives en ce moment.</p>
                : (
                  activeCampaigns.map((campaign:UpsellCampaignProps) => (
                    <UpsellSellCard campaignTitle={campaign.name} data={filteredDataByCampaign(campaign.id)} key={campaign.id} />
                  ))
                )
              }
            </div>
          </main>
        </div>
  )
}