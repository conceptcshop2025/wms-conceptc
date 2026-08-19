"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllProductVariantsFromSkusavvy, formatDataByWarehouse, allVariantList } from "../lib/data/skusavvyFunctions";
import { type skusavvyDataByWarehousesProps, type skusavvyProductProps, type skusavvyVariantProps } from "../types/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";


const FADE_MS = 200;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SkusavvyPage() {
  const [warehouses, setWarehouses] = useState<skusavvyDataByWarehousesProps[]>([]);
  const [productVariantList, setProductVariantList] = useState<skusavvyProductProps[]>([]);
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
      const allProductVariants = await getAllProductVariantsFromSkusavvy();

      setContentVisible(false);
      await wait(FADE_MS);

      if (allProductVariants) {
        const warehouseData = await formatDataByWarehouse(allProductVariants);
        
        if (warehouseData) {
          setWarehouses(warehouseData)
        }

        const productVariantData = await allVariantList(allProductVariants);

        if (productVariantData) {
          setProductVariantList(productVariantData);
        }
      }

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
        <div className="flex items-start justify-start">
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
              <div className="flex flex-col w-full gap-4 skeleton-loaders">
                { 
                  [1,2,3].map((item) => (
                    <Card className="w-full" key={item}>
                      <CardHeader>
                        <Skeleton className="h-8 w-75" />
                      </CardHeader>
                      <CardContent className="flex items-center justify-around gap-4">
                        <Skeleton className="w-full h-24 aspect-video" />
                        <Skeleton className="w-full h-24 aspect-video" />
                        <Skeleton className="w-full h-24 aspect-video" />
                        <Skeleton className="w-full h-24 aspect-video" />
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            :
              <>
                {
                  warehouses.map((warehouse) => (
                    <Card className="w-full warehouse-card" key={warehouse.id}>
                      <CardHeader>
                        <p className="text-2xl">{warehouse.name}</p>
                      </CardHeader>
                      <CardContent className="flex items-center justify-around gap-4">
                        <div className="info-item rounded-lg shadow-md  p-4! w-full">
                          <p>Total items</p>
                          <p className="text-3xl text-center">{ warehouse.totalProducts }</p>
                        </div>
                        <div className="info-item rounded-lg shadow-md  p-4! w-full">
                          <p>Total retail</p>
                          <p className="text-3xl text-center">
                            { formatPrice(warehouse.totalPrice) }
                          </p>
                        </div>
                        <div className="info-item rounded-lg shadow-md  p-4! w-full">
                          <p>Total cost</p>
                          <p className="text-3xl text-center">{ formatPrice(warehouse.totalCosts) }</p>
                        </div>
                        <div className="info-item rounded-lg shadow-md  p-4! w-full">
                          <p>Total Commited</p>
                          <p className="text-3xl text-center">{ formatPrice(warehouse.totalCommitted) }</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </>
          }
        </div>
        {
          productVariantList.length > 0 &&
            <div className="products-table">
              <div className="grid grid-cols-[.1fr_.2fr_.1fr_.1fr_.1fr_.1fr_.3fr] gap-2 products-header">
                <div className="px-2 text-center">SKU</div>
                <div className="px-2 text-center">Nom de Produit</div>
                <div className="px-2 text-center">Status</div>
                <div className="px-2 text-center">Quantité Total</div>
                <div className="px-2 text-center">Prix de Produit</div>
                <div className="px-2 text-center">Average Cost</div>
                <div>
                  <div className="block text-center">Warehouse</div>
                  <div className="grid grid-cols-[1fr_.1fr] gap-2 px-2 bg-[rgba(var(--color-base),0.2)]">
                    <div>Warehouse Name</div>
                    <div>QTY</div>
                  </div>
                </div>
              </div>
              <div className="products-body h-[500px] overflow-y-scroll">
                {
                  productVariantList.slice(0,50).map((product:skusavvyProductProps) => (
                    <div key={ product.id } className="even:bg-[rgba(var(--color-base),0.1)] odd:bg-[rgba(var(--color-base),0.2)]">
                      {
                        product.variants.map((variant:skusavvyVariantProps) => (
                          <div key={variant.id} className="grid grid-cols-[.1fr_.2fr_.1fr_.1fr_.1fr_.1fr_.3fr] gap-2 py-2 products-body-row">
                            <div className="overflow-hidden text-center">{ variant.sku }</div>
                            <div className="text-left">{ product.name }</div>
                            <div className="text-center">{ product.status }</div>
                            <div className="text-center">{ variant.totalQuantity }</div>
                            <div className="text-center">{ formatPrice(Number(variant.price)) }</div>
                            <div className="text-center">
                              { 
                                variant.inventoryItem.weightedAvgCost !== null ?
                                <span>{formatPrice(Number(variant.inventoryItem.weightedAvgCost))}</span> :
                                variant.unitCosts.length === 1 ?
                                  <span>{formatPrice(Number(variant.unitCosts[0]?.cost))}</span> :
                                  <span className="text-[rgb(var(--color-accent-primary))]">
                                    <HoverCard openDelay={10}>
                                      <HoverCardTrigger className="flex items-center justify-center gap-2">0 <ExclamationTriangleIcon className="size-6"/></HoverCardTrigger>
                                      <HoverCardContent>Le SKU: { variant.sku } n&apos;a pas de Weighted Average Cost et contient <strong className="text-red-500">{ variant.unitCosts.length }</strong> cost assignées</HoverCardContent>
                                    </HoverCard>
                                  </span>
                              }
                            </div>
                            <div>
                              {
                                variant.inventory.map((inventory:{quantity:string, warehouse:{id:string, name:string}},index: number) => (
                                  <div key={index} className="grid grid-cols-[1fr_.1fr] gap-2 px-2 even:bg-[rgba(var(--color-base),0.3)] odd:bg-[rgba(var(--color-base),0.4)]">
                                    <div>{ inventory.warehouse.name }</div>
                                    <div className="text-right">{ inventory.quantity }</div>
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ))
                }
              </div>
            </div>
        }
      </div>
    </main>
  )
}