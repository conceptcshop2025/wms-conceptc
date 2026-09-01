import type { warehouseReportByNeonProps } from "@/app/types/types";

export async function getHistoricReports(
  initialDate: string, // "YYYY-MM-DD"
  finalDate: string    // "YYYY-MM-DD"
): Promise<warehouseReportByNeonProps[]> {
  const params = new URLSearchParams({ initialDate, finalDate });
  const res = await fetch(`/api/reports/warehouses?${params}`);

  if (!res.ok) {
    throw new Error(`getHistoricReports HTTP ${res.status}`);
  }

  const json: { data: warehouseReportByNeonProps[] } = await res.json();
  return json.data ?? [];
}