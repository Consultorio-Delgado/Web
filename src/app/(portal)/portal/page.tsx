"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Appointment } from "@/types";
import { appointmentService } from "@/services/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentCard } from "@/components/portal/AppointmentCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PortalDashboard() {
    const { user, profile, loading } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppts, setLoadingAppts] = useState(true);

    const fetchAppts = useCallback(async () => {
        if (user) {
            setLoadingAppts(true);
            try {
                const data = await appointmentService.getMyAppointments(user.uid);
                setAppointments(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingAppts(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchAppts();
    }, [fetchAppts]);

    const getInitials = (first?: string, last?: string) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "U";
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

    const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed');
    const pastAppts = appointments.filter(a => !(new Date(a.date) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed'));

    return (
        <div className="container py-10 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                            {getInitials(profile?.firstName, profile?.lastName)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hola, {profile?.firstName || 'Paciente'}</h1>
                        <p className="text-slate-500">Bienvenido a tu portal de salud.</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link href="/portal/profile" className="flex-1 md:flex-none">
                        <Button variant="outline" size="lg" className="w-full">
                            Mi Perfil
                        </Button>
                    </Link>
                    <Link href="/portal/new-appointment" className="flex-1 md:flex-none">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full shadow-md hover:shadow-lg transition-all">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Turno
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="space-y-8">
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-semibold">Mis Próximos Turnos</h2>
                    </div>

                    {loadingAppts ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-xl"></div>)}
                        </div>
                    ) : upcomingAppts.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingAppts.map(appt => (
                                <AppointmentCard
                                    key={appt.id}
                                    appointment={appt}
                                    onStatusChange={fetchAppts}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-slate-50 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                <p className="text-muted-foreground mb-4">No tienes turnos programados próximamente.</p>
                                <Link href="/portal/new-appointment">
                                    <Button variant="link" className="text-blue-600">Reservar un turno ahora <ArrowRight className="ml-1 h-4 w-4" /></Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </section>

                {pastAppts.length > 0 && (
                    <section className="pt-8 border-t">
                        <h2 className="text-lg font-semibold mb-4 text-slate-600">Historial y Cancelados</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
                            {pastAppts.map(appt => (
                                <AppointmentCard
                                    key={appt.id}
                                    appointment={appt}
                                    onStatusChange={fetchAppts}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
