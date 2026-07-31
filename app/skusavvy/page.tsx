"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Menu from "../components/Menu/Menu";
import { getAllProductsFromSkusavvy } from "../lib/data/skusavvyFunctions";
import { type skusavvyDataByWarehousesProps } from "../types/types";

export default function SkusavvyPage() {
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [warehouses, setWarehouses] = useState<skusavvyDataByWarehousesProps[]>([]);

  const toggleMenu = () => {
    setOpenMenu(prev => !prev);
  }

  const getAllProducts = async () => {
    const allProductsByWarehouse = await getAllProductsFromSkusavvy();
    if (!allProductsByWarehouse) return;

    setWarehouses(allProductsByWarehouse);
    console.log('all products: ', allProductsByWarehouse);
  }

  const formatPrice = (unformattedPrice:number) => {
    const price = unformattedPrice / 1000;
    const CADprice = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(price);

    return CADprice;
  }

  return (
    <>
      <Menu isOpen={openMenu} onCloseMenu={toggleMenu} />
      <div className="skusavvy-page p-8!">
        <Button onClick={getAllProducts}>Get products from Skusavvy</Button>
        <div className="warehouses-container flex flex-col gap-4 justify-center items-center">
          {
            warehouses.map((warehouse) => (
              <div className="warehouse-card bg-green-400/15 p-4! rounded-lg w-full" key={warehouse.id}>
                <p className="text-3xl">{warehouse.name}</p>
                <div className="flex justify-around items-center gap-4">
                  <div className="info-item rounded-lg shadow-xl bg-neutral-100 p-4! w-full">
                    <p>Total items</p>
                    <p className="text-center text-3xl">{ warehouse.totalProducts }</p>
                  </div>
                  <div className="info-item rounded-lg shadow-xl bg-neutral-100 p-4! w-full">
                    <p>Total retail</p>
                    <p className="text-center text-3xl">
                      { formatPrice(warehouse.totalPrice) }
                    </p>
                  </div>
                  <div className="info-item rounded-lg shadow-xl bg-neutral-100 p-4! w-full">
                    <p>Total cost</p>
                    <p className="text-center text-3xl">{ formatPrice(warehouse.totalCosts) }</p>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </>
  )
}