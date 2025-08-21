"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // 简单延迟，让 webhook 有时间处理
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center page-bg">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8">
          {isVerifying ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h1>
              <p className="text-gray-600 mb-6">
                We're confirming your payment and adding credits to your account.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. Your credits have been added to your account.
              </p>
              <div className="space-y-3">
                <a
                  href="/"
                  className="ui-button w-full inline-block"
                >
                  Start Generating Images
                </a>
                <a
                  href="/my-creations"
                  className="block text-sm text-gray-500 hover:text-gray-700"
                >
                  View My Creations
                </a>
              </div>
            </>
          )}
          
          {sessionId && (
            <div className="mt-6 text-xs text-gray-400 border-t border-gray-200 pt-4">
              Session ID: {sessionId.slice(-8)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
