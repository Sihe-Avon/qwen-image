import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db-simple";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

export async function GET() {
  try {
    let userEmail: string | null = null;
    
    // 尝试 NextAuth 会话
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      userEmail = session.user.email;
    } else {
      // 尝试开发者会话
      const cookieStore = await cookies();
      const devToken = cookieStore.get('dev-session-token')?.value;
      
      if (devToken) {
        try {
          const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');
          const { payload } = await jwtVerify(devToken, secret);
          userEmail = payload.email as string;
        } catch (error) {
          console.error('Invalid dev session token:', error);
        }
      }
    }
    
    if (!userEmail) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await getUserByEmail(userEmail);
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({ 
      credits: user.creditsBalance,
      profileCompleted: user.profileCompleted,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      }
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to load user";
    console.error("/api/me error:", msg);
    return new NextResponse(msg, { status: 500 });
  }
}




