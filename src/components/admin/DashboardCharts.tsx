"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, RadialBarChart, RadialBar, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DashboardChartsProps {
    data: {
        weekly: { name: string; value: number }[];
        insurance: { name: string; value: number; fill?: string }[];
        area: { name: string; total: number }[];
    };
    nextAppointments: any[];
    privacyMode: boolean;
}

export function DashboardCharts({ data, nextAppointments, privacyMode }: DashboardChartsProps) {
    // Add colors to insurance data if missing
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const radialData = data.insurance.map((d, i) => ({
        ...d,
        fill: COLORS[i % COLORS.length]
    }));

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Area Chart: Monthly Evolution */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Evolución de Turnos</CardTitle>
                    <CardDescription>Comparativa últimos meses.</CardDescription>
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
                            <XAxis dataKey="name" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                            <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Radial Bar: Insurance Distribution */}
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Distribución Obras Sociales</CardTitle>
                    <CardDescription>Principales coberturas.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={radialData}>
                            <RadialBar
                                label={{ position: 'insideStart', fill: '#fff' }}
                                background
                                dataKey="value"
                            />
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ top: '50%', right: 0, transform: 'translate(0, -50%)', lineHeight: '24px' }} />
                            <Tooltip />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Bar Chart: Weekly Distribution */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Demanda Semanal</CardTitle>
                    <CardDescription>Turnos por día de la semana.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.weekly}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Next 48hs List */}
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Próximas 48hs</CardTitle>
                    <CardDescription>Agenda inmediata.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] overflow-y-auto pr-4">
                        <div className="space-y-4">
                            {nextAppointments.length === 0 && <p className="text-sm text-muted-foreground">No hay turnos próximos.</p>}
                            {nextAppointments.map((appt) => (
                                <div key={appt.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", privacyMode && "blur-sm select-none")}>
                                            {appt.patientName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground">
                                                {format(appt.date, "EEEE HH:mm", { locale: es })}
                                            </p>
                                            {/* Example logic for "New Patient" badge if we had history check or flag */}
                                            {/* <Badge variant="outline" className="text-[10px] h-5">Nuevo</Badge> */}
                                        </div>
                                    </div>
                                    <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'}>
                                        {appt.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
