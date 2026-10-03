import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const pixelFont = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BlockSmith — Backend Developer",
  description:
    "3D interactive portfolio of a backend developer. Crafted with Next.js, Three.js and way too much coffee. I build scalable APIs, databases and real-time systems — one block at a time.",
  keywords: [
    "backend developer",
    "portfolio",
    "minecraft",
    "three.js",
    "next.js",
    "API",
    "databases",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "BlockSmith — Backend Developer",
    description:
      "I craft scalable backends — APIs, databases and real-time systems — one block at a time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${pixelFont.variable} ${bodyFont.variable} antialiased bg-[#0e0c14] text-white overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
