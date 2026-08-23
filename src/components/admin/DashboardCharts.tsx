"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

interface DashboardChartsProps {
    data: {
        insurance: { name: string; value: number; fill?: string }[];
        area: { name: string; total: number }[];
        consultationType: { name: string; value: number }[];
    };
}

const INSURANCE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

export function DashboardCharts({ data }: DashboardChartsProps) {
    const insuranceTotal = data.insurance.reduce((sum, item) => sum + item.value, 0);
    const pieData = data.insurance.map((d, i) => ({
        ...d,
        fill: INSURANCE_COLORS[i % INSURANCE_COLORS.length],
        pct: insuranceTotal > 0 ? Math.round((d.value / insuranceTotal) * 100) : 0,
    }));

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Evolución de turnos</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.area} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Distribución obras sociales</CardTitle>
                        <CardDescription>Principales coberturas del mes</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {pieData.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center pt-16">
                                Sin datos de obras sociales
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) =>
                                            `${name} (${Math.round((percent ?? 0) * 100)}%)`
                                        }
                                        labelLine={false}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={entry.name}
                                                fill={
                                                    entry.fill ??
                                                    INSURANCE_COLORS[index % INSURANCE_COLORS.length]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, _name, item) => {
                                            const count = typeof value === "number" ? value : 0;
                                            const pct = item?.payload?.pct ?? 0;
                                            return [`${count} turnos (${pct}%)`, item?.payload?.name];
                                        }}
                                    />
                                    <Legend
                                        layout="vertical"
                                        align="right"
                                        verticalAlign="middle"
                                        formatter={(value) => {
                                            const item = pieData.find((d) => d.name === value);
                                            return `${value} (${item?.value ?? 0})`;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {data.consultationType.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tipos de consulta</CardTitle>
                        <CardDescription>Distribución del mes actual</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.consultationType} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
