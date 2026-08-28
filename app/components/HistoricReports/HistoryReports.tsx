import { useEffect, useState } from "react";
import { getHistoricReports } from "@/app/lib/data/getHistoricReports";
import { groupReportsByDate } from "@/app/lib/functions/groupReportsByDate";
import type { WarehouseReportGroup } from "@/app/types/types";
import { downloadHistoricFullReportCsv } from "@/app/lib/data/exportHistoricReportToCsv";
import Loading from "../Loading/Loading";

export default function HistoryReports() {
  const [reportsList, setReportsList] = useState<WarehouseReportGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function getData() {
      try {
        const reports = await getHistoricReports();
        if (cancelled) return;
        setReportsList(groupReportsByDate(reports));
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    getData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="historic-reports">
      <h1 className="text-3xl">Historique des rapports</h1>
      {
        loading ? <Loading /> :
          <div className="reports-list">
            {
              reportsList.length > 0 &&
                reportsList.map((report:WarehouseReportGroup, index:number) => (
                  <div className="report flex justify-between items-center gap-4 odd:bg-[rgba(var(--color-base),.3)] pl-4" key={index}>
                    <div className="text-xl">{ report.report_name }</div>
                    <button className="h-[43px]!" onClick={() => downloadHistoricFullReportCsv(report)}>Exporter report en .CSV</button>
                  </div>
                ))
            }
          </div>
      }
    </div>
  )
}