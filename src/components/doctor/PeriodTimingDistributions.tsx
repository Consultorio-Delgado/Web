"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    PeriodDistribution,
    DurationBucket,
    punctualityBucketLabelForDeltaSeconds,
    durationBucketLabelForSeconds,
    appointmentsInPunctualityBucket,
} from "@/lib/timingStats";
import { formatDuration, formatPunctuality } from "@/lib/appointmentTiming";
import { Appointment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X } from "lucide-react";
import Link from "next/link";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    Customized,
} from "recharts";

interface PeriodTimingDistributionsProps {
    distribution: PeriodDistribution;
    appointments: Appointment[];
    compact?: boolean;
}

type AxisScale = ((v: string) => number) & { bandwidth?: () => number };

function punctualityFill(entry: DurationBucket, selected: boolean): string {
    const base = entry.side === "early" ? "#059669" : "#ea580c";
    if (!selected) return base;
    return entry.side === "early" ? "#047857" : "#c2410c";
}

function categoryCenterX(scale: AxisScale, label: string): number | null {
    const x = scale(label);
    if (typeof x !== "number") return null;
    const bw = scale.bandwidth?.() ?? 0;
    return x + bw / 2;
}

function categoryBoundaryBetween(scale: AxisScale, leftLabel: string, rightLabel: string): number | null {
    const xLeft = scale(leftLabel);
    const xRight = scale(rightLabel);
    if (typeof xLeft !== "number" || typeof xRight !== "number") return null;
    const bw = scale.bandwidth?.() ?? 0;
    return (xLeft + bw + xRight) / 2;
}

function MedianMarker({
    x,
    y1,
    y2,
    color,
    label,
}: {
    x: number;
    y1: number;
    y2: number;
    color: string;
    label: string;
}) {
    const boxW = Math.max(56, label.length * 6.2);
    return (
        <g pointerEvents="none">
            <line x1={x} x2={x} y1={y1} y2={y2} stroke={color} strokeWidth={2} />
            <rect
                x={x - boxW / 2}
                y={y1 + 2}
                width={boxW}
                height={16}
                rx={3}
                fill="white"
                fillOpacity={0.92}
                stroke={color}
                strokeWidth={1}
            />
            <text x={x} y={y1 + 13} textAnchor="middle" fill={color} fontSize={9} fontWeight={700}>
                {label}
            </text>
        </g>
    );
}

/** Mediana sobre histograma de duración (espera / atención). */
function DurationMedianOverlay(props: {
    xAxisMap?: Record<string, { scale: AxisScale }>;
    offset?: { top: number; height: number };
    histogram?: DurationBucket[];
    medianSeconds?: number;
    color?: string;
}) {
    const { xAxisMap, offset, histogram, medianSeconds, color = "#b45309" } = props;
    if (!xAxisMap || !offset || !histogram?.length || typeof medianSeconds !== "number") return null;

    const xAxis = Object.values(xAxisMap)[0];
    if (!xAxis?.scale) return null;

    const bucketLabel = durationBucketLabelForSeconds(medianSeconds);
    const bucket = histogram.find((b) => b.label === bucketLabel);
    if (!bucket) return null;

    const x = categoryCenterX(xAxis.scale, bucket.label);
    if (x == null) return null;

    return (
        <MedianMarker
            x={x}
            y1={offset.top}
            y2={offset.top + offset.height}
            color={color}
            label={`Me ${formatDuration(medianSeconds)}`}
        />
    );
}

