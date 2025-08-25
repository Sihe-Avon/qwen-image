import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getUserGenerations } from "@/lib/db-simple";
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = "nodejs";

export async function GET() {
  try {
    // 检查 NextAuth session
    const session = await getServerSession(authOptions);
    let userId: string | null = null;

    if (session?.user?.email) {
      const user = await getUserByEmail(session.user.email);
      userId = user?.id || null;
    } else {
      // 检查开发者登录 session
      const cookieStore = await cookies();
      const devToken = cookieStore.get('dev-session-token');
      
      if (devToken) {
        try {
          const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');
          const { payload } = await jwtVerify(devToken.value, secret);
          userId = payload.sub || null;
        } catch (e) {
          // Token 无效
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gens = await getUserGenerations(userId);
    
    return NextResponse.json({ items: gens });
  } catch (error) {
    console.error('Generations API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
