"use client";

import { useState } from "react";
import Menu from "../components/Menu/Menu";
import { Bars3Icon } from "@heroicons/react/24/outline";
import InfoAppVersion from "../components/InfoAppVersion/InfoAppVersion";
import { Button } from "@/components/ui/button";
import { type ProductExportProps } from "../types/types"; 

export default function ExportsPage() {

  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const toggleMenu = () => {
    setOpenMenu(prev => !prev);
  }

  const getData = async () => {
    try {
      const response = await fetch('/api/reports')

      if (!response.ok) {
        console.error('Error in endpoint use');
        return;
      }

      const data = await response.json();

      const rows: ProductExportProps[] = (data.data ?? []).map(
        (item: { sku: string; barcode: string; bin_location: string; bin_current_quantity: number }) => ({
          sku: item.sku,
          barcode: item.barcode,
          location: "Entrepôt Québec",
          bin_location: item.bin_location,
          bin_quantity: item.bin_current_quantity,
        })
      );

      exportToCsv(rows);
    } catch(error) {
      console.error(error);
    }
  }

  const escapeCsv = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const exportToCsv = (rows: ProductExportProps[]) => {
    if (rows.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }

    const headers = ["SKU", "Barcode", "Location", "Bin", "Quantité par bin"];
    const lines = [headers.join(",")];

    rows.forEach((row) => {
      lines.push(
        [row.sku, row.barcode, row.location, row.bin_location, row.bin_quantity]
          .map(escapeCsv)
          .join(",")
      );
    });

    // Prepend a BOM so Excel reads UTF-8 accents (Québec, Quantité) correctly.
    const blob = new Blob([`﻿${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `produits-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="map-bin-page">
      <Menu isOpen={openMenu} onCloseMenu={toggleMenu} />
      <div className="topbar">
        <div className="topbar-left">
          <div className="logo-mark cursor-pointer bg-green-800!" onClick={toggleMenu}>
            <Bars3Icon className="size-6" />
          </div>  
          <div>
            <div className="logo-text">CONCEPT C</div>
            <div className="logo-sub">WMS · Québec</div>
          </div>
        </div> 
        <InfoAppVersion />
      </div>
      <main className="p-8!">
        <div className="item-export p-8! rounded-lg shadow-2xl ">
          <h2 className="text-3xl">Exporter tous les produits</h2>
          <p className="my-1!">Les champs à exporter sont: SKU, Barcode, Location, Bin, Quantité par bin</p>
          <Button size="lg" className="py-1! px-2!" onClick={getData}>
            Exporter en .csv
          </Button>
        </div>
      </main>
    </div>
  )
}