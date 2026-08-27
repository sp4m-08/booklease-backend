import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
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
  title: "Booklease | VIT Vellore Peer Textbook Rental & CAT/FAT Notes Hub",
  description: "Exclusively for VIT Vellore University students. Rent course textbooks for CAT-1, CAT-2 & FAT exams, share handwritten module notes, and coordinate handovers across campus.",
  keywords: ["VIT Vellore", "Booklease", "VIT CAT exams", "VIT FAT exams", "Textbook rental VIT", "VIT notes sharing", "FFCS reference books", "SJT", "TT", "VIT Vellore library"],
  openGraph: {
    title: "Booklease | VIT Vellore Textbook Rental & Exam Notes",
    description: "Peer-to-peer textbook rentals and handwritten study notes for CAT-1, CAT-2 and FAT exams at VIT Vellore.",
    url: "https://booklease.app",
    siteName: "Booklease VIT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Booklease | VIT Vellore",
    description: "Rent reference books and share notes for CAT/FAT exams at VIT Vellore.",
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
            <Footer />
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
