import type { Metadata } from "next";
import { Noto_Sans_Thai, Geist_Mono } from "next/font/google";
import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { Toaster } from "sonner";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["latin", "thai"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat with Data",
  description: "An AI chatbot that can chat with your data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansThai.variable} ${geistMono.variable} antialiased dark`}>
        <ChatProvider>{children}</ChatProvider>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
