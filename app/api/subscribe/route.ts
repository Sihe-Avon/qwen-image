import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, getOrCreateUser } from "@/lib/db";

const schema = z.object({ plan: z.enum(["creator", "team"]) });

const MONTHLY_CREDITS = {
  creator: 500,
  team: 2000,
} as const;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const plan = form?.get("plan");
  const parse = schema.safeParse({ plan });
  if (!parse.success) return new NextResponse("Bad request", { status: 400 });

  const db = await getDb();
  const user = await getOrCreateUser(db);

  // MVP: 直接加额模拟订阅成功（真实项目应集成 Stripe Checkout + Webhook）
  const add = MONTHLY_CREDITS[parse.data.plan];
  user.creditsBalance += add;
  await db.write();
  return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}






