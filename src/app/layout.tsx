import type { Metadata } from "next";
import { Syne, Epilogue } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const epilogue = Epilogue({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GéoService — Le bon artisan, à deux pas de chez vous",
  description:
    "Trouvez un menuisier, plombier, électricien ou tout autre artisan à proximité. Service communautaire de mise en relation, sans inscription.",
  keywords: ["artisan", "proximité", "prestataire", "Côte d'Ivoire", "Abidjan", "Afrique"],
  openGraph: {
    title: "GéoService",
    description: "Le bon artisan, à deux pas de chez vous",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${syne.variable} ${epilogue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ paddingBottom: "64px" }}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
