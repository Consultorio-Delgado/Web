"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NewPatientEntry } from "@/types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";

interface NewPatientsListProps {
    patients: NewPatientEntry[];
}

export function NewPatientsList({ patients }: NewPatientsListProps) {
    if (patients.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Pacientes nuevos del mes
                </CardTitle>
                <CardDescription>Primeras visitas registradas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {patients.map((p) => (
                        <Link
                            key={`${p.patientId}-${p.date.toISOString()}`}
                            href={`/doctor/patients/${p.patientId}`}
                            className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/30 rounded px-1 -mx-1"
                        >
                            <div>
                                <p className="text-sm font-medium">
                                    {p.patientName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {format(p.date, "d MMM yyyy", { locale: es })}
                                </p>
                            </div>
                            {p.insurance && (
                                <Badge variant="outline" className="text-xs">
                                    {p.insurance}
                                </Badge>
                            )}
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
