import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navegacao from "../components/Navegacao";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planejamento Financeiro",
  description: "Gestão financeira do casal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-900">
        <Navegacao />

        {/* Espaço para a lateral (desktop) e para a barra inferior (celular) */}
        <main className="flex-1 md:pl-72 pb-24 md:pb-0">{children}</main>
      </body>
    </html>
  );
}