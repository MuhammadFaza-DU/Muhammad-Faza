import type { Metadata } from "next";
import { Black_Ops_One, Chelsea_Market, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import ParallaxBackground from "@/components/ParallaxBackground";
import ConstellationBackground from "@/components/ConstellationBackground";
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
  metadataBase: new URL("https://muhammadfaza.vercel.app"),
  title: {
    default: "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer",
    template: "%s | Muhammad Faza",
  },
  description:
    "Portfolio of Muhammad Faza — a hybrid engineer bridging hardware and software: Computer Engineering, AI Engineering, Embedded AI, and Web Development. Open for full-time, freelance, and collaboration.",
  keywords: [
    "Muhammad Faza",
    "Computer Engineer",
    "AI Engineer",
    "Embedded AI",
    "Web Developer",
    "Software Engineer",
    "Hardware Engineer",
    "Portfolio",
  ],
  authors: [{ name: "Muhammad Faza" }],
  creator: "Muhammad Faza",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://muhammadfaza.vercel.app",
    siteName: "Muhammad Faza",
    title: "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer",
    description:
      "Portfolio of Muhammad Faza — a hybrid engineer bridging hardware and software. Open for full-time, freelance, and collaboration.",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Muhammad Faza Portfolio" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhammad Faza — Computer Engineer, AI Engineer",
    description:
      "Portfolio of Muhammad Faza — a hybrid engineer bridging hardware and software.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${blackOpsOne.variable} ${chelseaMarket.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col grain"
        suppressHydrationWarning={true}
      >
        <ParallaxBackground />
        <ConstellationBackground />

        {/* Gradual blur di tepi bawah viewport */}
        <GradualBlur
          position="bottom"
          height="3.3rem"
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": "https://muhammadfaza.vercel.app/#person",
                  name: "Muhammad Faza",
                  url: "https://muhammadfaza.vercel.app",
                  email: "mailto:lexfaza@gmail.com",
                  jobTitle: [
                    "Computer Engineer",
                    "AI Engineer",
                    "Embedded AI Engineer",
                    "Web Developer",
                  ],
                  sameAs: [
                    "https://www.instagram.com/mfaz.aa",
                    "https://github.com/MuhammadFaza-DU",
                    "https://www.linkedin.com/in/m-faza-443479372",
                    "https://www.youtube.com/@MuhammadFaza-justone",
                    "https://www.tiktok.com/@mfaz.aa",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://muhammadfaza.vercel.app/#website",
                  name: "Muhammad Faza",
                  url: "https://muhammadfaza.vercel.app",
                  inLanguage: "en",
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
