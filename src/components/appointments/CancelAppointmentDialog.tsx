import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CancelAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    patientName?: string;
    isSubmitting?: boolean;
}

export function CancelAppointmentDialog({
    open,
    onOpenChange,
    onConfirm,
    patientName,
    isSubmitting = false
}: CancelAppointmentDialogProps) {
    const [reason, setReason] = useState("");

    // Reset when dialog opens/closes
    React.useEffect(() => {
        if (open) {
            setReason("");
        }
    }, [open]);

    const handleConfirm = () => {
        onConfirm(reason.trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Cancelar Cita</DialogTitle>
                    <DialogDescription>
                        {patientName ? (
                            <>
                                Estás apunto de cancelar el turno de <strong>{patientName}</strong>. 
                                Esta acción notificará al paciente y no se puede deshacer.
                            </>
                        ) : (
                            "¿Estás seguro de que quieres eliminar este turno?"
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo de Cancelación (Opcional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Ej: Ausencia no justificada del doctor, problema técnico, etc."
                            value={reason}
                            maxLength={500}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                        <p className="text-xs text-slate-500 text-right">
                            {reason.length}/500 caracteres
                        </p>
                        <p className="text-sm text-slate-500 bg-slate-50 border p-2 rounded-md mt-2">
                            El texto ingresado aquí se enviará automáticamente al paciente por correo electrónico.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        variant="destructive"
                    >
                        {isSubmitting ? "Cancelando..." : "Confirmar Cancelación"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
