"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, PlusCircle, ArrowRight, Video, Microscope } from "lucide-react";


import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Appointment, Doctor } from "@/types";
import { appointmentService } from "@/services/appointments";
import { doctorService } from "@/services/doctorService";
import { isDoctorOnVacation, getVacationEndFormatted, getDoctorTitle } from "@/lib/vacationUtils";
import { format } from "date-fns";


import { es } from "date-fns/locale";
import { AppointmentCard } from "@/components/portal/AppointmentCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function PortalDashboard() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    // Redirect Doctors/Admins to their dashboard if they land here
    useEffect(() => {
        if (!loading && profile && (profile.role === 'doctor' || profile.role === 'admin')) {
            router.push('/doctor/daily');
        }
    }, [profile, loading, router]);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppts, setLoadingAppts] = useState(true);
    const [doctorsMap, setDoctorsMap] = useState<Record<string, string>>({});
    const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const doctors = await doctorService.getAllDoctors();
                const map: Record<string, string> = {};
                doctors.forEach(d => {
                    map[d.id] = d.specialty;
                });
                setDoctorsMap(map);
                setDoctorsList(doctors);
            } catch (error) {
                console.error("Error fetching doctors for specialties:", error);
            }
        };
        fetchDoctors();
    }, []);

    const fetchAppts = useCallback(async () => {
        if (user?.uid) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    useEffect(() => {
        fetchAppts();
    }, [fetchAppts]);

    const getInitials = (first?: string, last?: string) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "U";
    };

    // Only show full-page spinner on genuine initial load (no user data yet).
    // If we already have user data and loading flips briefly (token refresh), 
    // keep the page rendered to avoid destroying DOM (which cancels navigations).
    if (loading && !user && !profile) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

    const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed');
    const pastAppts = appointments.filter(a => !(new Date(a.date) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed'));

    return (
        <div className="container py-10 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-medium text-slate-900 mb-1">Hola, {profile?.firstName || user?.displayName?.split(' ')[0] || 'Paciente'}</h1>
                        <p className="text-slate-500 font-light">Bienvenido a tu portal de salud.</p>
                    </div>
                </div>
                <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
                    <Link href="/portal/virtual-consultation" className="block w-full md:w-auto" prefetch={false}>
                        <Button variant="outline" size="lg" className="w-full md:w-auto h-12 px-8 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium transition-transform hover:scale-105">
                            <Video className="mr-2 h-5 w-5" />
                            Consulta Virtual
                        </Button>
                    </Link>
                    <Link href="/portal/prescriptions" className="block w-full md:w-auto" prefetch={false}>
                        <Button variant="outline" size="lg" className="w-full md:w-auto h-12 px-8 rounded-full border-primary text-primary hover:bg-primary/5 font-medium transition-transform hover:scale-105">
                            Solicitar Receta
                        </Button>
                    </Link>
                    <Link href="/portal/studies" className="block w-full md:w-auto" prefetch={false}>
                        <Button variant="outline" size="lg" className="w-full md:w-auto h-12 px-8 rounded-full border-purple-600 text-purple-600 hover:bg-purple-50 font-medium transition-transform hover:scale-105">
                            <Microscope className="mr-2 h-5 w-5" />
                            Solicitar Estudios
                        </Button>
                    </Link>
                    <Link href="/portal/new-appointment" className="block w-full md:w-auto" prefetch={false}>
                        <Button size="lg" className="w-full md:w-auto h-12 px-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-cyan-900/10 text-white font-medium transition-transform hover:scale-105">
                            Solicitar Nuevo Turno
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="space-y-12">
                {/* Vacation Banners */}
                {doctorsList.filter(isDoctorOnVacation).length > 0 && (
                    <div className="space-y-3">
                        {doctorsList.filter(isDoctorOnVacation).map(doc => (
                            <div key={doc.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                <span className="text-2xl">🌴</span>
                                <p className="text-amber-800 font-medium">
                                    {getDoctorTitle(doc)} {doc.lastName} está de vacaciones hasta el {getVacationEndFormatted(doc)}. No se pueden enviar recetas, consultas virtuales ni estudios.
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <section>
                    <h2 className="text-xl font-medium text-slate-900 mb-6">Próximos Turnos</h2>

                    {loadingAppts ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2].map(i => <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[2rem]"></div>)}
                        </div>
                    ) : upcomingAppts.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingAppts.map(appt => (
                                <AppointmentCard
                                    key={appt.id}
                                    appointment={appt}
                                    onStatusChange={fetchAppts}
                                    doctorSpecialty={doctorsMap[appt.doctorId]}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center">
                            <CalendarDays className="h-12 w-12 text-slate-200 mb-4" />
                            <p className="text-lg text-slate-500 font-light mb-6">No tienes turnos próximos.</p>
                            <Link href="/portal/new-appointment">
                                <Button className="rounded-full px-8 bg-primary text-white hover:bg-primary/90">
                                    Solicitar Nuevo Turno
                                </Button>
                            </Link>
                        </div>
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
                                    doctorSpecialty={doctorsMap[appt.doctorId]}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
