import { NextResponse } from "next/server";
import { MortgageRate } from "@/types/housing";

const FEATURED_PRODUCTS = [
  "30_Year_Fixed_Conforming",
  "20_Year_Fixed_Conforming",
  "15_Year_Fixed_Conforming",
  "30_Year_Jumbo_(Non_Conforming)",
  "10_6_ARM_Conforming",
];

export async function GET() {
  try {
    const res = await fetch("https://zllw-working-api.p.rapidapi.com/current_mortgage_rates", {
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "",
        "x-rapidapi-host": "zllw-working-api.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // refresh every hour
    });

    const data = await res.json();

    const rates: MortgageRate[] = FEATURED_PRODUCTS
      .filter((key) => data[key])
      .map((key) => ({
        product: key.replace(/_/g, " ").replace(/\(Non Conforming\)/, "(Non-Conforming)"),
        rate: parseFloat(data[key].rate),
        apr: parseFloat(data[key].apr),
        type: data[key].productType,
      }));

    return NextResponse.json(
      { rates, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" } }
    );
  } catch (error) {
    console.error("Mortgage rates error:", error);
    return NextResponse.json({ error: "Failed to fetch mortgage rates" }, { status: 500 });
  }
}
