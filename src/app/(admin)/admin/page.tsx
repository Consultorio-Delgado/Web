"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Activity, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { Appointment } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminDashboard() {
    const { profile, loading } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

    useEffect(() => {
        adminService.getDashboardStats().then(setStats);
        adminService.getDailyAppointments(new Date()).then(data => {
            setTodayAppts(data.slice(0, 5)); // Show only first 5
        });
    }, []);

    if (loading || !stats) return <div className="p-8">Cargando dashboard...</div>;

    if (profile?.role === 'patient') {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
                <p>No tienes permisos para ver esta página.</p>
                <Link href="/portal"><Button className="mt-4">Ir a mi Portal</Button></Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Panel Médico / Admin</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                        <p className="text-xs text-muted-foreground">Programados para hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingConfirmations}</div>
                        <p className="text-xs text-muted-foreground">Requieren confirmación</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doctores Activos</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeDoctors}</div>
                        <p className="text-xs text-muted-foreground">En consultorio</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nuevos Pacientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.newPatients}</div>
                        <p className="text-xs text-muted-foreground">Este mes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Appointments Table */}
            <Card className="col-span-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Próximos Turnos (Hoy)</CardTitle>
                        <Link href="/admin/appointments">
                            <Button variant="ghost" size="sm">Ver Agenda Completa <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {todayAppts.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay turnos para hoy aún.</p>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-3">Hora</th>
                                            <th className="p-3">Paciente</th>
                                            <th className="p-3">Doctor</th>
                                            <th className="p-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {todayAppts.map((appt) => (
                                            <tr key={appt.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-semibold">{appt.time}</td>
                                                <td className="p-3">{appt.patientName}</td>
                                                <td className="p-3 capitalize">{appt.doctorId}</td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                                        ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                            appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {appt.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
