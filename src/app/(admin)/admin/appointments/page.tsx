"use client";

import { WeeklyAgenda } from "@/components/admin/WeeklyAgenda";

export default function AppointmentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agenda Médica</h1>
                    <p className="text-muted-foreground">Gestión de turnos y disponibilidad.</p>
                </div>
            </div>

            <WeeklyAgenda />
        </div>
    );
}
