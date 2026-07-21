import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "考研学习驾驶舱",
  description: "面向 2028 考研网络安全方向的目标、计划、任务、成绩和风险可视化仪表盘。",
  openGraph: {
    title: "考研学习驾驶舱",
    description: "目标、计划、任务、成绩和阶段风险统一可视化。",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "考研学习驾驶舱",
    description: "面向 2028 考研网络安全方向的学习驾驶舱。",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
