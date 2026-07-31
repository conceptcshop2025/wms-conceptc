import { toast } from "sonner";
import { type skusavvyProductQueryProps, type skusavvyDataByWarehousesProps } from "@/app/types/types";

async function formatData(data:skusavvyProductQueryProps[]) {
  const dataByWarehouses:skusavvyDataByWarehousesProps[] = [];

  data.forEach((item:skusavvyProductQueryProps) => {
    if (item.variants.length > 0) {
      item.variants.forEach((variant) => {
        variant.inventory.forEach((inventory) => {

          //console.log("cost: ", variant.unitCosts.length);

          const warehouseId = inventory.warehouse.id;
          const findWarehouse = dataByWarehouses.find(key => key.id === warehouseId)
          if (!findWarehouse) {
            const newWarehouse = {
              id: inventory.warehouse.id,
              name: inventory.warehouse.name,
              totalProducts: Number(inventory.quantity),
              totalPrice: Number(inventory.quantity) * Number(variant.price),
              totalCosts: Number(inventory.quantity) * Number(variant.unitCosts.cost)
            }
            dataByWarehouses.push(newWarehouse);
          } else {
            findWarehouse.totalProducts += Number(inventory.quantity)
            findWarehouse.totalPrice += Number(inventory.quantity) * Number(variant.price)
            findWarehouse.totalCosts += Number(inventory.quantity) * Number(variant.unitCosts.cost)
          }
        })
      })
    }
  });

  return dataByWarehouses;
}

export async function getAllProductsFromSkusavvy() {
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
    const formattedData = await formatData(result.data.products)
    return formattedData;
  } catch (error) {
    toast.error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard. Error: ${error}`, {
      position: 'top-center',
      richColors: true
    })
    return;
  }
}