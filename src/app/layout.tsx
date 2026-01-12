import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSC Explorer | Crypto Science Testnet",
  description: "Block explorer for Crypto Science Testnet - Powered by Polygon CDK with CSC native gas token",
  keywords: ["blockchain", "explorer", "crypto science", "CSC", "testnet", "polygon cdk"],
  openGraph: {
    title: "CSC Explorer | Crypto Science Testnet",
    description: "Explore blocks, transactions, and addresses on Crypto Science Testnet",
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
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
