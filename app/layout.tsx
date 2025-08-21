import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./components/SessionProvider";
import { Navbar } from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qwen Image Generator (MVP)",
  description: "Create images from text with credits-based access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <SessionProvider>
          <div className="global-bg" />
          <Navbar />
          <main>{children}</main></SessionProvider>
        <footer className="w-full border-t border-black/5 dark:border-white/10 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-10 text-sm opacity-70 flex flex-col gap-2">
            <div>Qwen Image AI is an image generation model with strong text rendering.</div>
            <div className="flex gap-4">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/refund-policy">Refund Policy</a>
            </div>
            <div>© 2025 Qwen Image AI. All rights reserved.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
