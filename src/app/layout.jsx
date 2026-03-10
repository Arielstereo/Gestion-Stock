import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import RegisterSW from "@/components/RegisterSW";
import SplashWrapper from "@/components/SplashWrapper";

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi-arabic",
  subsets: ["latin"],
  height: "700",
});

export const metadata = {
  title: "Stock Deposito Tredi Argentina",
  description: "Control de stock",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tredi Stock",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tredi Stock" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Android / general */}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${notoKufiArabic.className} antialiased font-semibold`}>
        <RegisterSW />
        <SplashWrapper>
          <Navbar />
        </SplashWrapper>
        {children}
      </body>
    </html>
  );
}
