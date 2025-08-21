import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { productId } = await req.json();
    
    if (!productId || !STRIPE_CONFIG.products[productId as keyof typeof STRIPE_CONFIG.products]) {
      return new NextResponse("Invalid product", { status: 400 });
    }

    const product = STRIPE_CONFIG.products[productId as keyof typeof STRIPE_CONFIG.products];
    
    // 创建 Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email,
        productId,
        credits: product.credits.toString(),
        validityDays: product.validityDays.toString(),
      },
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      customer_email: session.user.email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return new NextResponse(error.message || 'Payment initialization failed', { status: 500 });
  }
}
