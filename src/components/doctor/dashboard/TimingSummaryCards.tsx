"use client";

import Link from "next/link";
import { TimingSummary } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Stethoscope, MapPin, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimingSummaryCardsProps {
    timing: TimingSummary;
}

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
                improved ? "text-green-600" : "text-red-600"
            )}
        >
            {improved ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {Math.abs(diff)} min vs mes ant.
        </span>
    );
}

export function TimingSummaryCards({ timing }: TimingSummaryCardsProps) {
    if (timing.count === 0) {
        return (
            <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    Sin datos de tiempos este mes.{" "}
                    <Button variant="link" size="sm" asChild className="p-0 h-auto">
                        <Link href="/doctor/stats">Ver estadísticas</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tiempos del mes</h2>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/doctor/stats">
                        Ver detalle
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Timer className="h-4 w-4 text-amber-600" />
                            Espera mediana
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{timing.avgWaitingMinutes} min</div>
                        <TrendBadge
                            current={timing.avgWaitingMinutes}
                            previous={timing.prevMonthAvgWaitingMinutes}
                            invert
                        />
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-blue-600" />
                            Atención mediana
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{timing.avgConsultationMinutes} min</div>
                        <TrendBadge
                            current={timing.avgConsultationMinutes}
                            previous={timing.prevMonthAvgConsultationMinutes}
                        />
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            Puntualidad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{timing.earlyPct}%</div>
                        <p className="text-xs text-muted-foreground">
                            Temprano/puntual · {timing.latePct}% tarde ({timing.count} turnos)
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
