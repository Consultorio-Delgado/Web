"use client";

import { format } from "date-fns";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ExistingAppointmentNotice = {
    id: string;
    date: Date;
    time: string;
};

function describeAppointment(appointment: ExistingAppointmentNotice) {
    const [hours, minutes] = (appointment.time || "").split(":");
    const time = hours && minutes ? `${hours}:${minutes}` : appointment.time;
    return `el día ${format(appointment.date, "dd-MM-yyyy")} a las ${time} hs`;
}

export function ExistingAppointmentWarning({ appointments }: { appointments: ExistingAppointmentNotice[] }) {
    if (appointments.length === 0) return null;

    return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                    {appointments.length === 1 ? (
                        <p className="font-medium">
                            Este paciente ya tiene un turno {describeAppointment(appointments[0])}.
                        </p>
                    ) : (
                        <>
                            <p className="font-medium">Este paciente ya tiene turnos con este profesional:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                {appointments.map((appointment) => (
                                    <li key={appointment.id}>{describeAppointment(appointment)}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function StaffDuplicateBookingPrompt({
    patientName,
    appointments,
    confirming,
    onConfirm,
    onBack,
}: {
    patientName: string;
    appointments: ExistingAppointmentNotice[];
    confirming: boolean;
    onConfirm: () => void;
    onBack: () => void;
}) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-700">
                Paciente: <span className="font-semibold">{patientName}</span>
            </p>
            <ExistingAppointmentWarning appointments={appointments} />
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onBack} disabled={confirming}>
                    Elegir otro paciente
                </Button>
                <Button onClick={onConfirm} disabled={confirming}>
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirmar turno
                </Button>
            </div>
        </div>
    );
}
