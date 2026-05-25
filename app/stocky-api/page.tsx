"use client";

import { useState } from "react";
import Menu from "../components/Menu/Menu";
import { Bars3Icon } from "@heroicons/react/24/outline";
// import PurchaseOrders from "../components/Stocky/PurchaseOrders/PurchaseOrders";
import StockAdjustment from "../components/Stocky/StockAdjustment/StockAdjustment";



export default function StockyAPI() {
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  

  const toggleMenu = () => {
    setOpenMenu(prev => !prev);
  }

  return (
    <div className="stocky-api-page">
      <Menu isOpen={openMenu} onCloseMenu={toggleMenu} />
      <div className="topbar">
        <div className="topbar-left">
          <div className="logo-mark cursor-pointer" onClick={toggleMenu}>
            <Bars3Icon className="size-6" />
          </div>  
          <div>
            <div className="logo-text">CONCEPT C</div>
            <div className="logo-sub">STOCKY API</div>
          </div>
        </div> 
        <span className="version-badge">v1.0.0</span>
      </div>
      <main className="p-8!">
        {/* <PurchaseOrders /> */}
        <StockAdjustment />
      </main>
    </div>
  )
}