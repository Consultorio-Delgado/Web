"use client";

import { DoctorMonthStats } from "@/types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DoctorComparisonProps {
    data: DoctorMonthStats[];
}

export function DoctorComparison({ data }: DoctorComparisonProps) {
    if (data.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Comparativa por médico</CardTitle>
                <CardDescription>
                    Resumen del mes actual · asistencia por horario (cancelaciones reocupadas no penalizan)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="pb-2 pr-4 font-medium">Médico</th>
                                <th className="pb-2 pr-4 font-medium text-right">Turnos</th>
                                <th className="pb-2 pr-4 font-medium text-right">Espera</th>
                                <th className="pb-2 pr-4 font-medium text-right">Atención</th>
                                <th className="pb-2 font-medium text-right">Asistencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.doctorId} className="border-b last:border-0">
                                    <td className="py-2.5 pr-4 font-medium">Dr. {row.doctorName}</td>
                                    <td className="py-2.5 pr-4 text-right">{row.appointments}</td>
                                    <td className="py-2.5 pr-4 text-right">{row.avgWaitingMinutes} min</td>
                                    <td className="py-2.5 pr-4 text-right">{row.avgConsultationMinutes} min</td>
                                    <td className="py-2.5 text-right">{row.attendanceRate}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
