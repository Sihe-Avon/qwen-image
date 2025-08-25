import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // TODO: Implement stats with new database adapter
    // For now, return mock data to prevent build errors
    
    const todayUsage = { 
      date: new Date().toISOString().split('T')[0],
      totalFreeCreditsUsed: 0, 
      totalFreeCreditsValue: 0, 
      uniqueUsers: [] 
    };
    
    // Mock data for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      last7Days.push({
        date: dateStr,
        freeCreditsUsed: 0,
        freeCreditsValue: 0,
        uniqueUsers: 0
      });
    }
    
    return NextResponse.json({
      today: {
        date: todayUsage.date,
        freeCreditsUsed: todayUsage.totalFreeCreditsUsed,
        freeCreditsValue: todayUsage.totalFreeCreditsValue,
        uniqueUsers: todayUsage.uniqueUsers.length,
        remainingFreeValue: 20
      },
      last7Days,
      users: {
        total: 0,
        withCredits: 0,
        completedProfiles: 0
      },
      generations: {
        total: 0,
        successful: 0,
        successRate: "0"
      }
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to get stats";
    console.error("/api/admin/stats error:", msg);
    return new NextResponse(msg, { status: 500 });
  }
}
