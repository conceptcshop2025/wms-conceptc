"use client";

import { useState } from "react";
import Menu from "../components/Menu/Menu";
import { Bars3Icon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function UpsellStatsPage() {
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  // const clickTime = new Date().toISOString();
  const clickTime = '2026-06-08T12:33:39.548Z';
  const lastSyncDate = '2026-06-08T12:00:39.548Z';

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
    
    } catch(error) {
      console.error("error:", error);
    }
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
            <p>Obtenir la liste des produits plus vendus du mois</p>
            <button className="action-btn action-btn-confirm" onClick={getUpsellStats}>
              <ArrowDownTrayIcon className="size-6 text-neutral-50" />
              Obtenir la liste des bins
            </button>
          </main>
        </div>
  )
}