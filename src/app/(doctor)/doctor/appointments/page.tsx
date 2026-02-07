"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminAppointmentsTable } from "@/components/admin/AdminAppointmentsTable";
import { adminService } from "@/services/adminService";
import { Appointment } from "@/types";
import { Loader2 } from "lucide-react";

export default function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch appointments whenever selectedDate changes
    useEffect(() => {
        if (!selectedDate) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await adminService.getDailyAppointments(selectedDate);
                setAppointments(data);
            } catch (error) {
                console.error("Failed to fetch appointments", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate]);

    // Re-fetch function to pass to the table (for updates)
    const handleUpdate = () => {
        if (selectedDate) {
            adminService.getDailyAppointments(selectedDate).then(setAppointments);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agenda Médica</h1>
                <p className="text-muted-foreground">Gestión turnos por fecha.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Panel: Calendar Selection */}
                <div className="md:col-span-4 lg:col-span-3">
                    <Card>
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
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Results Table */}
                <div className="md:col-span-8 lg:col-span-9 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            {selectedDate ? (
                                <>Agenda del <span className="text-blue-600 capitalize">{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</span></>
                            ) : (
                                "Seleccione una fecha"
                            )}
                        </h2>
                        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center border rounded-lg bg-slate-50">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Cargando turnos...</p>
                        </div>
                    ) : (
                        <AdminAppointmentsTable
                            initialAppointments={appointments}
                            onUpdate={handleUpdate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
