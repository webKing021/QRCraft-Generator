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
  title: "QRCraft — Free Permanent QR Codes",
  description:
    "Generate free, permanent QR codes for Google Drive links and any URL. No sign-up, no expiration, no data stored. Download as PNG, SVG, or JPEG.",
  keywords: [
    "QRCraft",
    "QR code generator",
    "free QR code",
    "permanent QR code",
    "Google Drive QR code",
    "QR code maker",
  ],
  authors: [{ name: "Krutarth Raychura" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
