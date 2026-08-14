import { toast } from "sonner";
import { type skusavvyProductQueryProps, type skusavvyDataByWarehousesProps } from "@/app/types/types";

const getAverageCost = (weightedAvgCost:string, unitCosts:{cost:string}[], sku:string, totalQuantity:number) => {
  // console.log('weightAvgCost', weightedAvgCost);
  // console.log('unitCosts', unitCosts);

  if (weightedAvgCost === null) {
    if (unitCosts.length === 0) {
      return 0;
    } else if (unitCosts.length === 1) {
      return unitCosts[0]?.cost;
    } else {
      if (totalQuantity <= 0) {
        return 0;
      } else {
        console.log("---------------------------------------");
        console.log('Product SKU: ', sku)
        console.log('length of unitCosts: ', unitCosts.length)
        console.log('weightAvgCost', weightedAvgCost);
        console.log('unitCosts', unitCosts);
        console.log('totalQuantity: ', totalQuantity);
      }
    }
    return 0;
  }

  return weightedAvgCost;
}

export async function formatDataByWarehouse(data:skusavvyProductQueryProps[]) {
  const dataByWarehouses:skusavvyDataByWarehousesProps[] = [];
  
  data.forEach((item:skusavvyProductQueryProps) => {

    if(item.variants.find(key => key.sku === "210000014216")) {
      console.log(item);
    }

    if (item.variants.length > 0) {
      item.variants.forEach((variant) => {

        variant.inventory.forEach((inventory) => {
          
          const warehouseId = inventory.warehouse.id;
          const findWarehouse = dataByWarehouses.find(key => key.id === warehouseId)
          if (!findWarehouse) {
            const newWarehouse = {
              id: inventory.warehouse.id,
              name: inventory.warehouse.name,
              totalProducts: Number(inventory.quantity),
              totalPrice: Number(inventory.quantity) * Number(variant.price),
              totalCosts: Number(inventory.quantity) * Number(getAverageCost(variant.inventoryItem.weightedAvgCost, variant.unitCosts, variant.sku, variant.totalQuantity))
            }
            dataByWarehouses.push(newWarehouse);
          } else {
            findWarehouse.totalProducts += Number(inventory.quantity)
            findWarehouse.totalPrice += Number(inventory.quantity) * Number(variant.price)
            findWarehouse.totalCosts += Number(inventory.quantity) * Number(getAverageCost(variant.inventoryItem.weightedAvgCost, variant.unitCosts, variant.sku, variant.totalQuantity))
          }
        })
      })
    }
  });

  return dataByWarehouses;
}

export async function getAllProductVariantsFromSkusavvy() {
  try {
    const response = await fetch('/api/skusavvy/products', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      toast.error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard.`, {
        position: 'top-center',
        richColors: true
      })
      return;
    }

    const result = await response.json()

    return result.data.products;
  } catch (error) {
    toast.error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard. Error: ${error}`, {
      position: 'top-center',
      richColors: true
    })
    return;
  }
}

export async function allVariantList(variants:skusavvyProductQueryProps[]) {
  console.log(variants);
  return variants;
}