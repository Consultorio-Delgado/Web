import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://consultoriodelgado.com"),
  title: {
    default: "Consultorio Delgado | Reserva de Turnos Online",
    template: "%s | Consultorio Delgado"
  },
  description: "Medicina de excelencia. Agenda tu cita de forma rápida y segura con los mejores especialistas.",
  keywords: ["consultorio médico", "turnos online", "reserva de turnos", "medicina", "doctores", "buenos aires"],
  authors: [{ name: "Consultorio Delgado" }],
  creator: "Consultorio Delgado",
  publisher: "Consultorio Delgado",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Consultorio Delgado",
    title: "Consultorio Delgado | Reserva de Turnos Online",
    description: "Medicina de excelencia. Agenda tu cita de forma rápida y segura con los mejores especialistas.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Consultorio Delgado - Medicina de Excelencia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consultorio Delgado | Reserva de Turnos Online",
    description: "Medicina de excelencia. Agenda tu cita de forma rápida y segura.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/logo_icon_web.png",
    shortcut: "/images/logo_icon_web.png",
    apple: "/images/logo_icon_web.png",
  },
  manifest: "/site.webmanifest",
};

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { ContactButton } from "@/components/shared/ContactButton";
import { AnnouncementPopup } from "@/components/shared/AnnouncementPopup";
import { BugReporter } from "@/components/shared/BugReporter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable,
        playfair.variable
      )}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <AnnouncementPopup />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ContactButton />
          <BugReporter />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
