import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { WarehouseReportRow } from "@/app/types/types";

const sql = neon(process.env.DATABASE_URL || "");
const TZ = "America/Toronto";
const isYMD = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const initialDate = searchParams.get("initialDate");
  const finalDate = searchParams.get("finalDate");

  if (!isYMD(initialDate) || !isYMD(finalDate)) {
    return NextResponse.json(
      { error: "initialDate y finalDate son requeridos en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  if (initialDate > finalDate) {
    return NextResponse.json(
      { error: "initialDate no puede ser posterior a finalDate" },
      { status: 400 }
    );
  }

  try {
    const result = (await sql`
      SELECT * FROM warehouse_reports
      WHERE created_at >= (${initialDate}::date)::timestamp AT TIME ZONE ${TZ}
        AND created_at <  (${finalDate}::date + 1)::timestamp AT TIME ZONE ${TZ}
      ORDER BY created_at DESC;
    `) as WarehouseReportRow[];

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    console.error("GET /api/reports/warehouses", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}