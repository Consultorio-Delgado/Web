"use client";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { Inter, Playfair_Display } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <body className={cn(
                "min-h-screen bg-background font-sans antialiased",
                inter.variable,
                playfair.variable
            )}>
                <ErrorAlert error={error} reset={reset} isGlobal />
            </body>
        </html>
    );
}
