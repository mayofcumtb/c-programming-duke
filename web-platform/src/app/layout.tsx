import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "机器人学院C语言程序课程工程化实践平台",
  description: "Robotics Academy C Programming Course Engineering Practice Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-slate-50 text-slate-900">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
