import { NextResponse } from "next/server";
import { generateWarehouseInform } from "@/app/lib/generateWarehouseInform";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await generateWarehouseInform();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}