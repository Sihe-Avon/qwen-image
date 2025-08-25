import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // TODO: Implement pricing with new database adapter
    // For now, return default pricing
    const pricingTest = { 
      id: "default", 
      name: "default", 
      price: 9.99, 
      credits: 100, 
      isActive: true 
    };
    
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
