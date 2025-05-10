import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenGen", // Branding
  description: "OpenGen - AI Chat Application", // Branding
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Class `h-full` penting agar child bisa menggunakan `h-screen` atau `h-full`
    <html lang="en" className="h-full">
      {/* `suppressHydrationWarning` bisa diperlukan jika class tema ditambahkan di client */}
      <body className={`${inter.className} h-full antialiased`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}