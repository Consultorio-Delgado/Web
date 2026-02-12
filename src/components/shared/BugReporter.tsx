"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supportService } from "@/services/supportService";
import { toast } from "sonner";

export function BugReporter() {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pathname = usePathname();
    const { user } = useAuth();

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error("Por favor, describe el problema.");
            return;
        }

        setIsSubmitting(true);
        try {
            await supportService.reportBug({
                description,
                pathname,
                userId: user?.uid,
                email: user?.email || undefined,
                userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "N/A",
            });

            toast.success("¡Gracias! Revisaremos el error pronto.");
            setIsOpen(false);
            setDescription("");
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar el reporte. Por favor, intenta más tarde.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                size="icon"
                className="fixed bottom-6 left-6 h-12 w-12 rounded-full shadow-lg border-red-200 bg-white hover:bg-red-50 hover:border-red-300 transition-all z-50 group"
                title="Reportar un error"
            >
                <AlertTriangle className="h-6 w-6 text-red-500 group-hover:scale-110 transition-transform" />
            </Button>

            {/* Report Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Reportar un problema
                        </DialogTitle>
                        <DialogDescription>
                            Usa este formulario para reportar fallos técnicos o errores en el sitio.
                            Capturaremos automáticamente la URL y los detalles del navegador.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Textarea
                            placeholder="Describe qué sucedió o qué no está funcionando como debería..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="resize-none"
                            autoFocus
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Reporte"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
