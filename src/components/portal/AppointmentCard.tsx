"use client";

import { Appointment } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Verify if I need to install this? Shadcn usually has it.
import { CalendarDays, Clock, User, AlertTriangle, Loader2 } from "lucide-react";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { appointmentService } from "@/services/appointments";
import { userService } from "@/services/user";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AppointmentCardProps {
    appointment: Appointment;
    onStatusChange: () => void; // Callback to refresh list
    doctorSpecialty?: string;
}

export function AppointmentCard({ appointment, onStatusChange, doctorSpecialty }: AppointmentCardProps) {
    const { refreshProfile } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isWarningAccepted, setIsWarningAccepted] = useState(false);
    
    // Reschedule states
    const [alternativeSlots, setAlternativeSlots] = useState<string[]>([]);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [isRescheduleMode, setIsRescheduleMode] = useState(false);
    const [selectedAlternativeTime, setSelectedAlternativeTime] = useState<string | null>(null);

    const router = useRouter();

    // Calculate if it's within 48 hours for penalty warning early so it can be used in effects
    const isWithin48Hours = (() => {
        const [hoursStr, minutesStr] = appointment.time.split(':');
        const appointmentDateTime = new Date(appointment.date);
        appointmentDateTime.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);
        
        const now = new Date();
        const msDifference = appointmentDateTime.getTime() - now.getTime();
        const hoursDifference = msDifference / (1000 * 60 * 60);
        return hoursDifference > 0 && hoursDifference <= 48;
    })();

    useEffect(() => {
        if (isCancelDialogOpen && isWithin48Hours) {
            const fetchAlternativeSlots = async () => {
                setIsFetchingSlots(true);
                try {
                    const { doctorService } = await import("@/services/doctorService");
                    const { availabilityService } = await import("@/services/availabilityService");
                    
                    const doctor = await doctorService.getDoctorById(appointment.doctorId);
                    if (!doctor) return;

                    const date = new Date(appointment.date);
                    const busyAppointments = await appointmentService.getDoctorAppointmentsOnDate(doctor.id, date);
                    const slots = await availabilityService.getAvailableSlots(doctor, date, busyAppointments);
                    
                    // Filter out the current appointment time
                    const filteredSlots = slots.filter(time => time !== appointment.time);
                    setAlternativeSlots(filteredSlots);
                } catch (error) {
                    console.error("Error fetching alternative slots", error);
                } finally {
                    setIsFetchingSlots(false);
                }
            };
            fetchAlternativeSlots();
        } else {
            // Reset states when closed
            setAlternativeSlots([]);
            setIsRescheduleMode(false);
            setSelectedAlternativeTime(null);
            setIsWarningAccepted(false);
        }
    }, [isCancelDialogOpen, appointment.date, appointment.doctorId, appointment.time, isWithin48Hours]);

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

            // Apply 7-day block if cancelling within 48 hours
            if (isWithin48Hours) {
                try {
                    const blockedUntil = new Date();
                    blockedUntil.setDate(blockedUntil.getDate() + 7);
                    await userService.updateUserProfile(appointment.patientId, {
                        blockedUntil: blockedUntil
                    });
                    await refreshProfile();
                } catch (blockError) {
                    console.error("Error applying block:", blockError);
                    // Don't fail the cancellation over this
                }
            }

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

    const handleMoveAppointment = async () => {
        if (!selectedAlternativeTime) return;
        setIsCancelling(true); // Reusing this loading state for simplicity
        try {
            await appointmentService.updateAppointment(appointment.id, {
                time: selectedAlternativeTime
            });

            // Send Email Confirmation (Fire and Forget)
            if ((appointment as any).patientEmail && !appointment.patientId?.startsWith('manual_')) {
                const specialty = appointment.doctorId === 'secondi' || appointment.doctorName?.toLowerCase().includes('secondi')
                    ? 'Ginecología'
                    : appointment.doctorId === 'capparelli' || appointment.doctorName?.toLowerCase().includes('capparelli')
                        ? 'Clínica Médica'
                        : undefined;

                fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'confirmation',
                        data: {
                            to: (appointment as any).patientEmail,
                            patientName: appointment.patientName || 'Paciente',
                            doctorName: appointment.doctorName || 'Dr. (Consultar en Portal)',
                            date: new Date(appointment.date).toLocaleDateString(),
                            time: selectedAlternativeTime,
                            appointmentId: appointment.id,
                            specialty: specialty
                        }
                    })
                }).catch(err => console.error("Failed to send reschedule email:", err));
            }

            toast.success("Turno cambiado de horario exitosamente.");
            setIsCancelDialogOpen(false);
            onStatusChange();
        } catch (error) {
            console.error("Error moving appointment:", error);
            toast.error("Ocurrió un error al cambiar el horario.");
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
                        {(() => {
                            const id = appointment.doctorId;
                            const name = appointment.doctorName || '';
                            const lowerName = name.toLowerCase();

                            if (id === 'secondi' || lowerName.includes('secondi')) {
                                return 'Dra. María Verónica Secondi';
                            }
                            if (id === 'capparelli' || lowerName.includes('capparelli')) {
                                return 'Dr. Germán Capparelli';
                            }

                            if (lowerName.startsWith('dr.') || lowerName.startsWith('dra.')) {
                                return name;
                            }

                            return `Dr. ${name}`;
                        })()}
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
                                        {isRescheduleMode ? (
                                            <>
                                                <CalendarDays className="h-5 w-5 text-green-600" />
                                                Mover Turno
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                                Cancelar Turno
                                            </>
                                        )}
                                    </DialogTitle>
                                    <div className="text-slate-600">
                                        {!isRescheduleMode ? (
                                            <>
                                                <p>
                                                    ¿Está seguro que desea cancelar su turno con <strong>{appointment.doctorName || appointment.doctorId}</strong> el día <strong>{format(new Date(appointment.date), "d/MM", { locale: es })}</strong>?
                                                </p>
                                                
                                                {isFetchingSlots ? (
                                                    <div className="flex items-center gap-2 pt-4">
                                                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                                        <span className="text-sm text-green-700">Verificando horarios disponibles...</span>
                                                    </div>
                                                ) : alternativeSlots.length > 0 && (
                                                    <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md mt-4 flex items-start gap-3 text-left">
                                                        <CalendarDays className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
                                                        <div className="space-y-3">
                                                            <p className="text-sm leading-relaxed">
                                                                <strong>¿Desea cambiar el horario?</strong> Puede mover este turno a otro horario disponible hoy mismo sin recibir penalidad por cancelación.
                                                            </p>
                                                            <Button 
                                                                variant="outline" 
                                                                className="bg-white border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800 w-full"
                                                                onClick={() => setIsRescheduleMode(true)}
                                                            >
                                                                Ver horarios disponibles
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {isWithin48Hours && (
                                                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-md my-4 flex items-start gap-3 text-left">
                                                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-orange-600" />
                                                        <div className="space-y-3">
                                                            <p className="text-sm leading-relaxed">
                                                                Como faltan 48hs, <strong>NO podrá tomar otro turno por 7 días.</strong> Este turno quedará vacante y no podrá ser utilizado por otro paciente que lo necesita.
                                                            </p>
                                                            <div className="flex items-center gap-2 pt-2 border-t border-orange-200/50">
                                                                <Checkbox 
                                                                    id="warning-accept" 
                                                                    checked={isWarningAccepted}
                                                                    onCheckedChange={(checked) => setIsWarningAccepted(checked as boolean)}
                                                                />
                                                                <Label htmlFor="warning-accept" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-orange-900">
                                                                    He leído y comprendo esta advertencia.
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-sm mt-4">Esta acción no se puede deshacer.</p>
                                            </>
                                        ) : (
                                            <div className="mt-4">
                                                <p className="mb-4">
                                                    Seleccione el nuevo horario para el turno con <strong>{appointment.doctorName || appointment.doctorId}</strong> del día <strong>{format(new Date(appointment.date), "d/MM", { locale: es })}</strong>:
                                                </p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {alternativeSlots.map((time) => (
                                                        <Button
                                                            key={time}
                                                            variant={selectedAlternativeTime === time ? "default" : "outline"}
                                                            className={cn(
                                                                "w-full",
                                                                selectedAlternativeTime === time 
                                                                    ? "bg-green-600 hover:bg-green-700" 
                                                                    : "border-green-200 text-green-700 hover:bg-green-50"
                                                            )}
                                                            onClick={() => setSelectedAlternativeTime(time)}
                                                        >
                                                            {time}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DialogHeader>
                                <DialogFooter>
                                    {!isRescheduleMode ? (
                                        <>
                                            <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>Volver</Button>
                                            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling || (isWithin48Hours && !isWarningAccepted)}>
                                                {isCancelling ? "Cancelando..." : "Confirmar Cancelación"}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" onClick={() => setIsRescheduleMode(false)}>Atrás</Button>
                                            <Button 
                                                variant="default" 
                                                className="bg-green-600 hover:bg-green-700 text-white" 
                                                onClick={handleMoveAppointment} 
                                                disabled={isCancelling || !selectedAlternativeTime}
                                            >
                                                {isCancelling ? "Moviendo..." : "Confirmar Cambio"}
                                            </Button>
                                        </>
                                    )}
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
