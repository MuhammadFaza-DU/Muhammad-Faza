import type { Metadata } from "next";
import { Black_Ops_One, Chelsea_Market, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Intro from "./intro";

// Inisialisasi Font Google
const blackOpsOne = Black_Ops_One({
  variable: "--font-blackops",
  weight: "400",
  subsets: ["latin"],
});

const chelseaMarket = Chelsea_Market({
  variable: "--font-chelsea",
  weight: "400",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// Metadata SEO Portofolio
export const metadata: Metadata = {
  title: "Muhammad Faza | Portfolio",
  description:
    "Personal portfolio Muhammad Faza — Computer Engineer, AI Engineer, Embedded Intelligence Builder, Web Developer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${blackOpsOne.variable} ${chelseaMarket.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning // Mengabaikan peringatan hidrasi pada level HTML (misal akibat tema/ekstensi)
    >
      <body 
        className="min-h-full flex flex-col bg-stage grain"
        suppressHydrationWarning={true} // 👈 Ditambahkan di sini untuk mematikan error akibat suntikan ekstensi browser pada body
      >
        {/* Aksesibilitas Screen Reader */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus-ring fixed left-4 top-4 z-50 rounded-full bg-black/70 px-4 py-2 text-sm"
        >
          Skip to content
        </a>

        {/* Komponen Utama Web */}
        <Intro />
        <Navbar />
        
        <main id="content" className="flex-1">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}