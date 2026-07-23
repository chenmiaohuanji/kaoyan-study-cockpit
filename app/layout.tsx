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
  title: "研途驾驶舱 | Kaoyan Study Dashboard",
  description: "安静、专业、可靠的个人考研学习控制台，统一管理目标、计划、专注、进度、错题、成绩与周期复盘。",
  openGraph: {
    title: "研途驾驶舱 | Kaoyan Study Dashboard",
    description: "把目标、今日任务、专注学习、能力进度和周期反馈收敛成长期可用的学习闭环。",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "研途驾驶舱 | Kaoyan Study Dashboard",
    description: "安静、专业、可靠的个人考研学习控制台。",
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
