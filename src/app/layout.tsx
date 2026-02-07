import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Consultorio Delgado | Medicina de Excelencia",
    template: "%s | Consultorio Delgado",
  },
  description: "Gestión de turnos médicos y atención personalizada en Consultorio Delgado. Reserva tu cita online con nuestros especialistas.",
  keywords: ["medicina", "turnos", "salud", "consultorio", "delgado", "especialistas", "reservas online"],
  authors: [{ name: "Consultorio Delgado" }],
  creator: "Consultorio Delgado",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://consultoriodelgado.com",
    title: "Consultorio Delgado | Cuidamos tu salud",
    description: "Atención médica de primer nivel. Reserva tu turno online en segundos.",
    siteName: "Consultorio Delgado",
  },
  twitter: {
    card: "summary_large_image",
    title: "Consultorio Delgado",
    description: "Cuidamos tu salud, cuidamos de vos.",
    creator: "@consultoriodelgado",
  },
};

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
