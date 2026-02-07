"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Appointment, UserProfile } from "@/types";
import { historyService } from "@/services/historyService";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, FileText, Phone, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function PatientHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!patientId) return;
            try {
                const [p, h] = await Promise.all([
                    historyService.getPatientProfile(patientId),
                    historyService.getPatientHistory(patientId)
                ]);
                setPatient(p);
                setHistory(h);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [patientId]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!patient) return <div className="p-8 text-center text-muted-foreground">Paciente no encontrado.</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Tablero
            </Button>

            {/* Patient Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 shrink-0">
                    {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{patient.lastName}, {patient.firstName}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            DNI: {patient.dni || 'No registrado'}
                        </div>
                        <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {patient.phone || 'Sin teléfono'}
                        </div>
                        <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {patient.insurance || 'Particular'}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Registrado: {format(new Date(), "yyyy")} {/* Placeholder for createdAt */}
                        </div>
                    </div>
                </div>
            </div>

            <hr />

            {/* Timeline */}
            <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Historia Clínica
                </h2>

                <div className="relative border-l border-slate-200 ml-3 space-y-8 pb-8">
                    {history.length === 0 ? (
                        <div className="pl-8 text-muted-foreground">Sin registros médicos.</div>
                    ) : history.map((appt) => (
                        <div key={appt.id} className="relative pl-8">
                            <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />

                            <Card className="hover:shadow-sm transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base font-medium">
                                                Consulta con {appt.patientName ? 'Dr/a. (TBD)' : 'Especialista'} {/* We don't have doctor name denormalized properly locally yet, checking type */}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {format(new Date(appt.date), "EEEE d 'de' MMMM, yyyy - HH:mm", { locale: es })} hs
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className={getStatusColor(appt.status)}>
                                            {appt.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {appt.medicalNotes ? (
                                        <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm">
                                            <span className="font-semibold text-slate-700 block mb-1">Evolución:</span>
                                            {appt.medicalNotes}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Sin notas médicas registradas.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
