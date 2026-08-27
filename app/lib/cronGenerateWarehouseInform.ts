import { type SkusavvyFullReportProps } from "../types/types";
import { formatPrice } from "./functions/formatPrice";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

async function getWeightedAvgCosts(warehouseId: string | null) {
  try {
    const response = await fetch(`${baseUrl}/api/skusavvy/weighted-avg-costs`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({warehouseId})
    })

    if (!response.ok) {
      throw new Error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard.`);
    }

    const result = await response.json()

    return result.data;
  } catch (error) {
    throw error;
  }
}

async function getInfoWarehouse(warehouseId: string | null) {
  try {
    const response = await fetch(`${baseUrl}/api/skusavvy/products`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({warehouseId})
    })

    if (!response.ok) {
      throw new Error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard.`);
    }

    const result = await response.json()

    return result.data;
  } catch (error) {
    throw error;
  }
}

async function getWarehousesFromSkusavvy() {
  try {
    const response = await fetch(`${baseUrl}/api/skusavvy/warehouses`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
    })

    if (!response.ok) {
      throw new Error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard.`);
    }

    const result = await response.json()

    return result;
  } catch (error) {
    throw error;
  }
}

const PostSkusavvyReports = async (report: SkusavvyFullReportProps) => {
  try {
    const response = await fetch(`${baseUrl}/api/warehouse/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report.warehouses),
    });

    if (!response.ok) {
      throw new Error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard. Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    throw error;
  }
}

export async function cronGenerateWarehouseInform() {
  const report:SkusavvyFullReportProps = {
    warehouses: [],
  }

  const getAllWarehouses = await getWarehousesFromSkusavvy();

  if (getAllWarehouses) {
    for (const warehouse of getAllWarehouses) {
      const warehouseObject = {
        id: warehouse.id,
        name: warehouse.name,
        totalProducts: "0",
        totalPrice: "0",
        totalCosts: "0",
        totalCommitted: "0",
      };

      report.warehouses.push(warehouseObject);

      const getStatsFromWarehouse = await getInfoWarehouse(warehouse.id);
      if (getStatsFromWarehouse) {
        const warehouseFinded = report.warehouses.find((w) => w.id === warehouse.id);
        if (warehouseFinded) {
          warehouseFinded.totalProducts = getStatsFromWarehouse.totalQuantity;
          warehouseFinded.totalPrice = formatPrice(getStatsFromWarehouse.totalPrice);
          warehouseFinded.totalCommitted = formatPrice(getStatsFromWarehouse.totalCommitted);
        }
      }

      const getWeightedAvgCostsFromWarehouse = await getWeightedAvgCosts(warehouse.id);
      if (getWeightedAvgCostsFromWarehouse) {
        const warehouseFinded = report.warehouses.find((w) => w.id === warehouse.id);
        if (warehouseFinded) {
          warehouseFinded.totalCosts = formatPrice(getWeightedAvgCostsFromWarehouse.totalWeightedAvgCosts);
        }
      }
    }
  }

  await PostSkusavvyReports(report);
}