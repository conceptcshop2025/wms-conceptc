import type { WarehouseReportGroup, warehouseReportByNeonProps } from "../../types/types";

type Column<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

type CsvOptions = {
  delimiter?: string;
  bom?: boolean;
};

type WarehouseRow = warehouseReportByNeonProps;

const COLUMNS: Array<Column<WarehouseRow>> = [
  { header: "ID", value: (w) => w.id },
  { header: "Warehouse", value: (w) => w.warehouse_name },
  { header: "Total products", value: (w) => w.total_products },
  { header: "Total price", value: (w) => w.total_price },
  { header: "Total costs", value: (w) => w.total_costs },
  { header: "Total committed", value: (w) => w.total_committed },
];

const escapeCell = (raw: unknown, delimiter: string): string => {
  if (raw === null || raw === undefined) return "";

  let value = String(raw);

  
  if (/^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }

  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r");

  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
};

export const fullReportToCsv = (
  report: WarehouseReportGroup,
  options: CsvOptions = {}
): string => {
  const { delimiter = ",", bom = true } = options;

  const header = COLUMNS.map((c) => escapeCell(c.header, delimiter)).join(delimiter);

  const rows = (report?.reports ?? []).map((warehouse) =>
    COLUMNS.map((c) => escapeCell(c.value(warehouse), delimiter)).join(delimiter)
  );

  
  const csv = [header, ...rows].join("\r\n");

  return bom ? `\uFEFF${csv}` : csv;
};

export const downloadHistoricFullReportCsv = (
  report: WarehouseReportGroup,
  filename = `felipapp-all-warehouses-${ report.report_name }.csv`,
  options?: CsvOptions
) => {
  const csv = fullReportToCsv(report, options);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};