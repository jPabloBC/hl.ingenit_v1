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
  icons: {
    icon: [
      {
        url: "https://juupotamdjqzpxuqdtco.supabase.co/storage/v1/object/public/public-assets/hl/icon_bg_ngenIT.png",
        type: "image/png",
      },
      {
        url: "/favicon.png",
        type: "image/png",
      }
    ],
    shortcut: "https://juupotamdjqzpxuqdtco.supabase.co/storage/v1/object/public/public-assets/hl/icon_bg_ngenIT.png",
    apple: "https://juupotamdjqzpxuqdtco.supabase.co/storage/v1/object/public/public-assets/hl/icon_bg_ngenIT.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link 
          rel="icon" 
          href="https://juupotamdjqzpxuqdtco.supabase.co/storage/v1/object/public/public-assets/hl/icon_bg_ngenIT.png" 
          type="image/png"
        />
        <link 
          rel="shortcut icon" 
          href="https://juupotamdjqzpxuqdtco.supabase.co/storage/v1/object/public/public-assets/hl/icon_bg_ngenIT.png" 
          type="image/png"
        />
        <link 
          rel="apple-touch-icon" 
          href="https://juupotamdjqzpxuqdtco.supabase.co/storage/v1/object/public/public-assets/hl/icon_bg_ngenIT.png" 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${sansation.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
