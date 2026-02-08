"use client";

import Link from "next/link";
import { PatientSearch } from "@/components/doctor/PatientSearch";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { adminService } from "@/services/adminService";
import { appointmentService } from "@/services/appointments";
import { doctorService } from "@/services/doctorService";
import { availabilityService } from "@/services/availabilityService";
import { exceptionService } from "@/services/exceptionService";
import { Appointment, Doctor } from "@/types";
import { Loader2, Unlock, ShieldAlert, User, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [daySlots, setDaySlots] = useState<{ time: string, status: string, appointment?: Appointment }[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth(); // Need doctor profile for schedule
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [busyDays, setBusyDays] = useState<Set<string>>(new Set()); // Days with appointments
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // Multi-Select State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

    // Fetch Doctor Profile (Self)
    useEffect(() => {
        if (profile?.uid) {
            doctorService.getDoctorById(profile.uid).then(setDoctor);
        }
    }, [profile]);

    // Fetch busy days for the current month
    useEffect(() => {
        if (!doctor) return;
        const fetchBusyDays = async () => {
            try {
                const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

                // Fetch all appointments for the month (simplified query, filter client-side)
                const { collection, query, where, getDocs, Timestamp } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");

                const q = query(
                    collection(db, "appointments"),
                    where("doctorId", "==", doctor.id),
                    where("date", ">=", Timestamp.fromDate(startOfMonth)),
                    where("date", "<=", Timestamp.fromDate(endOfMonth))
                );

                const snapshot = await getDocs(q);
                const days = new Set<string>();
                const validStatuses = ["confirmed", "pending", "arrived", "completed"];
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const date = data.date?.toDate();
                    // Filter: real patients (not blocked) and valid status
                    if (date && data.patientId !== 'blocked' && validStatuses.includes(data.status)) {
                        days.add(format(date, 'yyyy-MM-dd'));
                    }
                });
                console.log("Busy days loaded:", days); // Debug
                setBusyDays(days);
            } catch (error) {
                console.error("Failed to fetch busy days:", error);
            }
        };
        fetchBusyDays();
    }, [doctor, currentMonth]);

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



    const [bookingSlot, setBookingSlot] = useState<string | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const handleBooking = async (patient: any) => {
        if (!selectedDate || !doctor || !bookingSlot) return;
        try {
            setLoading(true);
            const date = new Date(selectedDate);
            const [hours, minutes] = bookingSlot.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);

            // Check if we are overriding a blocked slot
            const existingBlock = daySlots.find(s => s.time === bookingSlot && s.status === 'blocked')?.appointment;

            if (existingBlock) {
                // Update existing block to be a confirmed appointment
                await appointmentService.updateAppointment(existingBlock.id, {
                    patientId: patient.uid,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    patientEmail: patient.email,
                    // doctorId and date remain same
                    status: 'confirmed',
                    type: 'Consulta',
                    notes: 'Reservado sobre Bloqueo (Agenda)'
                });
                toast.success(`Turno desbloqueado y reservado para ${patient.firstName} ${patient.lastName}`);
            } else {
                // Create new appointment
                await appointmentService.createAppointment({
                    patientId: patient.uid,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    patientEmail: patient.email,
                    doctorId: doctor.id,
                    doctorName: `${doctor.firstName} ${doctor.lastName}`,
                    date: date, // Correct Date object
                    time: bookingSlot,
                    status: 'confirmed',
                    type: 'Consulta',
                    notes: 'Reservado manualmente desde Agenda'
                } as any);
                toast.success(`Turno reservado para ${patient.firstName} ${patient.lastName}`);
            }

            // Refresh
            const appointments = await adminService.getDailyAppointments(selectedDate);
            const slots = await availabilityService.getAllDaySlots(doctor, selectedDate, appointments);
            setDaySlots(slots);
            setBookingSlot(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al reservar turno");
        } finally {
            setLoading(false);
        }
    };

    // ... existing hooks

    // Handle Block Single Slot
    const handleBlockSlot = async (time: string) => {
        if (!selectedDate || !doctor) return;
        try {
            setLoading(true);
            const date = new Date(selectedDate);
            const [hours, minutes] = time.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);

            await appointmentService.createAppointment({
                patientId: 'blocked',
                patientName: 'Bloqueado',
                patientEmail: '',
                doctorId: doctor.id,
                doctorName: `${doctor.firstName} ${doctor.lastName}`,
                date: date,
                time: time,
                type: 'Bloqueado',
                status: 'confirmed', // Confirmed but "blocked" type effectively
                notes: 'Bloqueado manualmente'
            } as any); // Type cast due to some missing fields like status that createAppointment overrides

            // Refresh
            const appointments = await adminService.getDailyAppointments(selectedDate);
            const slots = await availabilityService.getAllDaySlots(doctor, selectedDate, appointments);
            setDaySlots(slots);
            toast.success(`Horiario ${time} bloqueado.`);
        } catch (error) {
            console.error(error);
            toast.error("Error al bloquear horario");
        } finally {
            setLoading(false);
        }
    };

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

    // Handle Unblock Single Slot
    const handleUnblockSingleSlot = async (appointmentId: string) => {
        if (!selectedDate || !doctor) return;
        try {
            setLoading(true);
            await appointmentService.cancelAppointment(appointmentId);
            // Refresh
            const appointments = await adminService.getDailyAppointments(selectedDate);
            const slots = await availabilityService.getAllDaySlots(doctor, selectedDate, appointments);
            setDaySlots(slots);
            toast.success("Horario desbloqueado.");
        } catch (error) {
            console.error(error);
            toast.error("Error al desbloquear horario");
        } finally {
            setLoading(false);
        }
    };

    const toggleSlotSelection = (time: string) => {
        const newSelected = new Set(selectedSlots);
        if (newSelected.has(time)) {
            newSelected.delete(time);
        } else {
            newSelected.add(time);
        }
        setSelectedSlots(newSelected);
    };

    const handleBlockSelectedSlots = async () => {
        if (!selectedDate || !doctor || selectedSlots.size === 0) return;
        setLoading(true);
        try {
            const date = new Date(selectedDate);
            const promises = Array.from(selectedSlots).map(async (time) => {
                const [hours, minutes] = time.split(':').map(Number);
                const slotDate = new Date(date);
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
                    notes: 'Bloqueado masivamente'
                } as any);
            });

            await Promise.all(promises);

            toast.success(`${selectedSlots.size} horarios bloqueados.`);
            setIsSelectionMode(false);
            setSelectedSlots(new Set());

            // Refresh
            const appointments = await adminService.getDailyAppointments(selectedDate);
            const slots = await availabilityService.getAllDaySlots(doctor, selectedDate, appointments);
            setDaySlots(slots);
        } catch (error) {
            console.error(error);
            toast.error("Error al bloquear horarios seleccionados");
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
                                onMonthChange={setCurrentMonth}
                                className="rounded-md border shadow-sm"
                                locale={es}
                                modifiers={{
                                    hasBusy: (date) => busyDays.has(format(date, 'yyyy-MM-dd'))
                                }}
                                modifiersStyles={{
                                    hasBusy: { fontWeight: 'bold', color: '#000' }
                                }}
                                styles={{
                                    day: { color: '#9ca3af' }
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
                            {/* Selection Mode Toggle */}
                            {daySlots.length > 0 && (
                                <Button
                                    variant={isSelectionMode ? "default" : "outline"}
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        setSelectedSlots(new Set()); // Clear on toggle
                                    }}
                                >
                                    {isSelectionMode ? "Cancelar Selección" : "Selección Múltiple"}
                                </Button>
                            )}

                            {/* Bulk Block Button */}
                            {isSelectionMode && selectedSlots.size > 0 && (
                                <Button
                                    variant="destructive"
                                    onClick={handleBlockSelectedSlots}
                                    disabled={loading}
                                >
                                    <ShieldAlert className="mr-2 h-4 w-4" /> Bloquear ({selectedSlots.size})
                                </Button>
                            )}

                            {/* Block Button (if NO slots are blocked by exception) */}
                            {/* Block Button: Show if there are any free slots to block */}
                            {!isSelectionMode && daySlots.some(s => s.status === 'free') && (
                                <Button variant="secondary" onClick={handleBlockDay} disabled={loading}>
                                    <ShieldAlert className="mr-2 h-4 w-4" /> Bloquear Día
                                </Button>
                            )}

                            {/* Unlock Button: Show if any slot is blocked by Exception (no appointment object implies exception) */}
                            {!isSelectionMode && daySlots.some(s => s.status === 'blocked' && !s.appointment) && (
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
                                    <div
                                        key={index}
                                        onClick={() => {
                                            if (isSelectionMode && slot.status === 'free') {
                                                toggleSlotSelection(slot.time);
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-default",
                                            slot.status === 'free' ? "border-slate-200 bg-white" :
                                                slot.status === 'blocked' ? "border-red-200 bg-red-50" :
                                                    "border-blue-200 bg-blue-50",
                                            isSelectionMode && slot.status === 'free' && "cursor-pointer hover:bg-slate-50",
                                            isSelectionMode && selectedSlots.has(slot.time) && "ring-2 ring-primary border-primary bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            {isSelectionMode && slot.status === 'free' && (
                                                <Checkbox
                                                    checked={selectedSlots.has(slot.time)}
                                                    onCheckedChange={() => toggleSlotSelection(slot.time)}
                                                />
                                            )}
                                            <span className="text-lg font-bold w-16">{slot.time}</span>
                                            <div>
                                                {slot.status === 'free' ? (
                                                    <span className="text-green-600 font-medium">Libre</span>
                                                ) : slot.status === 'blocked' ? (
                                                    <div>
                                                        <span className="text-red-700 font-bold block">BLOQUEADO</span>
                                                        <span className="text-sm text-red-600">No disponible</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-blue-900 font-bold block">
                                                            {slot.appointment?.patientName || "Paciente"}
                                                        </span>
                                                        <span className="text-sm text-blue-600 capitalize">
                                                            {slot.appointment?.type || "Consulta"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            {/* Actions based on status */}
                                            {!isSelectionMode && slot.status === 'free' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setBookingSlot(slot.time);
                                                    }}>Reservar</Button>
                                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleBlockSlot(slot.time); }}>
                                                        <ShieldAlert className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            {!isSelectionMode && slot.status === 'blocked' && slot.appointment && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setBookingSlot(slot.time);
                                                    }}>
                                                        Reservar
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-100" onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUnblockSingleSlot(slot.appointment!.id);
                                                    }}>
                                                        <Unlock className="h-4 w-4 mr-2" /> Desbloquear
                                                    </Button>
                                                </div>
                                            )}
                                            {!isSelectionMode && (slot.status === 'occupied') && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (slot.appointment) setSelectedAppointment(slot.appointment);
                                                    }}>
                                                        Ver Detalles
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!confirm("¿Está seguro que desea eliminar este turno?")) return;
                                                        if (slot.appointment) {
                                                            await handleUnblockSingleSlot(slot.appointment.id); // Reusing cancel logic
                                                            toast.success("Turno eliminado");
                                                        }
                                                    }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Dialog */}
            <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalles del Turno</DialogTitle>
                        <DialogDescription>Información completa de la cita</DialogDescription>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Paciente</Label>
                                    <p className="text-lg font-medium">{selectedAppointment.patientName}</p>
                                </div>
                                <div>
                                    <Label>Hora</Label>
                                    <p className="text-lg font-medium">{selectedAppointment.time}</p>
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <p className="text-sm text-muted-foreground">{selectedAppointment.patientEmail}</p>
                                </div>
                                <div>
                                    <Label>Estado</Label>
                                    <p className="text-sm capitalize">{selectedAppointment.status}</p>
                                </div>
                            </div>

                            {selectedAppointment.medicalNotes && (
                                <div>
                                    <Label>Notas Médicas</Label>
                                    <p className="text-sm bg-slate-50 p-2 rounded">{selectedAppointment.medicalNotes}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <Link href={`/doctor/patients/${selectedAppointment.patientId}`} passHref>
                                    <Button variant="outline" className="gap-2">
                                        <User className="h-4 w-4" /> Ver Perfil
                                    </Button>
                                </Link>
                                {(selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'pending') && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            onClick={async () => {
                                                try {
                                                    await appointmentService.updateAppointment(selectedAppointment.id, { status: 'absent' });
                                                    toast.success("Marcado como Ausente");
                                                    setSelectedAppointment(null);
                                                    // Trigger refresh if possible, or user will refresh main list manually. 
                                                    // Ideally we should trigger the fetch data effect.
                                                    // For now, we rely on the user closing the dialog and the UI updating on next fetch or we force it?
                                                    // Let's force a reload of the day keys or just close. 
                                                    // To properly refresh, we need to lift state or expose the fetch function.
                                                    // A simple workaround is to just close and let the user see it updated next time or manually refresh types?
                                                    // actually, we should trigger a refresh.
                                                    // The simplest way without refactoring everything is to just close, 
                                                    // but to be nice let's try to update the local list if we can?
                                                    // We can't easily access setDaySlots here without more code.
                                                    // We will assume the user interacts and updates naturally, or we can trigger a window reload (bad).
                                                    // Let's just close for now.
                                                    window.location.reload(); // Quick fix to ensure UI updates, or we can just hope real-time listener? No real-time.
                                                } catch (e) { toast.error("Error al actualizar"); }
                                            }}
                                        >
                                            Ausente
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={async () => {
                                                try {
                                                    await appointmentService.updateAppointment(selectedAppointment.id, { status: 'completed' });
                                                    toast.success("Marcado como Asistió");
                                                    setSelectedAppointment(null);
                                                    window.location.reload();
                                                } catch (e) { toast.error("Error al actualizar"); }
                                            }}
                                        >
                                            Asistió
                                        </Button>
                                    </>
                                )}
                                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Manual Booking Dialog */}
            <Dialog open={!!bookingSlot} onOpenChange={(open) => !open && setBookingSlot(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reservar Turno: {bookingSlot}</DialogTitle>
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


