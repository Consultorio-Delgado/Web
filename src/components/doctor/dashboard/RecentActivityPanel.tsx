"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AuditLogEntry } from "@/types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface RecentActivityPanelProps {
    logs: AuditLogEntry[];
}

function actionLabel(action: string): string {
    switch (action) {
        case "APPOINTMENT_CREATED":
            return "Turno reservado";
        case "APPOINTMENT_CANCELLED":
            return "Turno cancelado";
        case "APPOINTMENT_CONFIRMED":
            return "Turno confirmado";
        case "APPOINTMENT_COMPLETED":
            return "Turno completado";
        case "APPOINTMENT_ARRIVED":
            return "Paciente llegó";
        case "MEDICAL_NOTE_ADDED":
            return "Evolución médica";
        case "PATIENT_FILE_UPLOADED":
            return "Archivo adjunto";
        default:
            return action.replace(/_/g, " ");
    }
}

function activityLink(log: AuditLogEntry): string | null {
    const meta = log.metadata;
    if (!meta) return null;
    if (meta.patientId && typeof meta.patientId === "string") {
        return `/doctor/patients/${meta.patientId}`;
    }
    if (meta.appointmentId) {
        return "/doctor/daily";
    }
    return null;
}

export function RecentActivityPanel({ logs }: RecentActivityPanelProps) {
    return (
        <Card className="col-span-3 lg:col-span-3">
            <CardHeader>
                <CardTitle>Actividad reciente</CardTitle>
                <CardDescription>Últimos movimientos del sistema</CardDescription>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
                ) : (
                    <div className="space-y-5">
                        {logs.map((log) => {
                            const href = activityLink(log);
                            const content = (
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback
                                            className={cn(
                                                "font-bold text-xs",
                                                log.action.includes("CANCELLED")
                                                    ? "bg-red-100 text-red-600"
                                                    : log.action.includes("CONFIRMED")
                                                      ? "bg-blue-100 text-blue-600"
                                                      : "bg-slate-100 text-slate-600"
                                            )}
                                        >
                                            {log.action.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1 min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-none">
                                            {actionLabel(log.action)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {log.metadata?.patientName
                                                ? `Paciente: ${log.metadata.patientName}`
                                                : `Usuario: ${log.performedBy}`}
                                        </p>
                                        {log.metadata?.doctorName != null && (
                                            <p className="text-xs text-muted-foreground">
                                                Dr: {String(log.metadata.doctorName)}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground/70">
                                            {formatDistanceToNow(log.timestamp, {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );

                            return href ? (
                                <Link
                                    key={log.id}
                                    href={href}
                                    className="block rounded-lg -mx-2 px-2 py-1 hover:bg-muted/50 transition-colors"
                                >
                                    {content}
                                </Link>
                            ) : (
                                <div key={log.id}>{content}</div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
