"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "@/services/adminService";
import { appointmentService } from "@/services/appointments";
import { UserProfile, Appointment, AppointmentTiming } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Mail, Phone, User, FileText, Ban, ShieldOff, Pencil, X, Plus } from "lucide-react";
import { formatBirthDate, cn } from "@/lib/utils";
import { formatDuration, formatPunctuality } from "@/lib/appointmentTiming";
import { format, differenceInYears } from "date-fns";
import { Clock3, Timer as TimerIcon, Stethoscope } from "lucide-react";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { userService } from "@/services/user";
import { toast } from "sonner";
import { WhatsAppReviewButton } from "@/components/doctor/WhatsAppReviewButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PatientProfilePage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Edición manual de tiempos
    const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
    const [isNewTiming, setIsNewTiming] = useState(false);
    const [savingTiming, setSavingTiming] = useState(false);
    const [form, setForm] = useState({
        waitMin: "0", waitSec: "0",
        consMin: "0", consSec: "0",
        punctDir: "ontime" as "early" | "ontime" | "late",
        punctMin: "0", punctSec: "0",
    });

    const secToParts = (total: number) => ({
        min: Math.floor(Math.abs(total) / 60).toString(),
        sec: (Math.abs(total) % 60).toString(),
    });

    const openTimingDialog = (appt: Appointment, isNew: boolean) => {
        const t = appt.timing;
        if (t && !isNew) {
            const w = secToParts(t.waitingSeconds);
            const c = secToParts(t.consultationSeconds);
            const p = secToParts(t.arrivalDeltaSeconds);
            const dir = t.arrivalDeltaSeconds < -30 ? "early" : t.arrivalDeltaSeconds > 30 ? "late" : "ontime";
            setForm({
                waitMin: w.min, waitSec: w.sec,
                consMin: c.min, consSec: c.sec,
                punctDir: dir,
                punctMin: p.min, punctSec: p.sec,
            });
        } else {
            setForm({ waitMin: "0", waitSec: "0", consMin: "0", consSec: "0", punctDir: "ontime", punctMin: "0", punctSec: "0" });
        }
        setIsNewTiming(isNew);
        setEditingAppt(appt);
    };

    const handleSaveTiming = async () => {
        if (!editingAppt) return;
        const n = (v: string) => Math.max(0, Math.floor(Number(v) || 0));
        const waitingSeconds = n(form.waitMin) * 60 + n(form.waitSec);
        const consultationSeconds = n(form.consMin) * 60 + n(form.consSec);
        const punctAbs = n(form.punctMin) * 60 + n(form.punctSec);
        const arrivalDeltaSeconds =
            form.punctDir === "ontime" ? 0 : form.punctDir === "early" ? -punctAbs : punctAbs;
        const newTiming: AppointmentTiming = {
            arrivalDeltaSeconds,
            waitingSeconds,
            consultationSeconds,
            completedAt: editingAppt.timing?.completedAt ?? editingAppt.date,
        };
        setSavingTiming(true);
        try {
            const { deleteField } = await import("firebase/firestore");
            await appointmentService.updateAppointment(editingAppt.id, {
                timing: newTiming,
                // Limpiar campos de trabajo; se conservan `times` y su arrivedAt real si existen
                arrivalDeltaSeconds: deleteField(),
                waitingAccumulatedSeconds: deleteField(),
                consultationAccumulatedSeconds: deleteField(),
                waitingSegmentStartedAt: deleteField(),
                consultationSegmentStartedAt: deleteField(),
                consultationStartedAt: deleteField(),
            } as any);
            setAppointments(prev => prev.map(a => a.id === editingAppt.id ? { ...a, timing: newTiming } : a));
            toast.success(isNewTiming ? "Tiempos agregados" : "Tiempos actualizados");
            setEditingAppt(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar los tiempos");
        } finally {
            setSavingTiming(false);
        }
    };

    const handleDeleteTiming = async (appt: Appointment) => {
        if (!confirm("¿Borrar los tiempos de este turno? No se contabilizarán en los promedios.")) return;
        try {
            const { deleteField } = await import("firebase/firestore");
            await appointmentService.updateAppointment(appt.id, { timing: deleteField() } as any);
            setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, timing: undefined } : a));
            toast.success("Tiempos borrados");
        } catch (error) {
            console.error(error);
            toast.error("Error al borrar los tiempos");
        }
    };

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

    // Promedios de tiempos sobre turnos finalizados que tienen snapshot `timing`
    const timedAppointments = appointments.filter((a) => a.timing);
    const avgTiming = timedAppointments.length > 0
        ? {
            count: timedAppointments.length,
            waiting: Math.round(
                timedAppointments.reduce((sum, a) => sum + (a.timing!.waitingSeconds || 0), 0) / timedAppointments.length
            ),
            consultation: Math.round(
                timedAppointments.reduce((sum, a) => sum + (a.timing!.consultationSeconds || 0), 0) / timedAppointments.length
            ),
            arrivalDelta: Math.round(
                timedAppointments.reduce((sum, a) => sum + (a.timing!.arrivalDeltaSeconds || 0), 0) / timedAppointments.length
            ),
        }
        : null;

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
                                <span>{patient.birthDate ? formatBirthDate(patient.birthDate) : 'Sin fecha de nac.'}</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{patient.insurance} {patient.insuranceNumber ? `(#${patient.insuranceNumber})` : ''}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm pl-6">
                                    <span className={patient.plan ? "font-semibold text-slate-800" : "text-red-500 font-semibold text-xs"}>{patient.plan ? `Plan: ${patient.plan}` : 'PLAN NO CARGADO POR EL PACIENTE'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Botón Solicitar Reseña por WhatsApp */}
                        {patient.phone && (
                            <div className="border-t pt-4">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Reseña Google</span>
                                <WhatsAppReviewButton
                                    patientName={`${patient.firstName} ${patient.lastName}`}
                                    patientPhone={patient.phone}
                                />
                            </div>
                        )}
                        
                        {/* Manual Block Actions */}
                        {!patient.blockedUntil || (patient.blockedUntil as any).toDate?.() <= new Date() || new Date(patient.blockedUntil) <= new Date() ? (
                            <div className="border-t pt-4 space-y-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Acciones de Bloqueo</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
                                        onClick={async () => {
                                            if (!confirm("¿Seguro que desea bloquear a este paciente por 7 días?")) return;
                                            try {
                                                const nextWeek = new Date();
                                                nextWeek.setDate(nextWeek.getDate() + 7);
                                                await userService.updateUserProfile(patientId, { blockedUntil: nextWeek });
                                                setPatient(prev => prev ? { ...prev, blockedUntil: nextWeek } : null);
                                                toast.success("Paciente bloqueado por 7 días.");
                                            } catch (err) {
                                                toast.error("Error al bloquear paciente.");
                                            }
                                        }}
                                    >
                                        <Ban className="mr-1 h-3 w-3" />
                                        7 Días
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                        onClick={async () => {
                                            if (!confirm("¿Seguro que desea bloquear a este paciente PERMANENTEMENTE?")) return;
                                            try {
                                                const permanent = new Date();
                                                permanent.setFullYear(permanent.getFullYear() + 100);
                                                await userService.updateUserProfile(patientId, { blockedUntil: permanent });
                                                setPatient(prev => prev ? { ...prev, blockedUntil: permanent } : null);
                                                toast.success("Paciente bloqueado permanentemente.");
                                            } catch (err) {
                                                toast.error("Error al bloquear paciente.");
                                            }
                                        }}
                                    >
                                        <Ban className="mr-1 h-3 w-3" />
                                        Permanente
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {/* Blocked Patient Warning */}
                        {(() => {
                            const blockedDate = patient.blockedUntil 
                                ? ((patient.blockedUntil as any).toDate ? (patient.blockedUntil as any).toDate() : new Date(patient.blockedUntil))
                                : null;
                            if (!blockedDate || blockedDate <= new Date()) return null;
                            return (
                            <div className="border-t pt-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Ban className="h-5 w-5 text-red-600" />
                                        <span className="font-semibold text-red-700">
                                            {differenceInYears(blockedDate, new Date()) > 5 ? "Bloqueo Permanente" : "Paciente bloqueado"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-red-600">
                                        {differenceInYears(blockedDate, new Date()) > 5 
                                            ? "Este paciente ha sido bloqueado por administración de forma indefinida."
                                            : `Bloqueado hasta: ${format(blockedDate, "d/MM/yyyy 'a las' HH:mm", { locale: es })}`}
                                    </p>
                                    {differenceInYears(blockedDate, new Date()) <= 5 && (
                                        <p className="text-xs text-red-500">
                                            Canceló un turno con menos de 48hs de anticipación.
                                        </p>
                                    )}
                                    <Button 
                                        variant="outline" 
                                        className="w-full border-red-300 text-red-700 hover:bg-red-100"
                                        onClick={async () => {
                                            try {
                                                const { deleteField } = await import("firebase/firestore");
                                                await userService.updateUserProfile(patientId, { blockedUntil: deleteField() } as any);
                                                setPatient(prev => prev ? { ...prev, blockedUntil: undefined } : null);
                                                toast.success("Paciente desbloqueado exitosamente.");
                                            } catch (err) {
                                                console.error(err);
                                                toast.error("Error al desbloquear paciente.");
                                            }
                                        }}
                                    >
                                        <ShieldOff className="mr-2 h-4 w-4" />
                                        Desbloquear Paciente
                                    </Button>
                                </div>
                            </div>
                        );
                        })()}
                    </CardContent>
                </Card>

                {/* Medical History / Appointments */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Historia Clínica (Turnos)</CardTitle>
                        <CardDescription>Historial completo de atenciones y turnos reservados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {avgTiming && (
                            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                    <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium">
                                        <TimerIcon className="h-3.5 w-3.5" /> Espera promedio
                                    </div>
                                    <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">{formatDuration(avgTiming.waiting)}</div>
                                </div>
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                    <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium">
                                        <Stethoscope className="h-3.5 w-3.5" /> Atención promedio
                                    </div>
                                    <div className="text-2xl font-bold text-blue-800 mt-1 font-mono">{formatDuration(avgTiming.consultation)}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                                        <Clock3 className="h-3.5 w-3.5" /> Puntualidad promedio
                                    </div>
                                    <div className={cn(
                                        "text-2xl font-bold mt-1 font-mono",
                                        formatPunctuality(avgTiming.arrivalDelta).onTime ? "text-slate-700" :
                                            formatPunctuality(avgTiming.arrivalDelta).early ? "text-emerald-700" : "text-orange-700"
                                    )}>
                                        {formatPunctuality(avgTiming.arrivalDelta).label}
                                    </div>
                                </div>
                                <p className="sm:col-span-3 text-xs text-muted-foreground -mt-1">
                                    Sobre {avgTiming.count} {avgTiming.count === 1 ? "turno finalizado" : "turnos finalizados"} con registro de tiempos.
                                </p>
                            </div>
                        )}
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
                                                {appt.timing ? (
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded font-mono">
                                                            <TimerIcon className="h-3 w-3" /> Espera {formatDuration(appt.timing.waitingSeconds)}
                                                        </span>
                                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded font-mono">
                                                            <Stethoscope className="h-3 w-3" /> Atención {formatDuration(appt.timing.consultationSeconds)}
                                                        </span>
                                                        <span className={cn(
                                                            "flex items-center gap-1 px-2 py-1 rounded font-mono border",
                                                            formatPunctuality(appt.timing.arrivalDeltaSeconds).onTime ? "bg-slate-50 text-slate-600 border-slate-200" :
                                                                formatPunctuality(appt.timing.arrivalDeltaSeconds).early ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"
                                                        )}>
                                                            <Clock3 className="h-3 w-3" /> {formatPunctuality(appt.timing.arrivalDeltaSeconds).label}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => openTimingDialog(appt, false)}
                                                            className="flex items-center justify-center h-7 w-7 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                                            title="Editar tiempos"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTiming(appt)}
                                                            className="flex items-center justify-center h-7 w-7 rounded border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            title="Borrar tiempos (no cuentan en el promedio)"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ) : appt.status !== 'cancelled' ? (
                                                    <div className="mt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openTimingDialog(appt, true)}
                                                            className="flex items-center gap-1 h-7 px-2 rounded border border-dashed border-slate-300 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                                            title="Agregar tiempos manualmente"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" /> Agregar tiempos
                                                        </button>
                                                    </div>
                                                ) : null}
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
                                                                appt.status === 'arrived' ? 'En espera' :
                                                                    appt.status === 'in_consultation' ? 'En atención' :
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

            {/* Diálogo de edición manual de tiempos */}
            <Dialog open={!!editingAppt} onOpenChange={(open) => !open && setEditingAppt(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isNewTiming ? "Agregar tiempos" : "Editar tiempos"}</DialogTitle>
                        <DialogDescription>
                            {editingAppt && `Turno del ${format(editingAppt.date, "dd/MM/yyyy")} a las ${editingAppt.time}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1 text-amber-700">
                                <TimerIcon className="h-4 w-4" /> Tiempo de espera
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" min="0" value={form.waitMin} onChange={(e) => setForm(f => ({ ...f, waitMin: e.target.value }))} className="w-20" />
                                <span className="text-sm text-muted-foreground">min</span>
                                <Input type="number" min="0" max="59" value={form.waitSec} onChange={(e) => setForm(f => ({ ...f, waitSec: e.target.value }))} className="w-20" />
                                <span className="text-sm text-muted-foreground">seg</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1 text-blue-700">
                                <Stethoscope className="h-4 w-4" /> Tiempo de atención
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input type="number" min="0" value={form.consMin} onChange={(e) => setForm(f => ({ ...f, consMin: e.target.value }))} className="w-20" />
                                <span className="text-sm text-muted-foreground">min</span>
                                <Input type="number" min="0" max="59" value={form.consSec} onChange={(e) => setForm(f => ({ ...f, consSec: e.target.value }))} className="w-20" />
                                <span className="text-sm text-muted-foreground">seg</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1 text-slate-700">
                                <Clock3 className="h-4 w-4" /> Puntualidad
                            </Label>
                            <div className="flex gap-2">
                                {([
                                    { id: "early", label: "Llegó antes" },
                                    { id: "ontime", label: "En horario" },
                                    { id: "late", label: "Llegó tarde" },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, punctDir: opt.id }))}
                                        className={cn(
                                            "flex-1 h-9 rounded border text-sm transition-colors",
                                            form.punctDir === opt.id
                                                ? opt.id === "early" ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                                    : opt.id === "late" ? "bg-orange-50 border-orange-300 text-orange-700"
                                                        : "bg-slate-100 border-slate-300 text-slate-700"
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {form.punctDir !== "ontime" && (
                                <div className="flex items-center gap-2 pt-1">
                                    <Input type="number" min="0" value={form.punctMin} onChange={(e) => setForm(f => ({ ...f, punctMin: e.target.value }))} className="w-20" />
                                    <span className="text-sm text-muted-foreground">min</span>
                                    <Input type="number" min="0" max="59" value={form.punctSec} onChange={(e) => setForm(f => ({ ...f, punctSec: e.target.value }))} className="w-20" />
                                    <span className="text-sm text-muted-foreground">seg</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAppt(null)} disabled={savingTiming}>Cancelar</Button>
                        <Button onClick={handleSaveTiming} disabled={savingTiming}>
                            {savingTiming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
