import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";

import { AuthProvider } from "@/providers/auth-provider";
import { SmoothScrollProvider } from "@/providers/smooth-scroll-provider";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "TOPICS Pay",
  description: "Plataforma premium de autenticacao da TOPICS Pay."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body>
        <SmoothScrollProvider>
          <AuthProvider>{children}</AuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
