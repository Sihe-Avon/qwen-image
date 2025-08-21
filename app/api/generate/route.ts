import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, recordGeneration, canUseFreeCreditToday, recordFreeUsage } from "@/lib/db";
import { callFalGenerate } from "@/lib/fal";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const schema = z.object({
  prompt: z.string().min(1),
  aspectRatio: z.enum(["1:1", "16:9", "3:2", "2:3", "4:3", "9:16"]),
  numOutputs: z.number().int().min(1).max(4),
});

const ASPECT_TO_SIZE: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1536, height: 864 },
  "3:2": { width: 1500, height: 1000 },
  "2:3": { width: 1024, height: 1536 },
  "4:3": { width: 1408, height: 1056 },
  "9:16": { width: 864, height: 1536 },
};

const MAX_LONG_EDGE = 1536;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // 验证用户登录
  let userEmail: string | null = null;
  
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
    return new NextResponse("Please sign in to generate images", { status: 401 });
  }

  const { prompt, aspectRatio, numOutputs } = parse.data;
  const { width, height } = ASPECT_TO_SIZE[aspectRatio];
  const longEdge = Math.max(width, height);
  if (longEdge > MAX_LONG_EDGE) {
    return new NextResponse("Resolution too large", { status: 400 });
  }

  const mp = Math.ceil((width * height) / 1_000_000);
  const costCredits = mp * numOutputs;

  const db = await getDb();
  const user = db.data.users.find(u => u.email === userEmail);
  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // 检查用户余额
  if (user.creditsBalance < costCredits) {
    // 检查今日免费额度
    const canUseFree = await canUseFreeCreditToday(db, user.id, costCredits);
    if (!canUseFree) {
      return NextResponse.json({
        error: "Insufficient credits and daily free limit reached",
        needCredits: costCredits,
        dailyLimitReached: true
      }, { status: 402 });
    }
  }

  // 预扣 credits（如果用户有余额）或记录免费使用
  const usingFreeCredits = user.creditsBalance < costCredits;
  if (!usingFreeCredits) {
    user.creditsBalance -= costCredits;
  }
  await db.write();

  try {
    const images = await callFalGenerate({ prompt, width, height, numOutputs });
    
    // 记录生成历史
    await recordGeneration(db, user.id, {
      prompt,
      width,
      height,
      numOutputs,
      costCredits,
      images,
      status: "succeeded",
    });

    // 如果使用了免费额度，记录到每日统计
    if (usingFreeCredits) {
      await recordFreeUsage(db, user.id, costCredits);
    }

    return NextResponse.json({ 
      images, 
      costCredits,
      usingFreeCredits,
      remainingCredits: user.creditsBalance
    });
  } catch (e: any) {
    // 退款（如果预扣了用户余额）
    if (!usingFreeCredits) {
      user.creditsBalance += costCredits;
      await db.write();
    }
    
    console.error("FAL generate error:", e);
    const msg = e?.message || "Generation failed";
    return new NextResponse(`Generation failed: ${msg}`, { status: 500 });
  }
}




