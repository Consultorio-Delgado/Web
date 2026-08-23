"use client";

import Link from "next/link";
import { DashboardAlert } from "@/types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionRequiredPanelProps {
    alerts: DashboardAlert[];
}

const severityStyles = {
    high: "border-l-red-500 bg-red-50/30 dark:bg-red-950/10",
    medium: "border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10",
    low: "border-l-slate-400 bg-slate-50/30 dark:bg-slate-900/30",
};

export function ActionRequiredPanel({ alerts }: ActionRequiredPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Requiere atención
                </CardTitle>
                <CardDescription>Acciones pendientes ordenadas por urgencia</CardDescription>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <p className="text-sm">Todo al día. No hay alertas operativas.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert) => (
                            <Link
                                key={alert.id}
                                href={alert.href}
                                className={cn(
                                    "flex items-center justify-between rounded-lg border-l-4 p-3 transition-colors hover:bg-muted/50",
                                    severityStyles[alert.severity]
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{alert.title}</p>
                                    {alert.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {alert.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {alert.count !== undefined && (
                                        <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                                            {alert.count}
                                        </Badge>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
