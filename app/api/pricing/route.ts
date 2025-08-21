import { NextResponse } from "next/server";
import { getDb, getPricingTest } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testName = searchParams.get("test"); // ?test=test_a

    const db = await getDb();
    const pricingTest = await getPricingTest(db, testName || undefined);
    
    return NextResponse.json({
      testName: pricingTest.name,
      price: pricingTest.price,
      credits: pricingTest.credits,
      pricePerCredit: (pricingTest.price / pricingTest.credits).toFixed(3)
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to get pricing";
    console.error("/api/pricing error:", msg);
    return new NextResponse(msg, { status: 500 });
  }
}
