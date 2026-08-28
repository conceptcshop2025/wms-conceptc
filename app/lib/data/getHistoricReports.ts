import type { warehouseReportByNeonProps } from "@/app/types/types";

export async function getHistoricReports(): Promise<warehouseReportByNeonProps[]> {
  const res = await fetch("/api/reports/warehouses");

  if (!res.ok) {
    throw new Error(`getHistoricReports HTTP ${res.status}`);
  }

  const json: { data: warehouseReportByNeonProps[] } = await res.json();

  return json.data ?? [];
}