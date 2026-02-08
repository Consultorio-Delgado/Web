"use client";

import { adminService } from "@/services/adminService";
import { auditService } from "@/services/auditService";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Activity, Eye, EyeOff, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [statsData, logsData] = await Promise.all([
                    adminService.getExtendedStats(),
                    auditService.getRecentLogs(5)
                ]);
                setStats(statsData);
                setLogs(logsData);
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    if (loading || !stats) return <div className="flex min-h-screen items-center justify-center">Cargando tablero...</div>;

    const { kpi, charts, nextAppointments } = stats;

    return (
        <div className="space-y-8 p-1">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Tablero Principal</h1>
                    <p className="text-muted-foreground">Resumen estratégico de su consultorio.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPrivacyMode(!privacyMode)}>
                    {privacyMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {privacyMode ? "Modo Privado: ON" : "Modo Privado: OFF"}
                </Button>
            </div>

            {/* KPI Pulse Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnos Mensuales</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.totalAppointments}</div>
                        <p className={cn("text-xs", kpi.growth >= 0 ? "text-green-600" : "text-red-600")}>
                            {kpi.growth >= 0 ? "+" : ""}{kpi.growth}% vs mes pasado
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes Únicos</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.uniquePatients}</div>
                        <p className="text-xs text-muted-foreground">
                            Atendidos este mes
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Asistencia</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.attendanceRate}%</div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 dark:bg-slate-800">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${kpi.attendanceRate}%` }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <Activity className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.pending}</div>
                        <p className="text-xs text-muted-foreground">
                            Requieren confirmación
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Deep Analysis Charts */}
            <DashboardCharts data={charts} nextAppointments={nextAppointments} privacyMode={privacyMode} />

            {/* Recent Activity Sidebar (Merged into main view for now as requested UI blocks) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>Últimos movimientos del sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className={cn(
                                            "font-bold text-xs",
                                            log.action.includes('CANCELLED') ? "bg-red-100 text-red-600" :
                                                log.action.includes('CONFIRMED') ? "bg-blue-100 text-blue-600" :
                                                    "bg-slate-100 text-slate-600"
                                        )}>
                                            {log.action.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-none">
                                            {log.action === 'APPOINTMENT_CREATED' ? 'Turno Reservado' :
                                                log.action === 'APPOINTMENT_CANCELLED' ? 'Turno Cancelado' :
                                                    log.action === 'MEDICAL_NOTE_ADDED' ? 'Evolución Médica' :
                                                        log.action === 'PATIENT_FILE_UPLOADED' ? 'Archivo Adjunto' :
                                                            log.action.replace(/_/g, ' ')}
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <p className={cn("text-xs text-muted-foreground", privacyMode && "blur-sm")}>
                                                {log.metadata?.patientName ? `Paciente: ${log.metadata.patientName}` : `ID: ${log.performedBy}`}
                                            </p>
                                            {log.metadata?.doctorName && (
                                                <p className="text-xs text-muted-foreground">
                                                    Dr: {log.metadata.doctorName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