function PunctualityOverlay(props: {
    xAxisMap?: Record<string, { scale: AxisScale }>;
    offset?: { top: number; height: number };
    punctualityData?: DurationBucket[];
    medianArrivalDeltaSeconds?: number;
}) {
    const { xAxisMap, offset, punctualityData, medianArrivalDeltaSeconds } = props;
    if (!xAxisMap || !offset || !punctualityData?.length) return null;

    const xAxis = Object.values(xAxisMap)[0];
    if (!xAxis?.scale) return null;

    const y1 = offset.top;
    const y2 = offset.top + offset.height;
    const elements: ReactNode[] = [];

    const lastEarly = [...punctualityData].reverse().find((b) => b.side === "early");
    const firstLate = punctualityData.find((b) => b.side === "late");
    if (lastEarly && firstLate) {
        const x0 = categoryBoundaryBetween(xAxis.scale, lastEarly.label, firstLate.label);
        if (x0 != null) {
            elements.push(
                <g key="zero" pointerEvents="none">
                    <line x1={x0} x2={x0} y1={y1} y2={y2} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
                    <text x={x0} y={y2 + 14} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={600}>
                        0
                    </text>
                </g>
            );
        }
    }

    if (typeof medianArrivalDeltaSeconds === "number") {
        const medianLabel = punctualityBucketLabelForDeltaSeconds(medianArrivalDeltaSeconds);
        const medianBucket = punctualityData.find((b) => b.label === medianLabel);
        if (medianBucket) {
            const xm = categoryCenterX(xAxis.scale, medianBucket.label);
            if (xm != null) {
                const punct = formatPunctuality(medianArrivalDeltaSeconds);
                const color = punct.onTime ? "#475569" : punct.early ? "#047857" : "#c2410c";
                elements.push(
                    <MedianMarker
                        key="median"
                        x={xm}
                        y1={y1}
                        y2={y2}
                        color={color}
                        label={`Me ${punct.label}`}
                    />
                );
            }
        }
    }

    return <g pointerEvents="none">{elements}</g>;
}

