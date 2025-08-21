"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  // 固定定价信息
  const pricingInfo = {
    price: 9.99,
    originalPrice: 12.99,
    credits: 100,
    discount: 38,
    validityDays: 30
  };

  const handlePurchase = async () => {
    if (!session) {
      signIn();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: 'credits_100' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // 重定向到 Stripe Checkout
      window.location.href = url;
    } catch (e: any) {
      console.error("Purchase failed:", e);
      alert("Payment initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-8 gap-8 page-bg">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>Credit Packages</h1>
        <p className="text-sm opacity-70 mb-8">Purchase credits to generate unlimited images. One-time payment with 30-day validity.</p>
        
        <div className="max-w-md mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="text-lg font-medium text-gray-600 mb-2">Credit Pack</div>
            
            {/* 价格显示 */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl text-gray-400 line-through">${pricingInfo.originalPrice}</span>
                <span className="text-4xl font-bold">${pricingInfo.price}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">
                  Save {pricingInfo.discount}%
                </span>
              </div>
            </div>
            
            <div className="text-xl text-gray-700 mb-2">{pricingInfo.credits} Credits</div>
            <div className="text-sm text-gray-500 mb-2">
              ${(pricingInfo.price / pricingInfo.credits).toFixed(3)} per credit
            </div>
            <div className="text-sm text-orange-600 font-medium mb-6">
              Valid for {pricingInfo.validityDays} days
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 mb-8">
              <div className="flex items-center justify-center gap-2">
                <span>✓</span>
                <span>Commercial use allowed</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>✓</span>
                <span>High resolution images</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>✓</span>
                <span>30-day validity period</span>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={loading}
              className="ui-button w-full"
            >
              {loading ? "Processing..." : session ? "Purchase Credits" : "Sign In to Purchase"}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs opacity-60">New users receive 3 free credits + 2 bonus credits after completing profile.</p>
        </div>
      </div>
    </div>
  );
}


