import { NextResponse } from "next/server";

// ISR: revalidate cached exchange rates every hour
export const revalidate = 3600;

const EXTERNAL_API =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";

export async function GET() {
  try {
    const res = await fetch(EXTERNAL_API, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);

    const data = await res.json();
    const usd = data?.usd as Record<string, number> | undefined;
    if (!usd) throw new Error("Unexpected API shape");

    return NextResponse.json({
      rates: {
        USD: 1,
        VND: usd["vnd"] ?? 25000,
      },
      date: data.date ?? null,
      source: "fawazahmed0",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 503 }
    );
  }
}
