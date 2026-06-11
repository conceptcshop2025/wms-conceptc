"use client";

import { useState } from "react";
import Menu from "../components/Menu/Menu";
import { Bars3Icon } from "@heroicons/react/24/outline";
import MapBin from "../components/MapBin/MapBin";
import InfoAppVersion from "../components/InfoAppVersion/InfoAppVersion";

export default function MapBinPage() {
  const [openMenu, setOpenMenu] = useState<boolean>(false);

  const toggleMenu = () => {
    setOpenMenu(prev => !prev);
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
        <InfoAppVersion />
      </div>
      <main>
        <MapBin />
      </main>
    </div>
  )
}