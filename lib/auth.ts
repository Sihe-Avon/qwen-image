import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getOrCreateUser, getUserByEmail } from "./db-simple";

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
        timeout: 15000,
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
      
      if (account?.provider === "google") {
        try {
          const email = user.email || profile?.email;
          if (!email) {
            console.error("No email found in user or profile");
            return true;
          }
          
          await getOrCreateUser(
            email,
            user.name || profile?.name || "",
            user.image || (profile as any)?.picture || undefined
          );
          console.log("User created/updated successfully:", email);
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return true;
        }
      }
      
      console.log("Non-Google provider, allowing sign in:", account?.provider);
      return true;
    },
    
    async session({ session }) {
      if (session.user?.email) {
        try {
          const dbUser = await getUserByEmail(session.user.email);
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
    error: "/auth/error",
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  
  debug: process.env.NODE_ENV === 'development',
};
