import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const schema = z.object({ plan: z.enum(["creator", "team"]) });

const MONTHLY_CREDITS = {
  creator: 500,
  team: 2000,
} as const;

export async function POST(request: Request) {
  try {
    const form = await request.formData().catch(() => null);
    const plan = form?.get("plan");
    const parse = schema.safeParse({ plan });
    if (!parse.success) return new NextResponse("Bad request", { status: 400 });

    // 检查用户认证
    const session = await getServerSession(authOptions);
    let userId: string | null = null;

    if (session?.user?.email) {
      const db = await getDb();
      const user = db.data.users.find(u => u.email === session.user.email);
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

    const db = await getDb();
    const user = db.data.users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // MVP: 直接加额模拟订阅成功（真实项目应集成 Stripe Checkout + Webhook）
    const add = MONTHLY_CREDITS[parse.data.plan];
    user.creditsBalance += add;
    await db.write();
    
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  } catch (error) {
    console.error('Subscribe API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}






