"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, differenceInMinutes, differenceInSeconds } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Clock, User, Phone, FileText, UserCheck, UserX, CheckCircle, Stethoscope, Timer } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { availabilityService } from "@/services/availabilityService";
import { appointmentService } from "@/services/appointments";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";

// Timer Component
function WaitingTimer({ arrivedAt }: { arrivedAt: Date }) {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const totalSeconds = differenceInSeconds(now, arrivedAt);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [arrivedAt]);

    return (
        <div className="flex items-center gap-1 text-amber-600 font-mono text-sm bg-amber-50 px-2 py-1 rounded">
            <Timer className="h-3 w-3" />
            <span>{elapsed}</span>
        </div>
    );
}

export default function DailyAgendaPage() {
    const { user, profile } = useAuth();
    const [date, setDate] = useState<Date>(addDays(new Date(), 1));
    const [slots, setSlots] = useState<{ time: string; status: 'free' | 'occupied' | 'blocked' | 'past'; appointment?: Appointment }[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which appointment is loading

    const [doctor, setDoctor] = useState<any>(null);

    useEffect(() => {
        const fetchDoctor = async () => {
            if (user && profile?.role === 'doctor') {
                const { doctorService } = await import("@/services/doctorService");
                const doc = await doctorService.getDoctorById(user.uid);
                setDoctor(doc);
            }
        };
        fetchDoctor();
    }, [user, profile]);

    const fetchSlots = useCallback(async () => {
        if (!doctor) return;
        setLoading(true);
        try {
            const appointments = await adminService.getDailyAppointments(date);
            const myAppointments = appointments.filter(a => a.doctorId === doctor.id);
            const dailySlots = await availabilityService.getAllDaySlots(doctor, date, myAppointments);
            setSlots(dailySlots);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la agenda");
        } finally {
            setLoading(false);
        }
    }, [date, doctor]);

    useEffect(() => {
        if (doctor) {
            fetchSlots();
        }
    }, [fetchSlots, doctor]);

    const handlePrevDay = () => setDate(addDays(date, -1));
    const handleNextDay = () => setDate(addDays(date, 1));

    // Action Handlers
    const handleMarkArrived = async (appointmentId: string) => {
        setActionLoading(appointmentId);
        try {
            await appointmentService.updateAppointment(appointmentId, {
                status: 'arrived',
                arrivedAt: new Date()
            });
            toast.success("Paciente en sala de espera");
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error("Error al marcar llegada");
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAbsent = async (appointmentId: string) => {
        setActionLoading(appointmentId);
        try {
            await appointmentService.updateAppointment(appointmentId, {
                status: 'absent'
            });
            toast.success("Paciente marcado como ausente");
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error("Error al marcar ausencia");
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkCompleted = async (appointmentId: string) => {
        setActionLoading(appointmentId);
        try {
            await appointmentService.updateAppointment(appointmentId, {
                status: 'completed'
            });
            toast.success("Consulta finalizada");
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error("Error al finalizar consulta");
        } finally {
            setActionLoading(null);
        }
    };

    if (!profile || profile.role !== 'doctor') return <div className="p-8">Acceso denegado</div>;

    return (
        <div className="container mx-auto py-6 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Agenda Diaria</h1>
                    <p className="text-muted-foreground">Vista detallada de turnos y disponibilidad.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={handlePrevDay}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" onClick={handleNextDay}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : slots.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-slate-50">
                    <p className="text-muted-foreground">No hay horarios configurados o disponibles para este día (Día no laboral o excepcion).</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {slots.map((slot, index) => {
                        const appt = slot.appointment;
                        const isArrived = appt?.status === 'arrived';
                        const isCompleted = appt?.status === 'completed';
                        const isAbsent = appt?.status === 'absent';
                        const isCancelled = appt?.status === 'cancelled';
                        const isPending = appt?.status === 'pending';
                        const isConfirmed = appt?.status === 'confirmed';

                        return (
                            <Card key={index} className={cn(
                                "transition-colors",
                                isPending ? "border-orange-400 bg-orange-50/50 ring-2 ring-orange-300 animate-pulse" :
                                    isArrived ? "border-amber-300 bg-amber-50/50 ring-2 ring-amber-300" :
                                        isCompleted ? "border-green-300 bg-green-50/50" :
                                            isAbsent || isCancelled ? "border-red-200 bg-red-50/30 opacity-60" :
                                                slot.status === 'occupied' ? "border-blue-200 bg-blue-50/50" :
                                                    slot.status === 'blocked' ? "border-red-200 bg-red-50/50" :
                                                        slot.status === 'free' ? "hover:border-green-300" : "opacity-60 bg-slate-50"
                            )}>
                                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-[120px]">
                                        <div className="bg-white border rounded-md p-2 flex items-center gap-2 shadow-sm">
                                            <Clock className="h-4 w-4 text-slate-500" />
                                            <span className="font-bold text-lg">{slot.time}</span>
                                        </div>
                                        <div className="sm:hidden">
                                            <StatusBadge status={slot.status} appointmentStatus={appt?.status} />
                                        </div>
                                    </div>

                                    <div className="flex-grow">
                                        {slot.status === 'occupied' && appt && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-lg">{appt.patientName}</span>
                                                    <Link href={`/doctor/patients/${appt.patientId}`}>
                                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                                            <Stethoscope className="h-3 w-3 mr-1" /> Historia
                                                        </Button>
                                                    </Link>
                                                    {isArrived && appt.arrivedAt && (
                                                        <WaitingTimer arrivedAt={appt.arrivedAt} />
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {appt.patientPhone || '-'}</span>
                                                    {appt.insurance && (
                                                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {appt.insurance}</span>
                                                    )}
                                                </div>
                                                {appt.medicalNotes && (
                                                    <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block mt-1">
                                                        Nota: {appt.medicalNotes}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {slot.status === 'blocked' && (
                                            <div>
                                                <span className="font-bold text-red-700">BLOQUEADO</span>
                                                <p className="text-sm text-red-600">No disponible para turnos.</p>
                                            </div>
                                        )}

                                        {slot.status === 'free' && (
                                            <span className="text-slate-500 italic">Disponibilidad libre</span>
                                        )}
                                    </div>

                                    <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
                                        <StatusBadge status={slot.status} appointmentStatus={appt?.status} />

                                        {slot.status === 'occupied' && appt && (
                                            <>
                                                {/* Show action buttons based on status */}
                                                {isConfirmed && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                                            onClick={() => handleMarkArrived(appt.id)}
                                                            disabled={actionLoading === appt.id}
                                                        >
                                                            {actionLoading === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3 mr-1" />}
                                                            En Espera
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                                            onClick={() => handleMarkAbsent(appt.id)}
                                                            disabled={actionLoading === appt.id}
                                                        >
                                                            <UserX className="h-3 w-3 mr-1" /> Ausente
                                                        </Button>
                                                    </>
                                                )}
                                                {isArrived && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleMarkCompleted(appt.id)}
                                                        disabled={actionLoading === appt.id}
                                                    >
                                                        {actionLoading === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                        Finalizar
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status, appointmentStatus }: { status: string; appointmentStatus?: string }) {
    if (appointmentStatus === 'arrived') return <Badge className="bg-amber-500 hover:bg-amber-600">En Espera</Badge>;
    if (appointmentStatus === 'completed') return <Badge className="bg-green-600 hover:bg-green-700">Finalizado</Badge>;
    if (appointmentStatus === 'absent') return <Badge variant="destructive">Ausente</Badge>;
    if (appointmentStatus === 'cancelled') return <Badge variant="secondary" className="line-through">Cancelado</Badge>;
    if (status === 'occupied') return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Ocupado</Badge>;
    if (status === 'blocked') return <Badge variant="destructive">BLOQUEADO</Badge>;
    if (status === 'free') return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Libre</Badge>;
    return <Badge variant="secondary">Pasado</Badge>;
}
