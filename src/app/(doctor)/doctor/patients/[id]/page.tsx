"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "@/services/adminService";
import { appointmentService } from "@/services/appointments";
import { UserProfile, Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Mail, Phone, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function PatientProfilePage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [patientData, appointmentsData] = await Promise.all([
                    adminService.getPatientById(patientId),
                    appointmentService.getMyAppointments(patientId),
                ]);
                setPatient(patientData);
                setAppointments(appointmentsData);
            } catch (error) {
                console.error("Error fetching patient data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-2xl font-bold">Paciente no encontrado</h2>
                <Button onClick={() => router.back()}>Volver</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 container mx-auto py-6">
            <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Patient Info Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Datos del Paciente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                                {patient.firstName[0]}{patient.lastName[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{patient.firstName} {patient.lastName}</h3>
                                <p className="text-sm text-muted-foreground">DNI: {patient.dni || '-'}</p>
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{patient.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{patient.phone || 'Sin teléfono'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{patient.birthDate ? format(new Date(patient.birthDate), 'dd/MM/yyyy') : 'Sin fecha de nac.'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{patient.insurance} {patient.insuranceNumber ? `(#${patient.insuranceNumber})` : ''}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Medical History / Appointments */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Historia Clínica (Turnos)</CardTitle>
                        <CardDescription>Historial completo de atenciones y turnos reservados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {appointments.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">Este paciente no tiene historial de turnos.</p>
                        ) : (
                            <div className="space-y-4">
                                {appointments.map((appt) => (
                                    <div key={appt.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-slate-100 p-2 rounded-md min-w-[60px] text-center">
                                                <div className="text-sm font-semibold">{format(appt.date, 'MMM', { locale: es }).toUpperCase()}</div>
                                                <div className="text-xl font-bold">{format(appt.date, 'dd')}</div>
                                                <div className="text-xs text-muted-foreground">{format(appt.date, 'yyyy')}</div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg">{appt.time} - {appt.type || 'Consulta'}</div>
                                                <div className="text-sm text-muted-foreground">Dr. {appt.doctorName}</div>
                                                {appt.medicalNotes && (
                                                    <div className="mt-2 text-sm bg-yellow-50 p-2 rounded border border-yellow-100">
                                                        <span className="font-semibold text-yellow-800">Notas:</span> {appt.medicalNotes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex gap-2 items-start justify-end">
                                            <Badge variant={
                                                appt.status === 'completed' ? 'default' :
                                                    appt.status === 'confirmed' ? 'secondary' :
                                                        appt.status === 'cancelled' ? 'destructive' : 'outline'
                                            }>
                                                {appt.status === 'completed' ? 'Atendido' :
                                                    appt.status === 'confirmed' ? 'Confirmado' :
                                                        appt.status === 'cancelled' ? 'Cancelado' :
                                                            appt.status === 'absent' ? 'Ausente' :
                                                                appt.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
