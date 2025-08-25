import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUserByEmail, updateUserCredits } from "@/lib/db-simple";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

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
      // Note: We need email instead of userId for the new database adapter
      // For now, skip the credit update - this will need to be updated when implementing Stripe
      console.log(`TODO: Add ${metadata.credits} credits to user ${metadata.userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return new NextResponse(`Webhook error: ${error.message}`, { status: 400 });
  }
}
