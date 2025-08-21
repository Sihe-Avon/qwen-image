import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, completeUserProfile } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const db = await getDb();
    const user = db.data.users.find(u => u.email === session.user.email);
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.profileCompleted) {
      return NextResponse.json({ 
        message: "Profile already completed",
        creditsBalance: user.creditsBalance 
      });
    }

    const updatedUser = await completeUserProfile(db, user.id);
    
    return NextResponse.json({ 
      message: "Profile completed! You earned 2 extra credits.",
      creditsBalance: updatedUser?.creditsBalance || user.creditsBalance,
      profileCompleted: true
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to complete profile";
    console.error("/api/complete-profile error:", msg);
    return new NextResponse(msg, { status: 500 });
  }
}
