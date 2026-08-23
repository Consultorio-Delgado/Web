"use client";

import Link from "next/link";
import { MonthlyKpi, TimingSummary } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar,
    UserX,
    UserPlus,
    Timer,
    Stethoscope,
    MapPin,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiGridProps {
    kpi: MonthlyKpi;
    timing: TimingSummary;
}

type KpiItem = {
    title: string;
    value: string | number;
    subtitle?: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    borderColor: string;
    iconColor: string;
    subtitleClassName?: string;
};

function TrendBadge({
    current,
    previous,
    invert,
}: {
    current: number;
    previous?: number;
    invert?: boolean;
}) {
    if (previous === undefined || previous === 0) return null;
    const diff = current - previous;
    if (diff === 0) return null;
    const improved = invert ? diff < 0 : diff > 0;
    return (
        <span
            className={cn(
                "text-xs flex items-center gap-0.5",
                improved ? "text-green-600" : "text-orange-600"
            )}
        >
            {improved ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {Math.abs(diff)} min vs mes ant.
        </span>
    );
}

export function KpiGrid({ kpi, timing }: KpiGridProps) {
    const items: KpiItem[] = [
        {
            title: "Puntualidad",
            value: timing.count > 0 ? `${timing.earlyPct}%` : "—",
            subtitle:
                timing.count > 0
                    ? `Temprano/puntual · ${timing.latePct}% tarde (${timing.count} turnos)`
                    : "Sin datos este mes",
            icon: MapPin,
            href: "/doctor/stats",
            borderColor: "border-l-emerald-500",
            iconColor: "text-emerald-600",
        },
        {
            title: "Espera mediana",
            value: timing.count > 0 ? `${timing.avgWaitingMinutes} min` : "—",
            subtitle: (
                <TrendBadge
                    current={timing.avgWaitingMinutes}
                    previous={timing.prevMonthAvgWaitingMinutes}
                    invert
                />
            ),
            icon: Timer,
            href: "/doctor/stats",
            borderColor: "border-l-amber-500",
            iconColor: "text-amber-600",
        },
        {
            title: "Atención mediana",
            value: timing.count > 0 ? `${timing.avgConsultationMinutes} min` : "—",
            subtitle: (
                <TrendBadge
                    current={timing.avgConsultationMinutes}
                    previous={timing.prevMonthAvgConsultationMinutes}
                />
            ),
            icon: Stethoscope,
            href: "/doctor/stats",
            borderColor: "border-l-sky-500",
            iconColor: "text-sky-600",
        },
        {
            title: "Turnos mensuales",
            value: kpi.totalAppointments,
            subtitle: `${kpi.growth >= 0 ? "+" : ""}${kpi.growth}% vs mes pasado`,
            icon: Calendar,
            href: "/doctor/appointments",
            borderColor: "border-l-blue-500",
            iconColor: "text-blue-500",
            subtitleClassName: kpi.growth >= 0 ? "text-green-600" : "text-red-600",
        },
        {
            title: "Primeras visitas",
            value: kpi.firstVisits,
            subtitle: "Pacientes nuevos",
            icon: UserPlus,
            href: "/doctor/patients",
            borderColor: "border-l-indigo-500",
            iconColor: "text-indigo-500",
        },
        {
            title: "Ausencias",
            value: kpi.absent,
            subtitle: "No-shows del mes",
            icon: UserX,
            href: "/doctor/stats",
            borderColor: "border-l-red-500",
            iconColor: "text-red-500",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link key={item.title} href={item.href} className="block group">
                        <Card
                            className={cn(
                                "shadow-sm border-l-4 transition-shadow group-hover:shadow-md h-full",
                                item.borderColor
                            )}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                                <Icon className={cn("h-4 w-4", item.iconColor)} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{item.value}</div>
                                {item.subtitle && (
                                    <div
                                        className={cn(
                                            "text-xs mt-0.5",
                                            item.subtitleClassName ?? "text-muted-foreground"
                                        )}
                                    >
                                        {item.subtitle}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}
