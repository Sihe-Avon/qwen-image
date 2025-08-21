"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider 
      refetchInterval={5 * 60} // 每5分钟刷新一次会话
      refetchOnWindowFocus={true} // 窗口焦点时刷新
    >
      {children}
    </NextAuthSessionProvider>
  );
}
