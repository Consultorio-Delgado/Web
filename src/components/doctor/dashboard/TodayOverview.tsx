"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Appointment } from "@/types";
import { DashboardScope } from "@/types/dashboard";
import { useRealtimeAppointments } from "@/hooks/useRealtimeAppointments";
import { filterAppointmentsByScope } from "@/services/dashboardService";
import {
    computeWaitingSeconds,
    computeConsultationSeconds,
    formatDuration,
} from "@/lib/appointmentTiming";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Stethoscope, Timer, ArrowRight, CalendarPlus } from "lucide-react";

function LoadingBlock({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

interface TodayOverviewProps {
    scope: DashboardScope;
    doctorId?: string;
}

function MiniTiming({ appt }: { appt: Appointment }) {
    const [, setTick] = useState(0);
    const isLive = appt.status === "arrived" || appt.status === "in_consultation";

    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, [isLive]);

    const now = new Date();
    const waiting = computeWaitingSeconds(appt, now);
    const consultation = computeConsultationSeconds(appt, now);

    if (appt.status === "arrived") {
        return (
            <span className="flex items-center gap-1 text-xs text-amber-700 font-mono">
                <Timer className="h-3 w-3" />
                {formatDuration(waiting)}
            </span>
        );
    }
    if (appt.status === "in_consultation") {
        return (
            <span className="flex items-center gap-1 text-xs text-blue-700 font-mono">
                <Stethoscope className="h-3 w-3" />
                {formatDuration(consultation)}
            </span>
        );
    }
    return null;
}

export function TodayOverview({ scope, doctorId }: TodayOverviewProps) {
    const today = useMemo(() => new Date(), []);
    const { appointments, loading } = useRealtimeAppointments(today);

    const filtered = useMemo(
        () =>
            filterAppointmentsByScope(appointments, scope, doctorId).filter(
                (a) => a.status !== "cancelled" && a.patientId !== "blocked"
            ),
        [appointments, scope, doctorId]
    );

    const stats = useMemo(() => {
        const active = filtered.filter((a) => !["absent"].includes(a.status));
        const completed = active.filter((a) => a.status === "completed").length;
        const waiting = active.filter((a) => a.status === "arrived");
        const inConsultation = active.filter((a) => a.status === "in_consultation");
        const pending = active.filter((a) => a.status === "pending");
        const remaining = active.filter((a) =>
            ["pending", "confirmed", "arrived", "in_consultation"].includes(a.status)
        ).length;

        const now = new Date();
        const upcoming = active
            .filter((a) => {
                const [h, m] = a.time.split(":").map(Number);
                const slotTime = new Date(today);
                slotTime.setHours(h, m, 0, 0);
                return slotTime > now && ["pending", "confirmed"].includes(a.status);
            })
            .sort((a, b) => a.time.localeCompare(b.time))[0];

        return {
            total: active.length,
            completed,
            remaining,
            waiting,
            inConsultation,
            pending,
            upcoming,
        };
    }, [filtered, today]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <LoadingBlock className="h-6 w-32" />
                    <LoadingBlock className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <LoadingBlock className="h-16 w-full" />
                    <LoadingBlock className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Hoy
                    </CardTitle>
                    <CardDescription>
                        {format(today, "EEEE d 'de' MMMM", { locale: es })}
                    </CardDescription>
                </div>
                <Button size="sm" asChild>
                    <Link href="/doctor/daily">
                        Ir a Agenda Diaria
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                        <p className="text-xs text-muted-foreground">Turnos</p>
                        <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                        <p className="text-xs text-muted-foreground">Completados</p>
                        <p className="text-xl font-bold text-green-700">{stats.completed}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                        <p className="text-xs text-muted-foreground">Restantes</p>
                        <p className="text-xl font-bold text-blue-700">{stats.remaining}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                        <p className="text-xs text-muted-foreground">En espera</p>
                        <p className="text-xl font-bold text-amber-700">{stats.waiting.length}</p>
                    </div>
                </div>

                {stats.inConsultation.length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                        <p className="text-xs font-medium text-blue-800 mb-2">En consultorio</p>
                        {stats.inConsultation.map((appt) => (
                            <div key={appt.id} className="flex items-center justify-between">
                                <Link
                                    href={`/doctor/patients/${appt.patientId}`}
                                    className="text-sm font-medium hover:underline"
                                >
                                    {appt.patientName}
                                </Link>
                                <MiniTiming appt={appt} />
                            </div>
                        ))}
                    </div>
                )}

                {stats.waiting.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                        <p className="text-xs font-medium text-amber-800 mb-2">Sala de espera</p>
                        <div className="space-y-2">
                            {stats.waiting.map((appt) => (
                                <div key={appt.id} className="flex items-center justify-between">
                                    <Link
                                        href={`/doctor/patients/${appt.patientId}`}
                                        className="text-sm font-medium hover:underline"
                                    >
                                        {appt.patientName}
                                    </Link>
                                    <MiniTiming appt={appt} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {stats.upcoming && (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Próximo turno</p>
                            <p className={cn("font-medium")}>
                                {stats.upcoming.patientName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {stats.upcoming.time}
                                {(() => {
                                    const [h, m] = stats.upcoming!.time.split(":").map(Number);
                                    const slotTime = new Date(today);
                                    slotTime.setHours(h, m, 0, 0);
                                    const mins = differenceInMinutes(slotTime, new Date());
                                    if (mins > 0) return ` · en ${mins} min`;
                                    return "";
                                })()}
                            </p>
                        </div>
                        {stats.upcoming.isFirstVisit && (
                            <Badge variant="outline">Nuevo</Badge>
                        )}
                    </div>
                )}

                {stats.pending.length > 0 && (
                    <p className="text-sm text-amber-700">
                        {stats.pending.length} turno(s) pendiente(s) de confirmación hoy
                    </p>
                )}

                {stats.total === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                        <CalendarPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay turnos programados para hoy</p>
                        <Button variant="link" size="sm" asChild className="mt-1">
                            <Link href="/doctor/appointments">Abrir agenda mensual</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
