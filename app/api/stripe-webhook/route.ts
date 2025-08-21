import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return new NextResponse("Missing signature or webhook secret", { status: 400 });
    }

    // 验证 webhook 签名
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Stripe webhook event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata;

      if (!metadata?.userId || !metadata?.credits) {
        console.error("Missing metadata in webhook:", metadata);
        return new NextResponse("Missing required metadata", { status: 400 });
      }

      // 更新用户 credits
      const db = await getDb();
      const user = db.data.users.find(u => u.id === metadata.userId);
      
      if (user) {
        user.creditsBalance += parseInt(metadata.credits);
        await db.write();
        
        console.log(`Added ${metadata.credits} credits to user ${metadata.userId}`);
      } else {
        console.error("User not found:", metadata.userId);
        return new NextResponse("User not found", { status: 404 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return new NextResponse(`Webhook error: ${error.message}`, { status: 400 });
  }
}
