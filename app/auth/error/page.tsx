"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "Default":
        return "An error occurred during authentication.";
      default:
        return error || "An unknown error occurred.";
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center page-bg">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-card p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error)}
          </p>
          
          {error && (
            <div className="mb-6 p-3 bg-gray-50 rounded text-sm text-gray-700">
              <strong>Error Code:</strong> {error}
            </div>
          )}
          
          <div className="space-y-3">
            <a
              href="/"
              className="ui-button w-full inline-block"
            >
              Return to Home
            </a>
            <a
              href="/auth/signin"
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              Try Again
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center page-bg">
        <div className="max-w-md mx-auto text-center">
          <div className="glass-card p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