export function PeriodTimingDistributions({
    distribution,
    appointments,
    compact = false,
}: PeriodTimingDistributionsProps) {
    const chartH = compact ? "h-[285px]" : "h-[340px]";
    const punctData = distribution.punctualityHistogram.filter((b) => !b.isBreak);
    const waitMedian = formatDuration(distribution.medianWaitingSeconds);
    const consMedian = formatDuration(distribution.medianConsultationSeconds);
    const punctMedian = formatPunctuality(distribution.medianArrivalDeltaSeconds);
    const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

    useEffect(() => {
        setSelectedBucket(null);
    }, [appointments]);

    const bucketPatients = useMemo(() => {
        if (!selectedBucket) return [];
        return appointmentsInPunctualityBucket(appointments, selectedBucket).sort(
            (a, b) => (a.timing!.arrivalDeltaSeconds || 0) - (b.timing!.arrivalDeltaSeconds || 0)
        );
    }, [appointments, selectedBucket]);

    return (
        <Card>
            <CardHeader className={compact ? "pb-2" : undefined}>
                <CardTitle className={compact ? "text-base" : undefined}>Distribuciones del período</CardTitle>
                <CardDescription>
                    Medianas y distribución sobre {distribution.count}{" "}
                    {distribution.count === 1 ? "turno" : "turnos"} con tiempos. Click en una barra de puntualidad
                    para ver los pacientes de ese bucket.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={cn("grid gap-6", compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
                    <div className={chartH}>
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-amber-800">Espera</p>
                            <p className="text-xs font-mono font-semibold text-amber-800">Mediana: {waitMedian}</p>
                        </div>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart
                                data={distribution.waitingHistogram}
                                margin={{ top: 18, right: 8, left: -10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                    formatter={(value) => [value, "Turnos"]}
                                />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Customized
                                    component={((p: object) => (
                                        <DurationMedianOverlay
                                            {...(p as object)}
                                            histogram={distribution.waitingHistogram}
                                            medianSeconds={distribution.medianWaitingSeconds}
                                            color="#b45309"
                                        />
                                    )) as never}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={chartH}>
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-blue-800">Atención</p>
                            <p className="text-xs font-mono font-semibold text-blue-800">Mediana: {consMedian}</p>
                        </div>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart
                                data={distribution.consultationHistogram}
                                margin={{ top: 18, right: 8, left: -10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                    formatter={(value) => [value, "Turnos"]}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Customized
                                    component={((p: object) => (
                                        <DurationMedianOverlay
                                            {...(p as object)}
                                            histogram={distribution.consultationHistogram}
                                            medianSeconds={distribution.medianConsultationSeconds}
                                            color="#1d4ed8"
                                        />
                                    )) as never}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={cn(chartH, selectedBucket && "min-h-[285px]")}>
                        <div className="flex flex-col gap-0.5 mb-2">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="text-sm font-medium text-emerald-800">Puntualidad (llegada)</p>
                                <p
                                    className={cn(
                                        "text-xs font-mono font-semibold",
                                        punctMedian.onTime
                                            ? "text-slate-600"
                                            : punctMedian.early
                                              ? "text-emerald-700"
                                              : "text-orange-700"
                                    )}
                                >
                                    Mediana: {punctMedian.label}
                                </p>
                            </div>
                            <p className="text-[11px] text-right">
                                <span className="text-emerald-700 font-medium">{distribution.earlyPct}% temprano/puntual</span>
                                <span className="text-slate-400 mx-1">·</span>
                                <span className="text-orange-700 font-medium">{distribution.latePct}% tarde</span>
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart
                                data={punctData}
                                margin={{ top: 18, right: 8, left: -10, bottom: 24 }}
                                barCategoryGap="12%"
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10 }}
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                    formatter={(value) => [value, "Turnos"]}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[4, 4, 0, 0]}
                                    cursor="pointer"
                                    onClick={(data) => {
                                        const payload = (data as { payload?: DurationBucket } | undefined)?.payload;
                                        if (!payload?.label || payload.isBreak) return;
                                        setSelectedBucket((prev) =>
                                            prev === payload.label ? null : payload.label
                                        );
                                    }}
                                >
                                    {punctData.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={punctualityFill(entry, selectedBucket === entry.label)}
                                            stroke={selectedBucket === entry.label ? "#0f172a" : undefined}
                                            strokeWidth={selectedBucket === entry.label ? 1.5 : 0}
                                            fillOpacity={
                                                !selectedBucket || selectedBucket === entry.label ? 1 : 0.35
                                            }
                                        />
                                    ))}
                                </Bar>
                                <Customized
                                    component={((p: object) => (
                                        <PunctualityOverlay
                                            {...(p as object)}
                                            punctualityData={punctData}
                                            medianArrivalDeltaSeconds={distribution.medianArrivalDeltaSeconds}
                                        />
                                    )) as never}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {selectedBucket && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Pacientes · {selectedBucket}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {bucketPatients.length}{" "}
                                    {bucketPatients.length === 1 ? "turno" : "turnos"} (datos ya cargados)
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setSelectedBucket(null)}
                                aria-label="Cerrar listado"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {bucketPatients.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No hay turnos en este bucket.</p>
                        ) : (
                            <ul className="max-h-56 overflow-y-auto divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
                                {bucketPatients.map((appt) => {
                                    const delta = appt.timing!.arrivalDeltaSeconds || 0;
                                    const punct = formatPunctuality(delta);
                                    return (
                                        <li
                                            key={appt.id}
                                            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                                        >
                                            <div className="min-w-0">
                                                {appt.patientId && !appt.patientId.startsWith("manual_") ? (
                                                    <Link
                                                        href={`/doctor/patients/${appt.patientId}`}
                                                        className="font-medium text-slate-900 hover:underline truncate block"
                                                    >
                                                        {appt.patientName || "Paciente"}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-slate-900 truncate block">
                                                        {appt.patientName || "Paciente"}
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {format(appt.date, "d MMM yyyy · HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    "shrink-0 font-mono text-xs font-semibold",
                                                    punct.onTime
                                                        ? "text-slate-600"
                                                        : punct.early
                                                          ? "text-emerald-700"
                                                          : "text-orange-700"
                                                )}
                                            >
                                                {punct.label}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
