"use client";

import { adminService } from "@/services/adminService";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Activity, AlertCircle } from "lucide-react";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        adminService.getDashboardStats().then(setStats);
    }, []);

    if (!stats) return <div>Cargando dashboard...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Tablero Principal</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                        <p className="text-xs text-muted-foreground">
                            +20% desde ayer
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doctores Activos</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeDoctors}</div>
                        <p className="text-xs text-muted-foreground">
                            En consultorio ahora
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes Nuevos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.newPatients}</div>
                        <p className="text-xs text-muted-foreground">
                            Este mes
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingConfirmations}</div>
                        <p className="text-xs text-muted-foreground">
                            Requieren atención
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <DashboardMetrics />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity Card ... */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Juan Pérez reservó turno</p>
                                    <p className="text-sm text-muted-foreground">Hace 2 minutos</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Dra. Secondi finalizó consulta</p>
                                    <p className="text-sm text-muted-foreground">Hace 15 minutos</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
