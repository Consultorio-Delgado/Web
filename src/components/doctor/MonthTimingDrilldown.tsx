"use client";

import { MonthDistribution } from "@/lib/timingStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

interface MonthTimingDrilldownProps {
    distribution: MonthDistribution;
    onClose: () => void;
}

export function MonthTimingDrilldown({ distribution, onClose }: MonthTimingDrilldownProps) {
    const title = distribution.label.charAt(0).toUpperCase() + distribution.label.slice(1);

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
                <div>
                    <CardTitle className="capitalize">{title}</CardTitle>
                    <CardDescription>
                        Distribución sobre {distribution.count}{" "}
                        {distribution.count === 1 ? "turno" : "turnos"} con tiempos.
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar detalle del mes">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-[310px]">
                        <p className="text-sm font-medium text-slate-700 mb-2">Puntualidad</p>
                        {distribution.punctuality.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin datos</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distribution.punctuality}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={2}
                                    >
                                        {distribution.punctuality.map((entry) => (
                                            <Cell key={entry.key} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 8,
                                            border: "none",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        }}
                                        formatter={(value, name) => [value, String(name)]}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="h-[310px]">
                        <p className="text-sm font-medium text-slate-700 mb-2">Espera (minutos)</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distribution.waitingHistogram} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-[310px]">
                        <p className="text-sm font-medium text-slate-700 mb-2">Atención (minutos)</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={distribution.consultationHistogram}
                                margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
