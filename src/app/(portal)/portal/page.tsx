"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Appointment } from "@/types";
import { appointmentService } from "@/services/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PortalDashboard() {
    const { user, profile, loading } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppts, setLoadingAppts] = useState(true);

    useEffect(() => {
        async function fetchAppts() {
            if (user) {
                const data = await appointmentService.getMyAppointments(user.uid);
                setAppointments(data);
                setLoadingAppts(false);
            }
        }
        fetchAppts();
    }, [user]);

    if (loading) return <div className="p-8">Cargando perfil...</div>;

    const upcomingAppt = appointments.find(a => new Date(a.date) >= new Date());

    return (
        <div className="container py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hola, {profile?.firstName || 'Paciente'}</h1>
                    <p className="text-muted-foreground">Bienvenido a tu portal de salud.</p>
                </div>
                <Link href="/portal/new-appointment">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Turno
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximo Turno Card */}
                <Card className={`border-l-4 ${upcomingAppt ? 'border-l-blue-500' : 'border-l-slate-200'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximo Turno</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loadingAppts ? (
                            <div className="h-8 bg-slate-100 animate-pulse rounded"></div>
                        ) : upcomingAppt ? (
                            <div>
                                <div className="text-2xl font-bold text-blue-700">
                                    {format(new Date(upcomingAppt.date), "d MMM", { locale: es })}
                                </div>
                                <p className="font-semibold text-lg">{upcomingAppt.time} hs</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Con Dr/a. {upcomingAppt.doctorId === 'capparelli' ? 'Capparelli' : 'Secondi'} {/* Idealmente hacer un lookup */}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">Sin reservas</div>
                                <p className="text-xs text-muted-foreground">
                                    No tienes turnos futuros.
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Historial Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Historial</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Turnos totales registrados.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Mis Turnos Recientes</h2>
                <Card>
                    <CardContent className="p-0">
                        {loadingAppts ? (
                            <div className="p-8 text-center text-muted-foreground">Cargando turnos...</div>
                        ) : appointments.length > 0 ? (
                            <div className="divide-y">
                                {appointments.map(appt => (
                                    <div key={appt.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                        <div>
                                            <p className="font-medium">Consulta Médica</p>
                                            <p className="text-sm text-slate-500">
                                                {format(new Date(appt.date), "PPPP", { locale: es })} - {appt.time} hs
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm">Ver Detalles <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground">
                                No hay actividad reciente.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
