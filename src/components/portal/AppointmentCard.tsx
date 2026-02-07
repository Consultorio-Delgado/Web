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
}

export function AppointmentCard({ appointment, onStatusChange }: AppointmentCardProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const router = useRouter();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
            case 'pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
            case 'completed': return <Badge variant="secondary">Completado</Badge>;
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

    const handleReschedule = () => {
        // Redirigir al wizard preseleccionando doctor o simplemente al wizard
        // Ideally pass query params like ?reschedule=true&oldAppointmentId=...
        router.push(`/portal/new-appointment?reschedule=${appointment.id}&doctorId=${appointment.doctorId}`);
    };

    const isUpcoming = new Date(appointment.date) >= new Date();
    const canManage = isUpcoming && appointment.status !== 'cancelled' && appointment.status !== 'completed';

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-lg flex items-center gap-2">
                        {format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" /> {appointment.time} hs
                    </span>
                </div>
                {getStatusBadge(appointment.status)}
            </CardHeader>
            <CardContent className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Dr/a. {appointment.doctorId === 'capparelli' ? 'M. Capparelli' : 'G. Secondi'}</span>
                </div>
                <div className="text-sm text-muted-foreground pl-6">
                    {appointment.doctorId === 'capparelli' ? 'Clínica Médica' : 'Traumatología'}
                </div>
            </CardContent>
            {canManage && (
                <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={handleReschedule}>
                        Reprogramar
                    </Button>

                    <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">Cancelar</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Cancelar Turno
                                </DialogTitle>
                                <DialogDescription>
                                    ¿Está seguro que desea cancelar su turno con <strong>{appointment.doctorId}</strong> el día <strong>{format(new Date(appointment.date), "d/MM", { locale: es })}</strong>?
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
                </CardFooter>
            )}
        </Card>
    );
}
