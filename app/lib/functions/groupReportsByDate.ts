import type { warehouseReportByNeonProps, WarehouseReportWithLocalTime, WarehouseReportGroup } from "@/app/types/types";

const REPORT_TZ = "America/Toronto";

function parseNeonTimestamp(value: string): Date {
  const normalized = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp from Neon: ${value}`);
  }
  return date;
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  const value = parts.find((part) => part.type === type)?.value;
  if (value === undefined) throw new Error(`Missing date part: ${type}`);
  return value;
}

function toLocalParts(value: string, timeZone: string) {
  const date = parseNeonTimestamp(value);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).formatToParts(date);

  const localDate = `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`;
  const localTime = `${getPart(parts, "hour")}:${getPart(parts, "minute")}`;

  return {
    localDate,
    localTime,
    localDateTime: `${localDate} ${localTime}`,
    timeZone,
    timeZoneLabel: getPart(parts, "timeZoneName"),
  };
}

export function groupReportsByDate(
  reports: warehouseReportByNeonProps[],
  timeZone: string = REPORT_TZ
): WarehouseReportGroup[] {
  const buckets = new Map<string, WarehouseReportWithLocalTime[]>();

  for (const report of reports) {
    const local = toLocalParts(report.created_at, timeZone);
    const enriched: WarehouseReportWithLocalTime = { ...report, ...local };

    const bucket = buckets.get(local.localDate);
    if (bucket) {
      bucket.push(enriched);
    } else {
      buckets.set(local.localDate, [enriched]);
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      report_name: `Report ${date}`,
      reports: items.sort((x, y) =>
        x.warehouse_name.localeCompare(y.warehouse_name)
      ),
    }));
}