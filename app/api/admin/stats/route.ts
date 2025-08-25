import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // TODO: Implement stats with new database adapter
    const todayUsage = { totalFreeCreditsUsed: 0, totalFreeCreditsValue: 0, uniqueUsers: [] };
    
    // 获取最近7天的使用情况
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayUsage = db.data.dailyUsage.find(u => u.date === dateStr) || {
        date: dateStr,
        totalFreeCreditsUsed: 0,
        totalFreeCreditsValue: 0,
        uniqueUsers: []
      };
      
      last7Days.push({
        date: dateStr,
        freeCreditsUsed: dayUsage.totalFreeCreditsUsed,
        freeCreditsValue: dayUsage.totalFreeCreditsValue,
        uniqueUsers: dayUsage.uniqueUsers.length
      });
    }
    
    // 用户统计
    const totalUsers = db.data.users.length;
    const usersWithCredits = db.data.users.filter(u => u.creditsBalance > 0).length;
    const completedProfiles = db.data.users.filter(u => u.profileCompleted).length;
    
    // 生成统计
    const totalGenerations = db.data.generations.length;
    const successfulGenerations = db.data.generations.filter(g => g.status === "succeeded").length;
    
    return NextResponse.json({
      today: {
        date: todayUsage.date,
        freeCreditsUsed: todayUsage.totalFreeCreditsUsed,
        freeCreditsValue: todayUsage.totalFreeCreditsValue,
        uniqueUsers: todayUsage.uniqueUsers.length,
        remainingFreeValue: Math.max(0, 20 - todayUsage.totalFreeCreditsValue)
      },
      last7Days,
      users: {
        total: totalUsers,
        withCredits: usersWithCredits,
        completedProfiles
      },
      generations: {
        total: totalGenerations,
        successful: successfulGenerations,
        successRate: totalGenerations > 0 ? (successfulGenerations / totalGenerations * 100).toFixed(1) : "0"
      }
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to get stats";
    console.error("/api/admin/stats error:", msg);
    return new NextResponse(msg, { status: 500 });
  }
}
