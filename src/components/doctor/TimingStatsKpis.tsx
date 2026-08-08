"use client";

import { OverallTimingStats } from "@/lib/timingStats";
import { formatDuration, formatPunctuality } from "@/lib/appointmentTiming";
import { cn } from "@/lib/utils";
import { Clock3, Timer, Stethoscope } from "lucide-react";

interface TimingStatsKpisProps {
    stats: OverallTimingStats;
    compact?: boolean;
}

export function TimingStatsKpis({ stats, compact = false }: TimingStatsKpisProps) {
    const punct = formatPunctuality(stats.avgArrivalDeltaSeconds);
    const valueClass = compact ? "text-2xl" : "text-3xl";

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={cn("rounded-lg border border-amber-200 bg-amber-50", compact ? "p-3" : "p-4")}>
                    <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium">
                        <Timer className="h-3.5 w-3.5" /> Espera promedio
                    </div>
                    <div className={cn("font-bold text-amber-800 mt-1 font-mono", valueClass)}>
                        {formatDuration(stats.avgWaitingSeconds)}
                    </div>
                </div>
                <div className={cn("rounded-lg border border-blue-200 bg-blue-50", compact ? "p-3" : "p-4")}>
                    <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium">
                        <Stethoscope className="h-3.5 w-3.5" /> Atención promedio
                    </div>
                    <div className={cn("font-bold text-blue-800 mt-1 font-mono", valueClass)}>
                        {formatDuration(stats.avgConsultationSeconds)}
                    </div>
                </div>
                <div className={cn("rounded-lg border border-slate-200 bg-slate-50", compact ? "p-3" : "p-4")}>
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                        <Clock3 className="h-3.5 w-3.5" /> Puntualidad
                    </div>
                    <div
                        className={cn(
                            "font-bold mt-1 font-mono",
                            compact ? "text-xl" : "text-2xl",
                            punct.onTime ? "text-slate-700" : punct.early ? "text-emerald-700" : "text-orange-700"
                        )}
                    >
                        {punct.label}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="text-emerald-700 font-medium">{stats.punctuality.earlyPct}% temprano/puntual</span>
                        <span className="text-orange-700 font-medium">{stats.punctuality.latePct}% tarde</span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Sobre {stats.count} {stats.count === 1 ? "turno finalizado" : "turnos finalizados"} con registro de tiempos.
            </p>
        </div>
    );
}
