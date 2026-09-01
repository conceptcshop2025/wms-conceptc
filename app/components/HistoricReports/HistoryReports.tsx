import { useCallback, useState } from "react";
import { getHistoricReports } from "@/app/lib/data/getHistoricReports";
import { groupReportsByDate } from "@/app/lib/functions/groupReportsByDate";
import type { WarehouseReportGroup } from "@/app/types/types";
import { downloadHistoricFullReportCsv } from "@/app/lib/data/exportHistoricReportToCsv";
import Loading from "../Loading/Loading";
import DatePicker from "../DatePicker/DatePicker";
import './HistoryReports.css';

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function HistoryReports() {
  const [reportsList, setReportsList] = useState<WarehouseReportGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [datePickerInitialDate, setDatePickerInitialDate] = useState<string>('');
  const [datePickerFinalDate, setDatePickerFinalDate] = useState<string>('');

  const handlePickerDate = useCallback((initialDate:string, finalDate:string) => {
    setDatePickerInitialDate(toYMD(new Date(initialDate)));
    setDatePickerFinalDate(toYMD(new Date(finalDate)));
  },[]);

  async function getReportsData() {
    setLoading(true);
    try {
      const reports = await getHistoricReports(datePickerInitialDate, datePickerFinalDate);
      setReportsList(groupReportsByDate(reports));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="historic-reports">
      <h1 className="text-3xl">Historique des rapports</h1>
      <div className="flex justify-start items-center gap-4 mt-4!">
        <DatePicker onPickerDate={handlePickerDate} />
        <button className="h-[43px]! rounded-lg" onClick={() => getReportsData()}>Chercher rappports</button>
      </div>
      {
        loading ? <Loading /> :
          <div className="reports-list mt-4!">
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