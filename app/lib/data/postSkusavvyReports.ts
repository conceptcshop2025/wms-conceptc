import { toast } from "sonner";
import type { SkusavvyFullReportProps } from "../../types/types";

export const PostSkusavvyReports = async (report: SkusavvyFullReportProps) => {
  try {
    const response = await fetch("/api/warehouse/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report.warehouses),
    });

    if (!response.ok) {
      toast.error(`N'est pas possible d'ontenir l'information en ce moment, essayez plus tard. Error: ${response.statusText}`, {
        position: 'top-center',
        richColors: true
      })
      return;
    }

    const result = await response.json();
    toast.success(`Rapport de Skusavvy envoyé avec succès en date: ${result.created_at}`, {
      position: 'top-center',
      richColors: true
    });

  } catch (error) {
    console.error("Error posting Skusavvy reports:", error);
  }
}