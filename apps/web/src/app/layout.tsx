import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

/// As mesmas três famílias do painel de férias da Turin, para que os dois
/// sistemas internos leiam como um produto só.
///
/// A troca de Barlow Condensed por JetBrains Mono nos números não é estética:
/// a condensada é proporcional, então "11:58" e "07:04" não alinham numa
/// coluna. A mono alinha por construção — num espelho de ponto de 31 linhas
/// isso é a diferença entre conferir com o olho e conferir com a régua.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Turin Ponto — Painel",
  description: "Controle de ponto da Turin Transportes",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${interTight.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
