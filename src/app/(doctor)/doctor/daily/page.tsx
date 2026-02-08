"use client";

import { useState, useEffect } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Clock, User, ShieldAlert, Phone, Mail, FileText } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/adminService";
import { availabilityService } from "@/services/availabilityService";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";

export default function DailyAgendaPage() {
    const { user, profile } = useAuth();
    // Default to Tomorrow
    const [date, setDate] = useState<Date>(addDays(new Date(), 1));
    const [slots, setSlots] = useState<{ time: string; status: 'free' | 'occupied' | 'blocked' | 'past'; appointment?: Appointment }[]>([]);
    const [loading, setLoading] = useState(true);

    const [doctor, setDoctor] = useState<any>(null); // To store full doctor object

    // Fetch Doctor Info once
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

    // Fetch Slots when date or doctor changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!doctor) return;
            setLoading(true);
            try {
                // Get appointments for the day to pass to availability service
                const appointments = await adminService.getDailyAppointments(date);
                // Filter for this doctor (adminService returns all if we don't filter? No, getDailyAppointments might return all. 
                // availabilityService.getAllDaySlots takes appointments. 
                // Ideally we should filter by doctorId properly.
                const myAppointments = appointments.filter(a => a.doctorId === doctor.id);

                const dailySlots = await availabilityService.getAllDaySlots(doctor, date, myAppointments);
                setSlots(dailySlots);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar la agenda");
            } finally {
                setLoading(false);
            }
        };

        if (doctor) {
            fetchSlots();
        }
    }, [date, doctor]);

    const handlePrevDay = () => setDate(addDays(date, -1));
    const handleNextDay = () => setDate(addDays(date, 1));

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
                    {slots.map((slot, index) => (
                        <Card key={index} className={cn(
                            "transition-colors",
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
                                        {/* Mobile Status Badge */}
                                        <StatusBadge status={slot.status} />
                                    </div>
                                </div>

                                <div className="flex-grow">
                                    {slot.status === 'occupied' && slot.appointment && (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">{slot.appointment.patientName}</span>
                                                <Link href={`/doctor/patients/${slot.appointment.patientId}`}>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                                        <User className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {slot.appointment.patientPhone || '-'}</span>
                                                {slot.appointment.insurance && (
                                                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {slot.appointment.insurance}</span>
                                                )}
                                            </div>
                                            {slot.appointment.medicalNotes && (
                                                <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block mt-1">
                                                    Nota: {slot.appointment.medicalNotes}
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

                                <div className="hidden sm:flex items-center gap-3">
                                    <StatusBadge status={slot.status} />

                                    {slot.status === 'occupied' && (
                                        <Link href={`/doctor/appointments?date=${format(date, 'yyyy-MM-dd')}`}>
                                            <Button variant="outline" size="sm">Ver en Mensual</Button>
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'occupied') return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Ocupado</Badge>;
    if (status === 'blocked') return <Badge variant="destructive">BLOQUEADO</Badge>;
    if (status === 'free') return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Libre</Badge>;
    return <Badge variant="secondary">Pasado</Badge>;
}
