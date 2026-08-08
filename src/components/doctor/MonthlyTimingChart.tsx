"use client";

import { MonthlyTimingPoint } from "@/lib/timingStats";
import { formatDuration, formatPunctuality } from "@/lib/appointmentTiming";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

interface MonthlyTimingChartProps {
    data: MonthlyTimingPoint[];
    selectedKey: string | null;
    onSelectMonth: (key: string) => void;
    compact?: boolean;
}

const SERIES = [
    { key: "avgWaitingMinutes", label: "Espera", color: "#f59e0b", selectedStroke: "#b45309" },
    { key: "avgConsultationMinutes", label: "Atención", color: "#3b82f6", selectedStroke: "#1d4ed8" },
    { key: "avgPunctualityAbsMinutes", label: "Puntualidad", color: "#059669", selectedStroke: "#047857" },
] as const;

function minutesToLabel(mins: number): string {
    return formatDuration(Math.round(Math.abs(mins) * 60));
}

export function MonthlyTimingChart({ data, selectedKey, onSelectMonth, compact = false }: MonthlyTimingChartProps) {
    return (
        <Card>
            <CardHeader className={compact ? "pb-2" : undefined}>
                <CardTitle className={compact ? "text-base" : undefined}>Promedios mensuales</CardTitle>
                <CardDescription>
                    Hacé click en un punto de un mes para ver la distribución de espera, atención y puntualidad.
                </CardDescription>
            </CardHeader>
            <CardContent className={compact ? "h-[340px]" : "h-[415px]"}>
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        No hay datos mensuales en este período.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                label={{ value: "min", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
                            />
                            <Tooltip
                                cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                formatter={(value, name, item) => {
                                    const n = typeof value === "number" ? value : Number(value);
                                    const point = item?.payload as MonthlyTimingPoint | undefined;
                                    if (name === "avgPunctualityAbsMinutes" && point) {
                                        return [formatPunctuality(point.avgArrivalDeltaSeconds).label, "Puntualidad"];
                                    }
                                    const label =
                                        name === "avgWaitingMinutes"
                                            ? "Espera"
                                            : name === "avgConsultationMinutes"
                                              ? "Atención"
                                              : String(name);
                                    return [minutesToLabel(n), label];
                                }}
                                labelFormatter={(label, payload) => {
                                    const count = (payload?.[0]?.payload as MonthlyTimingPoint | undefined)?.count;
                                    return count != null ? `${label} · ${count} turnos` : String(label);
                                }}
                            />
                            <Legend
                                content={() => (
                                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm text-slate-700">
                                        {SERIES.map((s) => (
                                            <span key={s.key} className="inline-flex items-center gap-1.5">
                                                <span
                                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                                    style={{ backgroundColor: s.color }}
                                                />
                                                {s.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            />
                            {SERIES.map((s) => (
                                <Line
                                    key={s.key}
                                    type="monotone"
                                    dataKey={s.key}
                                    name={s.key}
                                    stroke={s.color}
                                    strokeWidth={2}
                                    strokeOpacity={!selectedKey ? 1 : 0.45}
                                    dot={((props: {
                                        cx?: number;
                                        cy?: number;
                                        payload?: MonthlyTimingPoint;
                                    }) => {
                                        const { cx, cy, payload } = props;
                                        if (cx == null || cy == null || !payload) return null;
                                        const selected = selectedKey === payload.key;
                                        const dimmed = selectedKey != null && !selected;
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={selected ? 7 : 5}
                                                fill={s.color}
                                                fillOpacity={dimmed ? 0.35 : 1}
                                                stroke={selected ? s.selectedStroke : "#fff"}
                                                strokeWidth={selected ? 2.5 : 2}
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectMonth(payload.key);
                                                }}
                                            />
                                        );
                                    }) as never}
                                    activeDot={{
                                        r: 7,
                                        strokeWidth: 2,
                                        stroke: "#fff",
                                        cursor: "pointer",
                                        onClick: ((_e: unknown, dotProps: { payload?: MonthlyTimingPoint }) => {
                                            const key = dotProps?.payload?.key;
                                            if (key) onSelectMonth(key);
                                        }) as never,
                                    }}
                                    connectNulls
                                    isAnimationActive={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
