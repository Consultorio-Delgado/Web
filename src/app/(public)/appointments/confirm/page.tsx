"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, Calendar } from "lucide-react";

type ConfirmationState = "loading" | "success" | "error" | "already_confirmed";

interface AppointmentData {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
}

function ConfirmContent() {
    const searchParams = useSearchParams();
    const [state, setState] = useState<ConfirmationState>("loading");
    const [error, setError] = useState<string>("");
    const [appointment, setAppointment] = useState<AppointmentData | null>(null);

    const id = searchParams.get("id");
    const token = searchParams.get("token");

    useEffect(() => {
        const confirmAppointment = async () => {
            if (!id || !token) {
                setState("error");
                setError("Link inválido. Faltan parámetros.");
                return;
            }

            try {
                const response = await fetch("/api/appointments/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ appointmentId: id, patientToken: token })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.code === "ALREADY_CONFIRMED") {
                        setState("already_confirmed");
                        setAppointment(data.appointment);
                    } else {
                        setState("error");
                        setError(data.error || "Error al confirmar el turno.");
                    }
                    return;
                }

                setState("success");
                setAppointment(data.appointment);

            } catch (err) {
                setState("error");
                setError("Error de conexión. Por favor intenta nuevamente.");
            }
        };

        confirmAppointment();
    }, [id, token]);

    const generateGoogleCalendarUrl = () => {
        if (!appointment) return "#";
        const prefix = appointment.doctorName.toLowerCase().includes('secondi') ? 'Dra.' : 'Dr.';
        const title = encodeURIComponent(`Turno Médico - ${prefix} ${appointment.doctorName}`);
        const details = encodeURIComponent(`Turno confirmado en Consultorio Delgado`);
        const location = encodeURIComponent("Delgado 588, 1°C (1426) CABA");
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    };

    return (
        <Card className="w-full max-w-md shadow-xl">
            {state === "loading" && (
                <>
                    <CardHeader className="text-center">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
                        <CardTitle className="text-xl">Confirmando tu turno...</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        Por favor espera un momento.
                    </CardContent>
                </>
            )}

            {state === "success" && appointment && (
                <>
                    <CardHeader className="text-center">
                        <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">¡Turno Confirmado!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm text-muted-foreground">Paciente</p>
                            <p className="font-semibold">{appointment.patientName}</p>

                            <p className="text-sm text-muted-foreground mt-3">Profesional</p>
                            <p className="font-semibold">{appointment.doctorName.toLowerCase().includes('secondi') ? 'Dra.' : 'Dr.'} {appointment.doctorName}</p>

                            <p className="text-sm text-muted-foreground mt-3">Fecha y Hora</p>
                            <p className="font-semibold">{appointment.date} a las {appointment.time}</p>

                            <p className="text-sm text-muted-foreground mt-3">Dirección</p>
                            <p className="font-semibold">Delgado 588, 1°C (1426) CABA</p>
                        </div>

                        <Button className="w-full gap-2" asChild>
                            <a href={generateGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                                <Calendar className="h-4 w-4" />
                                Agregar a Google Calendar
                            </a>
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Te esperamos. Por favor llega 10 minutos antes de tu turno.
                        </p>
                    </CardContent>
                </>
            )}

            {state === "already_confirmed" && appointment && (
                <>
                    <CardHeader className="text-center">
                        <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-12 w-12 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl text-blue-700">Turno Ya Confirmado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground">
                            Este turno ya fue confirmado anteriormente.
                        </p>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                            <p className="font-semibold">{appointment.date} a las {appointment.time}</p>
                            <p className="text-sm">{appointment.doctorName.toLowerCase().includes('secondi') ? 'Dra.' : 'Dr.'} {appointment.doctorName}</p>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            Te esperamos. Por favor llega 10 minutos antes.
                        </p>
                    </CardContent>
                </>
            )}

            {state === "error" && (
                <>
                    <CardHeader className="text-center">
                        <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-red-700">Error</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">{error}</p>
                        <p className="text-sm text-muted-foreground">
                            Si el problema persiste, comunicate al consultorio.
                        </p>
                    </CardContent>
                </>
            )}
        </Card>
    );
}

function LoadingFallback() {
    return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
                <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Cargando...</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
                Por favor espera un momento.
            </CardContent>
        </Card>
    );
}

export default function ConfirmAppointmentPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <Suspense fallback={<LoadingFallback />}>
                <ConfirmContent />
            </Suspense>
        </div>
    );
}
