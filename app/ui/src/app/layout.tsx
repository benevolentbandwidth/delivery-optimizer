import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import ServiceWorkerRegistration from "@/app/components/ServiceWorkerRegistration";
import "./globals.css";
import FeedbackLauncher from "./components/FeedbackLauncher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

type RootLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: {
    default: "Delivery Route Optimizer",
    template: "%s | Delivery Route Optimizer",
  },
  description: "Convert addresses to coordinates with CSV support",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        {children}
        <FeedbackLauncher />
      </body>
    </html>
  );
}
