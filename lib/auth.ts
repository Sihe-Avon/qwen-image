import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDb, getOrCreateGoogleUser } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 15000, // 增加超时时间到 15 秒
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const db = await getDb();
          await getOrCreateGoogleUser(db, {
            email: user.email,
            name: user.name || "",
            image: user.image || undefined,
          });
          return true;
        } catch (error) {
          console.error("Error creating user:", error);
          return false;
        }
      }
      return false;
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
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  
  // 添加调试信息
  debug: process.env.NODE_ENV === 'development',
};
