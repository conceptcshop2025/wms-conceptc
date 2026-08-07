"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllProductsFromSkusavvy } from "../lib/data/skusavvyFunctions";
import { type skusavvyDataByWarehousesProps } from "../types/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

const FADE_MS = 200;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SkusavvyPage() {
  const [warehouses, setWarehouses] = useState<skusavvyDataByWarehousesProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSkeletons, setShowSkeletons] = useState<boolean>(false);
  const [contentVisible, setContentVisible] = useState<boolean>(true);

  const getAllProducts = async () => {
    setLoading(true);

    if (warehouses.length > 0) {
      setContentVisible(false);
      await wait(FADE_MS);
    }

    setShowSkeletons(true);
    setContentVisible(true);

    try {
      const allProductsByWarehouse = await getAllProductsFromSkusavvy();

      setContentVisible(false);
      await wait(FADE_MS);

      if (allProductsByWarehouse) setWarehouses(allProductsByWarehouse);
    } finally {
      setShowSkeletons(false);
      setContentVisible(true);
      setLoading(false);
    }
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
    <main>
      <div className="skusavvy-page p-8! scheme-concept-c">
        <div className="flex justify-start items-start">
          <Button
            onClick={getAllProducts}
            className="">
              {
                loading ?
                  <>
                    <Spinner className="size-6"/>
                    <span>Chargement...</span>
                  </>
                  :
                  <>
                    <span className="h-[21px] flex items-center">Obtenir rapport de Skusavvy</span>
                  </>
              }
          </Button>
        </div>
        <div
          className={`warehouses-container flex flex-col gap-4 justify-center items-center py-4! transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
            contentVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2 motion-reduce:translate-y-0'
          }`}>
          {
            showSkeletons ?
              <div className="skeleton-loaders flex flex-col gap-4 w-full">
                { 
                  [1,2,3].map((item) => (
                    <Card className="w-full" key={item}>
                      <CardHeader>
                        <Skeleton className="h-8 w-75" />
                      </CardHeader>
                      <CardContent className="flex justify-around items-center gap-4">
                        <Skeleton className="aspect-video w-full h-24" />
                        <Skeleton className="aspect-video w-full h-24" />
                        <Skeleton className="aspect-video w-full h-24" />
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            :
              <>
                {
                  warehouses.map((warehouse) => (
                    <Card className="warehouse-card w-full" key={warehouse.id}>
                      <CardHeader>
                        <p className="text-2xl">{warehouse.name}</p>
                      </CardHeader>
                      <CardContent className="flex justify-around items-center gap-4">
                        <div className="info-item rounded-lg shadow-md  p-4! w-full">
                          <p>Total items</p>
                          <p className="text-center text-3xl">{ warehouse.totalProducts }</p>
                        </div>
                        <div className="info-item rounded-lg shadow-md  p-4! w-full">
                          <p>Total retail</p>
                          <p className="text-center text-3xl">
                            { formatPrice(warehouse.totalPrice) }
                          </p>
                        </div>
                        <div className="info-item rounded-lg shadow-md  p-4! w-full">
                          <p>Total cost</p>
                          <p className="text-center text-3xl">{ formatPrice(warehouse.totalCosts) }</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </>
          }
        </div>
      </div>
    </main>
  )
}