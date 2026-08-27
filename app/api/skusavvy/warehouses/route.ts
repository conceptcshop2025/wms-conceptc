import { NextResponse } from "next/server";
import { auth } from "@/auth";

const baseUrl = process.env.SKUSAVVY_BASE_URL || "";
const apiKey = process.env.SKUSAVVY_API_KEY || "";

const query = `
  query {
    warehouses {
      id
      name
    }
  }
`;

export async function POST() {
  const session = await auth();

  if (!session?.user?.canAccessSkusavvy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": apiKey,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    const json = await res.json();

    if (json.errors) {
      return NextResponse.json({ error: json.errors }, { status: 400 });
    }

    return NextResponse.json(json.data.warehouses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch warehouses", data: error }, { status: 500 });
  }
}