import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookLease | Campus Textbook & Notes Sharing",
  description: "A peer-to-peer textbook rental and notes sharing platform for students. Find the exact study materials you need from peers on campus.",
  openGraph: {
    title: "BookLease",
    description: "Discover, rent, and return textbooks. Share study notes with your campus.",
    url: "https://booklease.app",
    siteName: "BookLease",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookLease",
    description: "Peer-to-peer textbook and notes sharing platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${merriweather.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-[#fffdf6] text-black font-sans selection:bg-[#ffb0b0] selection:text-black">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col">{children}</main>
          </div>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: "border-4 border-black font-bold font-sans shadow-neo rounded-none text-black",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
