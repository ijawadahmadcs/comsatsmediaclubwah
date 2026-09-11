import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Comsats Media Club Wah",
  description: "Comsats Media Club Wah is a student-run organization dedicated to promoting media literacy, creativity, and collaboration among students. We provide a platform for students to explore various forms of media, including photography, videography, graphic design, and journalism. Our club aims to foster a community of passionate individuals who are eager to learn, share their skills, and contribute to the vibrant media landscape at Comsats University.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar/>
        {children}
        <Footer/>
        </body>
    </html>
  );
}
