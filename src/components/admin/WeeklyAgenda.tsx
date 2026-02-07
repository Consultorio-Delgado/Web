"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isSameDay, parse, addMinutes, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Appointment, Doctor } from "@/types";
import { adminService } from "@/services/adminService";
import { doctorService } from "@/services/doctorService";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function WeeklyAgenda() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);

    // Load doctors
    useEffect(() => {
        doctorService.getAllDoctors().then(setDoctors);
    }, []);

    // Fetch appointments when date or filter changes
    useEffect(() => {
        const fetchAgenda = async () => {
            setLoading(true);
            const start = startOfWeek(currentDate, { locale: es });
            const end = endOfWeek(currentDate, { locale: es });

            const data = await adminService.getAppointmentsByRange(start, end, selectedDoctor === 'all' ? undefined : selectedDoctor);
            setAppointments(data);
            setLoading(false);
        };

        fetchAgenda();
    }, [currentDate, selectedDoctor]);

    // Calendar Helpers
    const weekStart = startOfWeek(currentDate, { locale: es });
    const weekDays = eachDayOfInterval({
        start: weekStart,
        end: addDays(weekStart, 6) // Mon - Sun
    });

    const timeSlots = [];
    for (let i = 8; i <= 20; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }

    const handlePrevWeek = () => setCurrentDate(subDays(currentDate, 7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    return (
        <div className="space-y-6">
            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="text-lg font-semibold w-48 text-center">
                        {format(weekStart, "MMMM yyyy", { locale: es })}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
                </div>

                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Doctores</SelectItem>
                        {doctors.map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>
                                Dr. {doc.lastName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Weekly Grid */}
            <div className="bg-white rounded-lg shadow overflow-x-auto min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b text-center py-2 bg-slate-50">
                    <div className="p-2 text-xs font-medium text-slate-500 uppercase">Hora</div>
                    {weekDays.map(day => (
                        <div key={day.toString()} className={`p-2 text-sm font-medium ${isSameDay(day, new Date()) ? 'text-blue-600 bg-blue-50 rounded' : ''}`}>
                            <div>{format(day, "EEE", { locale: es })}</div>
                            <div className="text-lg">{format(day, "d")}</div>
                        </div>
                    ))}
                </div>

                {/* Time Rows */}
                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {timeSlots.map(time => (
                        <div key={time} className="grid grid-cols-8 border-b min-h-[40px] hover:bg-slate-50 transition-colors">
                            {/* Time Label */}
                            <div className="p-2 text-xs text-slate-400 border-r text-center -mt-2">
                                {time}
                            </div>

                            {/* Days Columns */}
                            {weekDays.map(day => {
                                // Find appointments in this slot
                                const slotAppts = appointments.filter(appt =>
                                    isSameDay(new Date(appt.date), day) && appt.time === time
                                );

                                return (
                                    <div key={day.toString() + time} className="border-r p-1 relative">
                                        {slotAppts.map(appt => (
                                            <Dialog key={appt.id}>
                                                <DialogTrigger asChild>
                                                    <div className={`p-2 rounded text-xs cursor-pointer shadow-sm hover:scale-105 transition-transform truncate
                                                    ${appt.doctorId === 'capparelli' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-pink-100 text-pink-800 border-pink-200'}
                                                    border border-l-4
                                                `}>
                                                        <span className="font-bold">{appt.time}</span> {appt.patientName}
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Detalles del Turno</DialogTitle>
                                                        <DialogDescription>
                                                            ID: {appt.id}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground block">Paciente</span>
                                                                <span className="font-medium">{appt.patientName}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block">Email</span>
                                                                <span className="font-medium">{appt.patientEmail}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block">Doctor</span>
                                                                <span className="font-medium capitalize">{appt.doctorId}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block">Estado</span>
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    {appt.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" className="text-red-600 hover:bg-red-50">Cancelar Turno</Button>
                                                        <Button>Marcar Asistencia</Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
