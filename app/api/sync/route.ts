import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM history_sales ORDER BY last_date DESC LIMIT 1;
    `;

    return NextResponse.json(
      {
        data: result[0] ?? null
      },
      { status: 200 }
    );
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { last_date } = await req.json();
    const result = await sql`
      INSERT INTO history_sales (last_date)
      VALUES (${last_date})
      RETURNING id, last_date;
    `;

    return NextResponse.json(
      {
        message: "Sync history saved successfully",
        data: result[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
