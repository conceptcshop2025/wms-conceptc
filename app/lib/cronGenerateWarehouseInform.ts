import { type SkusavvyFullReportProps } from "../types/types";
import { formatPrice } from "./functions/formatPrice";
import { fetchWarehouses } from "./skusavvy/warehouses";
import { fetchInfoWarehouses } from "./skusavvy/infoWarehouses";
import { fetchWeightedAvgCosts } from "./skusavvy/weightedAvgCosts";
import { fetchWarehouseReport } from "./skusavvy/fetchWarehouseReport";

export async function cronGenerateWarehouseInform() {
  const report:SkusavvyFullReportProps = {
    warehouses: [],
  }

  const getAllWarehouses = await fetchWarehouses();

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

      const getStatsFromWarehouse = await fetchInfoWarehouses(warehouse.id);
      if (getStatsFromWarehouse) {
        const warehouseFinded = report.warehouses.find((w) => w.id === warehouse.id);
        if (warehouseFinded) {
          warehouseFinded.totalProducts = getStatsFromWarehouse.totalQuantity.toString();
          warehouseFinded.totalPrice = formatPrice(getStatsFromWarehouse.totalPrice);
          warehouseFinded.totalCommitted = formatPrice(getStatsFromWarehouse.totalCommitted);
        }
      }

      const getWeightedAvgCostsFromWarehouse = await fetchWeightedAvgCosts(warehouse.id);
      if (getWeightedAvgCostsFromWarehouse) {
        const warehouseFinded = report.warehouses.find((w) => w.id === warehouse.id);
        if (warehouseFinded) {
          warehouseFinded.totalCosts = formatPrice(getWeightedAvgCostsFromWarehouse.totalWeightedAvgCosts);
        }
      }
    }
  }

  await fetchWarehouseReport(report);
}