import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { AppLayout } from "@/components/layout/AppLayout"; // Import AppLayout
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticketopia - Service Ticketing",
  description: "Efficiently manage and create service tickets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster />{" "}
          {/* Add Toaster here, outside AppLayout for global scope */}
        </AuthProvider>
      </body>
    </html>
  );
}
