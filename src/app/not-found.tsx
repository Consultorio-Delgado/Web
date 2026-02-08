import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Página no encontrada",
    description: "La página que buscas no existe o fue movida.",
};

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6 max-w-md">
                {/* Error illustration */}
                <div className="relative">
                    <div className="text-9xl font-bold text-slate-200 dark:text-slate-800">404</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="h-20 w-20 text-primary/60" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        ¡Ups! Esta página no existe
                    </h1>
                    <p className="text-slate-600">
                        La página que estás buscando no se encuentra disponible o fue movida a otra ubicación.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Volver al Inicio
                        </Link>
                    </Button>
                    <Button variant="outline" asChild size="lg">
                        <Link href="/book">
                            Reservar Turno
                        </Link>
                    </Button>
                </div>

                {/* Help text */}
                <p className="text-sm text-slate-500">
                    ¿Necesitas ayuda? <Link href="/#contacto" className="text-primary hover:underline">Contáctanos</Link>
                </p>
            </div>
        </div>
    );
}
