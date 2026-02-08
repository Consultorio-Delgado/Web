"use client";

import { Appointment } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Verify if I need to install this? Shadcn usually has it.
import { CalendarDays, Clock, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { appointmentService } from "@/services/appointments";
import { useRouter } from "next/navigation";

interface AppointmentCardProps {
    appointment: Appointment;
    onStatusChange: () => void; // Callback to refresh list
    doctorSpecialty?: string;
}

export function AppointmentCard({ appointment, onStatusChange, doctorSpecialty }: AppointmentCardProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const router = useRouter();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
            case 'pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
            case 'completed': return <Badge className="bg-blue-600 hover:bg-blue-700">Asistió</Badge>;
            case 'absent': return <Badge variant="destructive">Ausente</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await appointmentService.cancelAppointment(appointment.id);
            toast.success("Turno cancelado correctamente.");
            setIsCancelDialogOpen(false);
            onStatusChange();
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al cancelar el turno.");
        } finally {
            setIsCancelling(false);
        }
    };

    const isUpcoming = new Date(appointment.date) >= new Date();
    const canManage = isUpcoming && appointment.status !== 'cancelled' && appointment.status !== 'completed';

    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-slate-800">
                        Dr. {appointment.doctorName || appointment.doctorId}
                    </h3>
                    {getStatusBadge(appointment.status)}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                        <CalendarDays className="h-5 w-5 text-cyan-600" />
                        <span className="text-sm font-medium">
                            {format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <Clock className="h-5 w-5 text-cyan-600" />
                        <span className="text-sm font-medium">
                            {appointment.time} hs
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <User className="h-5 w-5 text-cyan-600" />
                        <span className="text-sm">
                            {doctorSpecialty || (appointment as any).specialty || 'Especialidad'}
                        </span>
                    </div>
                </div>

                {canManage && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-full text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300 px-6">
                                    Cancelar Turno
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        Cancelar Turno
                                    </DialogTitle>
                                    <DialogDescription>
                                        ¿Está seguro que desea cancelar su turno con <strong>{appointment.doctorName || appointment.doctorId}</strong> el día <strong>{format(new Date(appointment.date), "d/MM", { locale: es })}</strong>?
                                        <br /><br />
                                        Esta acción no se puede deshacer.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>Volver</Button>
                                    <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                                        {isCancelling ? "Cancelando..." : "Confirmar Cancelación"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </CardContent>
            {/* Removed CardFooter as buttons are moved inside */}
        </Card>
    );
}
