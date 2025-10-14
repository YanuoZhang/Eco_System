import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

export const metadata: Metadata = {
  title: "LeafForward",
  description: "LeafForward - Track your climate impact and take action",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/assets/leafforward.jpg", type: "image/jpeg" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "LeafForward",
    description: "Track your climate impact and take action for a sustainable future",
    images: ["/assets/leafforward.jpg"],
    type: "website",
    siteName: "LeafForward",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeafForward",
    description: "Track your climate impact and take action for a sustainable future",
    images: ["/assets/leafforward.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/favicon.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png?v=2" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased overflow-x-hidden`}
      >
        <Nav />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
