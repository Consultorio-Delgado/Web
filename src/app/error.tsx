"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console (could be sent to error tracking service)
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6 max-w-md">
                {/* Error illustration */}
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 p-6">
                        <AlertTriangle className="h-16 w-16 text-red-600" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Algo salió mal
                    </h1>
                    <p className="text-slate-600">
                        Ocurrió un error inesperado. Nuestro equipo técnico ha sido notificado y estamos trabajando para solucionarlo.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} size="lg">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Intentar de nuevo
                    </Button>
                    <Button variant="outline" asChild size="lg">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Ir al Inicio
                        </Link>
                    </Button>
                </div>

                {/* Error ID for support */}
                {error.digest && (
                    <p className="text-xs text-slate-400">
                        ID del error: {error.digest}
                    </p>
                )}

                {/* Help text */}
                <p className="text-sm text-slate-500">
                    Si el problema persiste, <Link href="/#contacto" className="text-primary hover:underline">contáctanos</Link>
                </p>
            </div>
        </div>
    );
}
