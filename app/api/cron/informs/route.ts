import { NextResponse } from "next/server";
import { cronGenerateWarehouseInform } from "@/app/lib/cronGenerateWarehouseInform";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await cronGenerateWarehouseInform();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}