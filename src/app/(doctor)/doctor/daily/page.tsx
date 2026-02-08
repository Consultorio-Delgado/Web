"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { availabilityService } from "@/services/availabilityService";
import { appointmentService } from "@/services/appointments";
import { format, addDays, differenceInSeconds } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    FileText,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Stethoscope,
    Timer,
    ShieldAlert,
    CalendarPlus,
    X,
    Unlock,
    Lock,
    Users,
    User as UserIcon,
    UserCheck,
    UserX
} from "lucide-react";
import { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PatientSearch } from "@/components/doctor/PatientSearch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

// ... WaitingTimer component ...
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

interface DailySlot {
    time: string;
    status: 'free' | 'occupied' | 'blocked' | 'past';
    appointment?: Appointment;
    doctor: any; // Added doctor info to slot to identify owner
}

export default function DailyAgendaPage() {
    const { user, profile } = useAuth();
    const [date, setDate] = useState<Date>(addDays(new Date(), 1));
    const [slots, setSlots] = useState<DailySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [doctor, setDoctor] = useState<any>(null);

    // Concurrent View State
    const [viewAllDoctors, setViewAllDoctors] = useState(false);

    // Multi-Select State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

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
            const { doctorService } = await import("@/services/doctorService");

            // 1. Get Appointments for the day (all of them, then filter needed)
            const allAppointments = await adminService.getDailyAppointments(date);

            let finalSlots: DailySlot[] = [];

            if (viewAllDoctors) {
                // Fetch ALL doctors
                const allDoctors = await doctorService.getAllDoctors();

                const promises = allDoctors.map(async (doc) => {
                    const docAppointments = allAppointments.filter(a => a.doctorId === doc.id);
                    const daySlots = await availabilityService.getAllDaySlots(doc, date, docAppointments);
                    return daySlots.map(s => ({ ...s, doctor: doc }));
                });

                const results = await Promise.all(promises);
                finalSlots = results.flat().sort((a, b) => a.time.localeCompare(b.time));

            } else {
                // Just ME
                const myAppointments = allAppointments.filter(a => a.doctorId === doctor.id);
                const daySlots = await availabilityService.getAllDaySlots(doctor, date, myAppointments);
                finalSlots = daySlots.map(s => ({ ...s, doctor: doctor }));
            }

            setSlots(finalSlots);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la agenda");
        } finally {
            setLoading(false);
        }
    }, [date, doctor, viewAllDoctors]);

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
            // Find appointment details for email
            const slot = slots.find(s => s.appointment?.id === appointmentId);
            const appt = slot?.appointment;

            await appointmentService.updateAppointment(appointmentId, {
                status: 'absent'
            });

            if (appt && appt.patientEmail) {
                fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'absence',
                        data: {
                            to: appt.patientEmail,
                            patientName: appt.patientName,
                            doctorName: appt.doctorName || 'Consultorio Delgado',
                            date: format(appt.date, "dd/MM/yyyy"),
                            time: appt.time
                        }
                    })
                }).catch(err => console.error("Failed to send absence email:", err));
            }

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

    // New Booking & Blocking Logic
    const [bookingSlot, setBookingSlot] = useState<{ time: string, doctorId: string } | null>(null);

    const handleBooking = async (patient: any) => {
        if (!bookingSlot) return; // doctorID is in bookingSlot now

        // Find the doctor object for this slot
        const targetDoctor = bookingSlot.doctorId === doctor.id ? doctor : (slots.find(s => s.doctor.id === bookingSlot.doctorId)?.doctor);
        if (!targetDoctor) return;

        try {
            setActionLoading('booking');
            const apptDate = new Date(date);
            const [hours, minutes] = bookingSlot.time.split(':').map(Number);
            apptDate.setHours(hours, minutes, 0, 0);

            await appointmentService.createAppointment({
                patientId: patient.uid,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientEmail: patient.email,
                doctorId: targetDoctor.id, // Book for the CORRECT doctor
                doctorName: `${targetDoctor.firstName} ${targetDoctor.lastName}`,
                date: apptDate,
                time: bookingSlot.time,
                status: 'confirmed',
                type: 'Consulta',
                notes: 'Reservado manualmente desde Agenda Diaria'
            } as any);

            toast.success(`Turno reservado para ${patient.firstName} ${patient.lastName} con Dr. ${targetDoctor.lastName}`);
            fetchSlots();
            setBookingSlot(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al reservar turno");
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlockSlot = async (time: string, targetDoctorId: string) => {
        // Can only block my own slots usually, but requested feature implies managing agenda? 
        // Let's restrict blocking to own slots OR if admin? No, requirements didn't specify.
        // Assuming I can only block MY slots for safety unless otherwise specified.
        // BUT user asked for "concurrent view".
        // Let's allow blocking ONLY if it's my slot for now to be safe.
        // Allow blocking any slot (Shared Management)
        /*
        if (targetDoctorId !== doctor.id) {
            toast.error("Solo puedes bloquear tus propios horarios.");
            return;
        }
        */

        try {
            setActionLoading(time + targetDoctorId);
            const apptDate = new Date(date);
            const [hours, minutes] = time.split(':').map(Number);
            apptDate.setHours(hours, minutes, 0, 0);

            await appointmentService.createAppointment({
                patientId: 'blocked',
                patientName: 'Bloqueado',
                patientEmail: '',
                doctorId: doctor.id,
                doctorName: `${doctor.firstName} ${doctor.lastName}`,
                date: apptDate,
                time: time,
                type: 'Bloqueado',
                status: 'confirmed',
                notes: 'Bloqueado manualmente desde Agenda Diaria'
            } as any);

            toast.success(`Horario ${time} bloqueado.`);
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error("Error al bloquear horario");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnblockSlot = async (appointmentId: string, appointmentDoctorId: string) => {
        // Allow unblocking any slot (Shared Management)
        /*
        if (appointmentDoctorId !== doctor.id) {
            toast.error("Solo puedes desbloquear tus propios horarios.");
            return;
        }
        */

        try {
            setActionLoading(appointmentId);
            await appointmentService.cancelAppointment(appointmentId);
            toast.success("Horario desbloqueado");
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error("Error al desbloquear horario");
        } finally {
            setActionLoading(null);
        }
    };

    const toggleSlotSelection = (time: string) => {
        // Only allow selection of OWN slots
        // This is tricky with flattened list. 
        // For simplicity, multi-select only works on "My Agenda" view or filters out others?
        // Let's disable multi-select if viewAllDoctors is ON OR filter interactions.
        // Actually, let's keep it simple: Multi-select works on the displayed slots that belong to ME.
        // But the set only stores 'time'. It doesn't store doctor ID.
        // If two doctors have 10:00, toggling 10:00 is ambiguous.
        // FIX: Change selectedSlots to store `${time}-${doctorId}` ?
        // Or just disable multi-select when "View All" is active to avoid complexity.
        if (viewAllDoctors) {
            toast.warning("Modo selección múltiple solo disponible en 'Solo Yo'");
            setIsSelectionMode(false);
            setViewAllDoctors(false);
            return;
        }

        const newSelected = new Set(selectedSlots);
        if (newSelected.has(time)) {
            newSelected.delete(time);
        } else {
            newSelected.add(time);
        }
        setSelectedSlots(newSelected);
    };

    const handleBlockSelectedSlots = async () => {
        if (!doctor || selectedSlots.size === 0) return;
        setLoading(true);
        try {
            const apptDate = new Date(date);

            const promises = Array.from(selectedSlots).map(async (time) => {
                const [hours, minutes] = time.split(':').map(Number);
                const slotDate = new Date(apptDate);
                slotDate.setHours(hours, minutes, 0, 0);

                return appointmentService.createAppointment({
                    patientId: 'blocked',
                    patientName: 'Bloqueado',
                    patientEmail: '',
                    doctorId: doctor.id,
                    doctorName: `${doctor.firstName} ${doctor.lastName}`,
                    date: slotDate,
                    time: time,
                    type: 'Bloqueado',
                    status: 'confirmed',
                    notes: 'Bloqueado masivamente desde Agenda Diaria'
                } as any);
            });

            await Promise.all(promises);

            toast.success(`${selectedSlots.size} horarios bloqueados.`);
            setIsSelectionMode(false);
            setSelectedSlots(new Set());
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error("Error al bloquear horarios seleccionados");
        } finally {
            setLoading(false);
        }
    };
    const handleUnblockSelectedSlots = async () => {
        if (!doctor || selectedSlots.size === 0) return;
        setLoading(true);
        try {
            const promises = Array.from(selectedSlots).map(async (time) => {
                const slot = slots.find(s => s.time === time);
                if (slot?.appointment?.id) {
                    return appointmentService.cancelAppointment(slot.appointment.id);
                }
            });

            await Promise.all(promises);

            toast.success(`${selectedSlots.size} horarios desbloqueados.`);
            setIsSelectionMode(false);
            setSelectedSlots(new Set());
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error("Error al desbloquear horarios seleccionados");
        } finally {
            setLoading(false);
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

                <div className="flex items-center gap-4">
                    {/* Toggle View All */}
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border">
                        <UserIcon className={cn("h-4 w-4", !viewAllDoctors ? "text-primary font-bold" : "text-slate-400")} />
                        <Switch
                            checked={viewAllDoctors}
                            onCheckedChange={(checked) => {
                                setViewAllDoctors(checked);
                                if (checked) setIsSelectionMode(false); // Disable multi-select when enabling all view
                            }}
                        />
                        <Users className={cn("h-4 w-4", viewAllDoctors ? "text-primary font-bold" : "text-slate-400")} />
                        <span className="text-xs font-medium text-slate-600 ml-1">
                            {viewAllDoctors ? "Todos" : "Solo Yo"}
                        </span>
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
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2 mb-4">
                {/* Selection Mode Toggle - Only if NOT View All */}
                {slots.length > 0 && !viewAllDoctors && (
                    <Button
                        variant={isSelectionMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedSlots(new Set()); // Clear on toggle
                        }}
                    >
                        {isSelectionMode ? "Cancelar Selección" : "Selección Múltiple"}
                    </Button>
                )}

                {/* Bulk Actions */}
                {isSelectionMode && selectedSlots.size > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBlockSelectedSlots}
                            disabled={loading}
                        >
                            <ShieldAlert className="mr-2 h-4 w-4" /> Bloquear ({selectedSlots.size})
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={handleUnblockSelectedSlots}
                            disabled={loading}
                        >
                            <Unlock className="mr-2 h-4 w-4" /> Desbloquear ({selectedSlots.size})
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : slots.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-slate-50">
                    <p className="text-muted-foreground">No hay horarios configurados o disponibles para este día.</p>
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

                        const isMySlot = doctor && slot.doctor.id === doctor.id;

                        // Check if selectable
                        const isSelectable = isSelectionMode && isMySlot && (slot.status === 'free' || slot.status === 'blocked');

                        return (
                            <Card key={`${index}-${slot.time}-${slot.doctor.id}`}
                                onClick={() => {
                                    if (isSelectable) {
                                        toggleSlotSelection(slot.time);
                                    }
                                }}
                                className={cn(
                                    "transition-colors",
                                    isPending ? "border-orange-400 bg-orange-50/50 ring-2 ring-orange-300 animate-pulse" :
                                        isArrived ? "border-amber-300 bg-amber-50/50 ring-2 ring-amber-300" :
                                            isCompleted ? "border-green-300 bg-green-50/50" :
                                                isAbsent || isCancelled ? "border-red-200 bg-red-50/30 opacity-60" :
                                                    slot.status === 'occupied' ? "border-blue-200 bg-blue-50/50" :
                                                        slot.status === 'blocked' ?
                                                            (isMySlot ? "border-red-200 bg-red-50/50" : "border-red-100 bg-red-50/30") : // Softer blocked for others
                                                            slot.status === 'free' ?
                                                                (isMySlot ? "hover:border-green-300" : "bg-orange-50/50 border-orange-100") // Orange for others
                                                                : "opacity-60 bg-slate-50",
                                    isSelectable && "cursor-pointer hover:bg-slate-50",
                                    isSelectionMode && selectedSlots.has(slot.time) && "ring-2 ring-primary border-primary bg-primary/5",
                                    !isMySlot && !isSelectionMode && "opacity-90" // Slight dim for others
                                )}>
                                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-[140px]">
                                        {isSelectable && (
                                            <Checkbox
                                                checked={selectedSlots.has(slot.time)}
                                                onCheckedChange={() => toggleSlotSelection(slot.time)}
                                            />
                                        )}

                                        <div className={cn("border rounded-md p-2 flex flex-col items-center gap-1 shadow-sm w-[70px]",
                                            !isMySlot ? "bg-orange-100/50 border-orange-200" : "bg-white"
                                        )}>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-slate-500" />
                                                <span className="font-bold text-lg leading-none">{slot.time}</span>
                                            </div>
                                            {!isMySlot && (
                                                <span className="text-[10px] uppercase font-bold text-orange-600 truncate w-full text-center">
                                                    {slot.doctor.lastName}
                                                </span>
                                            )}
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
                                                    {!isMySlot && (
                                                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-xs">
                                                            {slot.doctor.id === 'secondi' ? 'Dra.' : 'Dr.'} {slot.doctor.lastName}
                                                        </Badge>
                                                    )}
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
                                                    {/* Show intake info instead of phone */}
                                                    {appt.isFirstVisit && (
                                                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                                                            <User className="h-3 w-3" /> Primera vez
                                                        </span>
                                                    )}
                                                    {appt.consultationType && (
                                                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                            <FileText className="h-3 w-3" />
                                                            {appt.consultationType === 'consulta-ginecologica' ? 'Consulta Ginecológica' :
                                                                appt.consultationType === 'pap-colpo' ? 'Pap y Colpo' :
                                                                    appt.consultationType === 'prueba-hpv' ? 'Prueba de HPV' : appt.consultationType}
                                                        </span>
                                                    )}
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
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-red-700 flex items-center gap-1">
                                                        <Lock className="h-3 w-3" /> BLOQUEADO
                                                    </span>
                                                    {!isMySlot && (
                                                        <span className="text-xs text-slate-500">
                                                            ({slot.doctor.id === 'secondi' ? 'Dra.' : 'Dr.'} {slot.doctor.lastName})
                                                        </span>
                                                    )}
                                                </div>
                                                {isMySlot && <p className="text-sm text-red-600">No disponible para turnos.</p>}
                                            </div>
                                        )}


                                        {slot.status === 'free' && !isSelectionMode && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 italic mr-2 text-sm">
                                                    Disponible {isMySlot ? "" : `(${slot.doctor.id === 'secondi' ? 'Dra.' : 'Dr.'} ${slot.doctor.lastName})`}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant={isMySlot ? "outline" : "outline"} // Keep consistent or distinct?
                                                    className={`h-8 gap-1 ${!isMySlot ? "border-orange-200 text-orange-700 hover:bg-orange-50" : ""}`}
                                                    onClick={() => setBookingSlot({ time: slot.time, doctorId: slot.doctor.id })}
                                                >
                                                    <CalendarPlus className="h-3 w-3" /> Reservar {!isMySlot && `${slot.doctor.id === 'secondi' ? 'Dra.' : 'Dr.'} ${slot.doctor.lastName}`}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleBlockSlot(slot.time, slot.doctor.id)}
                                                    disabled={actionLoading === (slot.time + slot.doctor.id)}
                                                >
                                                    {actionLoading === (slot.time + slot.doctor.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Show "Free" label in selection mode */}
                                        {slot.status === 'free' && isSelectionMode && (
                                            <span className="text-slate-400 italic">Disponible</span>
                                        )}
                                    </div>

                                    <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
                                        <StatusBadge status={slot.status} appointmentStatus={appt?.status} />

                                        {!isSelectionMode && slot.status === 'blocked' && appt && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 font-medium"
                                                onClick={() => handleUnblockSlot(appt.id, slot.doctor.id)}
                                                disabled={actionLoading === appt.id}
                                            >
                                                {actionLoading === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3 mr-1" />}
                                                Desbloquear
                                            </Button>
                                        )}

                                        {!isSelectionMode && slot.status === 'occupied' && appt && (
                                            <>
                                                {/* Edit Actions - Shared Management enabled */}
                                                {true && (
                                                    <>
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
                                                            <>
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
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-slate-400 hover:text-slate-600"
                                                                    onClick={async () => {
                                                                        setActionLoading(appt.id);
                                                                        try {
                                                                            await appointmentService.updateAppointment(appt.id, {
                                                                                status: 'confirmed',
                                                                                arrivedAt: null
                                                                            } as any);
                                                                            toast.success("Estado revertido a Confirmado");
                                                                            fetchSlots();
                                                                        } catch (error) {
                                                                            toast.error("Error al revertir estado");
                                                                        } finally {
                                                                            setActionLoading(null);
                                                                        }
                                                                    }}
                                                                    disabled={actionLoading === appt.id}
                                                                >
                                                                    Deshacer
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
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

            {/* Manual Booking Dialog */}
            <Dialog open={!!bookingSlot} onOpenChange={(open) => !open && setBookingSlot(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reservar Turno: {bookingSlot?.time}</DialogTitle>
                        <DialogDescription>Búsqueda y asignación de paciente para el turno.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Label>Buscar Paciente</Label>
                        <PatientSearch onSelect={handleBooking} />
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setBookingSlot(null)}>Cancelar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
// ... StatusBadge

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
