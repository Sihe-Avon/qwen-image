"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 确保在客户端渲染，减少 hydration 问题
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="w-full sticky top-0 z-10 backdrop-blur bg-background/70 border-b border-black/5 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="font-semibold" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>
          Qwen Image
        </a>
        
        <nav className="flex items-center gap-4 text-sm">
          <a href="/" className="opacity-80 hover:opacity-100">Create Image</a>
          <a href="/pricing" className="opacity-80 hover:opacity-100">Pricing</a>
          <a href="/my-creations" className="opacity-80 hover:opacity-100">My Creations</a>
          
          {!isClient || status === "loading" ? (
            // 简单的加载状态：只显示一个按钮大小的占位符
            <div className="w-20 h-9 bg-gray-200 animate-pulse rounded"></div>
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-black/5"
              >
                <img
                  src={session.user?.image || "/default-avatar.png"}
                  alt={session.user?.name || "User"}
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
                <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  ⚡ {(session.user as any)?.creditsBalance || 0}
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-12 glass-card w-48 py-2 shadow-lg">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium">{session.user?.name}</div>
                    <div className="text-xs text-gray-500">{session.user?.email}</div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-sm">Credits: {(session.user as any)?.creditsBalance || 0}</div>
                    {!(session.user as any)?.profileCompleted && (
                      <div className="text-xs text-orange-600 mt-1">
                        Complete profile for +2 credits
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="ui-button"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
