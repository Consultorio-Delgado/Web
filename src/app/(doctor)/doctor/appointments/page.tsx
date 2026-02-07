"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/adminService";
import { appointmentService } from "@/services/appointments";
import { doctorService } from "@/services/doctorService";
import { availabilityService } from "@/services/availabilityService";
import { exceptionService } from "@/services/exceptionService";
import { Appointment, Doctor } from "@/types";
import { Loader2, Unlock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [daySlots, setDaySlots] = useState<{ time: string, status: string, appointment?: Appointment }[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth(); // Need doctor profile for schedule
    const [doctor, setDoctor] = useState<Doctor | null>(null);

    // Fetch Doctor Profile (Self)
    useEffect(() => {
        if (profile?.uid) {
            doctorService.getDoctorById(profile.uid).then(setDoctor);
        }
    }, [profile]);

    // Fetch slots whenever selectedDate or doctor changes
    useEffect(() => {
        if (!selectedDate || !doctor) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get appointments for the day
                const appointments = await adminService.getDailyAppointments(selectedDate);

                // 2. Generate all slots with status
                const slots = await availabilityService.getAllDaySlots(doctor, selectedDate, appointments);
                setDaySlots(slots);
            } catch (error) {
                console.error("Failed to fetch slots", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, doctor]);

    // Handle Unlock (Delete Exception)
    const handleUnlock = async () => {
        if (!selectedDate || !doctor) return;
        try {
            setLoading(true);
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            await exceptionService.deleteByDateAndDoctor(dateString, doctor.id);
            // Refresh
            const appointments = await adminService.getDailyAppointments(selectedDate);
            const slots = await availabilityService.getAllDaySlots(doctor, selectedDate, appointments);
            setDaySlots(slots);
            toast.success("Día desbloqueado correctamente");
        } catch (error) {
            toast.error("Error al desbloquear el día");
        } finally {
            setLoading(false);
        }
    };

    // Handle Block Day
    const handleBlockDay = async () => {
        if (!selectedDate || !doctor) return;
        try {
            setLoading(true);
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            await exceptionService.createException({
                date: dateString,
                doctorId: doctor.id,
                reason: "Bloqueado desde Agenda"
            });
            // Refresh
            const appointments = await adminService.getDailyAppointments(selectedDate);
            const slots = await availabilityService.getAllDaySlots(doctor, selectedDate, appointments);
            setDaySlots(slots);
            toast.success("Día bloqueado correctamente");
        } catch (error) {
            toast.error("Error al bloquear el día");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agenda Mensual</h1>
                <p className="text-muted-foreground">Gestión turnos por fecha.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Panel: Calendar Selection */}
                <div className="md:col-span-4 lg:col-span-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Seleccionar Fecha</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-4">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border shadow-sm"
                                locale={es}
                                modifiers={{
                                    occupied: (date) => {
                                        // Logic to determine if a day has appointments (black)
                                        // This requires fetching monthly availability which might be expensive.
                                        // For MVP, we stick to standard styles or implementing a light-weight monthly fetcher.
                                        return false;
                                    },
                                    blocked: (date) => {
                                        // Logic for blocked days (red/grey)
                                        return false;
                                    }
                                }}
                                modifiersStyles={{
                                    occupied: { fontWeight: 'bold', color: 'black' },
                                    blocked: { color: 'red' }
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Daily Slots */}
                <div className="md:col-span-8 lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold capitalize">
                            {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : "Seleccione Fecha"}
                        </h2>
                        <div className="flex gap-2">
                            {/* Block Button (if not blocked) */}
                            {daySlots.length > 0 && !daySlots.every(s => s.status === 'blocked') && (
                                <Button variant="secondary" onClick={handleBlockDay} disabled={loading}>
                                    <ShieldAlert className="mr-2 h-4 w-4" /> Bloquear Día
                                </Button>
                            )}

                            {/* Unlock Button if all slots are blocked */}
                            {daySlots.length > 0 && daySlots.every(s => s.status === 'blocked') && (
                                <Button variant="destructive" onClick={handleUnlock} disabled={loading}>
                                    <Unlock className="mr-2 h-4 w-4" /> Desbloquear Día
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {daySlots.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No hay horarios disponibles para este día (Día no laboral).</p>
                            ) : (
                                daySlots.map((slot, index) => (
                                    <div key={index}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-lg border transition-colors",
                                            slot.status === 'free' && "bg-white hover:bg-slate-50 cursor-pointer border-slate-200",
                                            slot.status === 'occupied' && "bg-blue-50 border-blue-200",
                                            slot.status === 'blocked' && "bg-red-50 border-red-200 opacity-70",
                                            slot.status === 'past' && "bg-slate-100 border-slate-200 text-slate-400"
                                        )}
                                        onClick={() => {
                                            if (slot.status === 'free') {
                                                // Open Manual Booking Modal
                                                // setBookingSlot(slot.time);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono font-bold text-lg">{slot.time}</span>

                                            {slot.status === 'free' && <span className="text-green-600 font-medium">Libre</span>}

                                            {slot.status === 'occupied' && (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-blue-900">{slot.appointment?.patientName}</span>
                                                    <span className="text-xs text-blue-700">{slot.appointment?.type}</span>
                                                </div>
                                            )}

                                            {slot.status === 'blocked' && <span className="text-red-600 font-medium">Bloqueado</span>}
                                            {slot.status === 'past' && <span className="text-slate-500">Pasado</span>}
                                        </div>

                                        <div>
                                            {/* Actions based on status */}
                                            {slot.status === 'free' && <Button size="sm" variant="outline">Reservar</Button>}
                                            {slot.status === 'occupied' && <Button size="sm" variant="ghost">Ver Detalles</Button>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
