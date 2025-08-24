import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Archivo, Sansation } from "next/font/google";
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
});

export const metadata: Metadata = {
  title: "ShIngenit - Plataforma de Alojamientos",
  description: "Descubre hoteles, hospedajes, moteles, restaurantes y bares en tu destino. Reserva fácilmente y disfruta de experiencias únicas.",
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
      </body>
    </html>
  );
}
