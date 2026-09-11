import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
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
  metadataBase: new URL("https://booklease.netlify.app"),
  title: "Booklease | VIT Vellore Peer Textbook Rental & CAT/FAT Notes Hub",
  description: "Exclusively for VIT Vellore University students. Rent course textbooks for CAT-2 & FAT exams, share handwritten module notes, and coordinate handovers across campus.",
  keywords: ["VIT Vellore", "Booklease", "VIT CAT exams", "VIT FAT exams", "Textbook rental VIT", "VIT notes sharing", "FFCS reference books", "SJT", "TT", "VIT Vellore library"],
  icons: {
    icon: [
      { url: "/icon.png", sizes: "any" },
      { url: "/favicon.png", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png" }
    ],
    shortcut: ["/icon.png"],
  },
  openGraph: {
    title: "Booklease | VIT Vellore Textbook Rental & Exam Notes",
    description: "Peer-to-peer textbook rentals and handwritten study notes for CAT-2 and FAT exams at VIT Vellore.",
    url: "https://booklease.app",
    siteName: "Booklease VIT",
    images: [{ url: "/icon.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Booklease | VIT Vellore",
    description: "Rent reference books and share notes for CAT/FAT exams at VIT Vellore.",
    images: ["/icon.png"],
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
          <div className="flex flex-col min-h-screen pb-16 md:pb-0">
            <Navbar />
            <main className="flex-grow flex flex-col">{children}</main>
            <Footer />
            <BottomNav />
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
