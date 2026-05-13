import { MortgageRate } from "@/types/housing";

const FEATURED = [
  "30_Year_Fixed_Conforming",
  "20_Year_Fixed_Conforming",
  "15_Year_Fixed_Conforming",
  "30_Year_Jumbo_(Non_Conforming)",
  "10_6_ARM_Conforming",
];

export async function fetchMortgageRates(): Promise<MortgageRate[]> {
  try {
    const res = await fetch("https://zllw-working-api.p.rapidapi.com/current_mortgage_rates", {
      headers: {
        "x-rapidapi-key":  process.env.RAPIDAPI_KEY ?? "",
        "x-rapidapi-host": "zllw-working-api.p.rapidapi.com",
        "Content-Type":    "application/json",
      },
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return FEATURED.filter((k) => data[k]).map((k) => ({
      product: k.replace(/_/g, " ").replace(/\(Non Conforming\)/, "(Non-Conforming)"),
      rate:    parseFloat(data[k].rate),
      apr:     parseFloat(data[k].apr),
      type:    data[k].productType,
    }));
  } catch {
    return [];
  }
}
