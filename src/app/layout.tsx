import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Archivo, Sansation } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const sansation = Sansation({
  variable: "--font-sansation",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "HL Ingenit - Hotel Management System",
  description:
    "Sistema de gestión hotelera completo con reservas, check-in/out, pagos y reportes avanzados.",
  keywords: ["hotel", "management", "reservas", "check-in", "pagos", "reportes"],
  authors: [{ name: "Ingenit Team" }],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/icon_ingenIT.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/assets/icon_ingenIT.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "HL Ingenit - Hotel Management System",
    description: "Sistema de gestión hotelera completo con reservas, check-in/out, pagos y reportes avanzados.",
    type: "website",
    locale: "es_CL",
    siteName: "HL Ingenit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${sansation.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}