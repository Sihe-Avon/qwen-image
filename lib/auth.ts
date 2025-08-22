import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDb, getOrCreateGoogleUser } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      httpOptions: {
        timeout: 15000, // 增加超时时间到 15 秒
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback - Full details:", { 
        user: user?.email, 
        provider: account?.provider,
        profile: profile?.email 
      });
      
      // 对于 Google 登录，我们总是允许登录
      if (account?.provider === "google") {
        try {
          // 确保有邮箱信息
          const email = user.email || profile?.email;
          if (!email) {
            console.error("No email found in user or profile");
            return true; // 仍然允许登录，稍后在 session 回调中处理
          }
          
          const db = await getDb();
          await getOrCreateGoogleUser(db, {
            email: email,
            name: user.name || profile?.name || "",
            image: user.image || profile?.picture || undefined,
          });
          console.log("User created/updated successfully:", email);
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          // 即使数据库操作失败，也允许登录
          return true;
        }
      }
      
      // 对于其他提供者，也允许登录
      console.log("Non-Google provider, allowing sign in:", account?.provider);
      return true;
    },
    
    async session({ session }) {
      if (session.user?.email) {
        try {
          const db = await getDb();
          const dbUser = db.data.users.find(u => u.email === session.user.email);
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.creditsBalance = dbUser.creditsBalance;
            session.user.profileCompleted = dbUser.profileCompleted;
          }
        } catch (error) {
          console.error("Error fetching user session:", error);
        }
      }
      return session;
    },
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error", // 添加错误页面
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  
  // 添加调试信息
  debug: process.env.NODE_ENV === 'development',
};
