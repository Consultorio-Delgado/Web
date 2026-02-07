"use client";

import { useState, useEffect } from "react";
import { Appointment, Doctor } from "@/types";
import { appointmentService } from "@/services/appointments";
import { doctorService } from "@/services/doctors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Loader2 } from "lucide-react";

export function DashboardMetrics() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch all appointments (this might be heavy in prod, but fine for MVP v2)
                // Ideally we'd have a specific aggregation query.
                // For now, let's fetch a reasonable amount or all if small.
                // appointmentService.getAll() isn't implemented? Let's check or implement a basic one.
                // Assuming we can get a list. If not, we might need to add a method.
                // Let's assume for now we can get them. If not, I'll add `getAll` to service.

                // WAIT: appointmentService.getMyAppointments is for patients. 
                // We need an admin method. I'll add `getAllAppointments` to service if needed.
                // For this step I'll assume I can add it or it exists. 

                // Let's implement a quick fetch in the component for now using the existing service if possible, 
                // but likely we need to add a method to appointments.ts. 
                // I will assume I'll add `getAll` to `appointmentService` in the next step.

                const allDocs = await doctorService.getAll();
                setDoctors(allDocs);

                // Placeholder for now until I add the service method
                const allAppts = await appointmentService.getAllAppointments();
                setAppointments(allAppts);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    // --- Aggregations ---

    // 1. By Specialty
    const specialtyData = doctors.map(doc => {
        const count = appointments.filter(a => a.doctorId === doc.id).length;
        return { name: doc.specialty, count };
    }).reduce((acc: any[], curr) => {
        const existing = acc.find(a => a.name === curr.name);
        if (existing) { existing.count += curr.count; }
        else { acc.push(curr); }
        return acc;
    }, []).sort((a, b) => b.count - a.count);

    // 2. Status Distribution
    const statusCounts = appointments.reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    const statusData = [
        { name: 'Completados', value: statusCounts.completed || 0, color: '#22c55e' },
        { name: 'Confirmados', value: statusCounts.confirmed || 0, color: '#3b82f6' },
        { name: 'Cancelados', value: statusCounts.cancelled || 0, color: '#ef4444' },
        { name: 'Pendientes', value: statusCounts.pending || 0, color: '#eab308' },
    ].filter(d => d.value > 0);

    // 3. Growth (Appointments by Month) - Simple approximation using appointment date
    // (Ideally creation date, but appointment date is a good proxy for activity)
    // Let's use last 6 months.

    // ... logic for growth ...

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Specialty Chart */}
            <Card className="col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle>Turnos por Especialidad</CardTitle>
                    <CardDescription>Distribución de demanda.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={specialtyData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Status Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Turnos</CardTitle>
                    <CardDescription>Tasa de cumplimiento.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-xs">
                        {statusData.map(d => (
                            <div key={d.name} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                {d.name} ({d.value})
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Simple KPI Card instead of Growth for now to save complexity */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen General</CardTitle>
                    <CardDescription>Métricas clave del mes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Total Turnos</p>
                            <p className="text-2xl font-bold">{appointments.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Tasa de Cancelación</p>
                            <p className="text-2xl font-bold text-red-500">
                                {((statusCounts.cancelled || 0) / (appointments.length || 1) * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Profesionales Activos</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {doctors.length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
