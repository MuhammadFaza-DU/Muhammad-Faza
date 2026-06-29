import type { Metadata } from "next";
import { Black_Ops_One, Chelsea_Market, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import ParallaxBackground from "@/components/ParallaxBackground";
import GradualBlur from "@/components/GradualBlur";
import TargetCursor from "@/components/TargetCursor";
import Intro from "./intro";

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

export const metadata: Metadata = {
  title: "Muhammad Faza | Portofolio",
  description:
    "Personal portfolio Muhammad Faza — Computer Engineer, AI Engineer, Embedded Intelligence Builder, Web Developer.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
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
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col grain"
        suppressHydrationWarning={true}
      >
        <ParallaxBackground />

        {/* Gradual blur di tepi bawah viewport */}
        <GradualBlur
          position="bottom"
          height="4rem"
          strength={1}
          divCount={5}
          curve="ease-in"
          target="page"
          zIndex={3}
        />

        <a
          href="#content"
          className="sr-only focus:not-sr-only focus-ring fixed left-4 top-4 z-50 rounded-full bg-black/70 px-4 py-2 text-sm"
        >
          Skip to content
        </a>

        <Intro />
        <Navbar />

        <main id="content" className="relative z-10 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>

        <Footer />

        {/* Custom target cursor — hides default cursor */}
        <TargetCursor
          cursorColor="#34d399"
          cursorColorOnTarget="#ffffff"
          spinDuration={3}
          parallaxOn={true}
        />
      </body>
    </html>
  );
}
