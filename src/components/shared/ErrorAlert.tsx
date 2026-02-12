"use client";

import { AlertTriangle, RefreshCw, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { reportService } from "@/services/reportService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ErrorAlertProps {
    error: Error;
    reset: () => void;
    isGlobal?: boolean;
}

export function ErrorAlert({ error, reset, isGlobal }: ErrorAlertProps) {
    const [isReporting, setIsReporting] = useState(false);
    const [reported, setReported] = useState(false);
    const { user } = useAuth();

    const handleReportAndReset = async () => {
        setIsReporting(true);
        try {
            await reportService.submitErrorReport(error, {
                userId: user?.uid,
                userEmail: user?.email || undefined
            });
            toast.success("Reporte enviado correctamente. Recargando...");
            setReported(true);
            setTimeout(() => reset(), 1500);
        } catch (err) {
            toast.error("Error al enviar el reporte.");
        } finally {
            setIsReporting(false);
        }
    };

    return (
        <div className={`flex items-center justify-center p-4 ${isGlobal ? 'h-screen w-screen bg-slate-50' : 'min-h-[400px]'}`}>
            <Card className="max-w-md w-full shadow-xl border-red-100">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-serif text-slate-800">¡Ups! Algo no salió como esperábamos</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Ocurrió un error inesperado en la aplicación. Nuestro equipo técnico puede solucionarlo más rápido si envías un reporte.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded text-xs font-mono text-slate-500 overflow-hidden text-ellipsis">
                        Error: {error.message || "Unknown Runtime Error"}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                        onClick={handleReportAndReset}
                        disabled={isReporting || reported}
                    >
                        {isReporting ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {reported ? "Reporte Enviado" : "Reportar Error y Recargar"}
                    </Button>

                    <div className="flex w-full gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 h-11"
                            onClick={() => reset()}
                            disabled={isReporting}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar
                        </Button>

                        <Button
                            variant="ghost"
                            className="flex-1 h-11"
                            onClick={() => window.location.href = '/'}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Ir al Inicio
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
