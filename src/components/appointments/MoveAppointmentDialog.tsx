"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Appointment, Doctor } from "@/types";
import { MoveDayOption, summarizeMonthForMove } from "@/services/availabilityService";
import { appointmentService } from "@/services/appointments";
import { doctorService } from "@/services/doctorService";
import { exceptionService } from "@/services/exceptionService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { endOfMonth, format, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

interface MoveAppointmentDialogProps {
    appointment: Appointment | null;
    open: boolean;
    onClose: () => void;
    onMoved: () => void;
}

function normalizeTime(value: string | undefined): string {
    if (!value) return "";
    const [rawH, rawM] = value.split(":");
    const hours = Number(rawH);
    const minutes = Number(rawM);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function slotDateTime(day: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const next = new Date(day);
    next.setHours(hours, minutes, 0, 0);
    return next;
}

export function MoveAppointmentDialog({ appointment, open, onClose, onMoved }: MoveAppointmentDialogProps) {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loadingDoctor, setLoadingDoctor] = useState(false);
    const [doctorMissing, setDoctorMissing] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [byDate, setByDate] = useState<Map<string, MoveDayOption>>(new Map());
    const [loadingMonth, setLoadingMonth] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [asSobreturno, setAsSobreturno] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [customTime, setCustomTime] = useState("");
    const [saving, setSaving] = useState(false);

    const appointmentId = appointment?.id ?? null;

    useEffect(() => {
        if (!open || !appointment || !appointmentId) return;

        const rawDate = appointment.date instanceof Date ? appointment.date : new Date(appointment.date);
        const today = startOfDay(new Date());
        const initial = startOfDay(rawDate) < today ? new Date() : rawDate;

        setSelectedDate(initial);
        setVisibleMonth(startOfMonth(initial));
        setAsSobreturno(appointment.type === "Sobreturno");
        setSelectedTime(null);
        setCustomTime("");
        setDoctor(null);
        setDoctorMissing(false);
        setLoadingDoctor(true);

        doctorService.getDoctorById(appointment.doctorId)
            .then((loaded) => {
                setDoctor(loaded);
                if (!loaded) setDoctorMissing(true);
            })
            .catch(() => {
                toast.error("No se pudo cargar la agenda del profesional");
                setDoctor(null);
                setDoctorMissing(true);
            })
            .finally(() => setLoadingDoctor(false));
    }, [open, appointmentId, appointment]);

    useEffect(() => {
        if (!open || !doctor || !appointmentId || !appointment) return;
        let cancelled = false;

        const load = async () => {
            setLoadingMonth(true);
            try {
                const start = startOfMonth(visibleMonth);
                const end = endOfMonth(visibleMonth);
                const appointmentsQuery = query(
                    collection(db, "appointments"),
                    where("doctorId", "==", doctor.id),
                    where("date", ">=", Timestamp.fromDate(start)),
                    where("date", "<=", Timestamp.fromDate(end))
                );

                const [snapshot, exceptions] = await Promise.all([
                    getDocs(appointmentsQuery),
                    exceptionService.getAll(),
                ]);

                if (cancelled) return;

                const appointments = snapshot.docs
                    .filter(docSnap => docSnap.id !== appointmentId)
                    .map(docSnap => {
                        const data = docSnap.data();
                        return {
                            id: docSnap.id,
                            ...data,
                            date: data.date?.toDate?.() ?? new Date(),
                            createdAt: data.createdAt?.toDate?.() ?? new Date(),
                        } as Appointment;
                    });

                const options = summarizeMonthForMove(doctor, visibleMonth, appointments, exceptions);
                setByDate(new Map(options.map(option => [option.date, option])));
            } catch (error) {
                console.error(error);
                if (!cancelled) toast.error("No se pudieron cargar los horarios libres");
            } finally {
                if (!cancelled) setLoadingMonth(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [open, doctor, visibleMonth, appointmentId, reloadToken]);

    const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
    const dayOption = selectedKey ? byDate.get(selectedKey) : undefined;

    useEffect(() => {
        setSelectedTime(null);
        setCustomTime("");
    }, [selectedKey]);

    useEffect(() => {
        if (!asSobreturno && selectedTime && dayOption && !dayOption.freeTimes.includes(selectedTime)) {
            setSelectedTime(null);
        }
    }, [asSobreturno, selectedTime, dayOption]);

    const chosenTime = asSobreturno && customTime ? normalizeTime(customTime) : selectedTime;
    const customTimeValid = !customTime || /^\d{2}:\d{2}$/.test(normalizeTime(customTime));
    const chosenIsPast = !!(selectedDate && chosenTime && slotDateTime(selectedDate, chosenTime).getTime() < Date.now() - 60_000);

    const appointmentDate = appointment
        ? (appointment.date instanceof Date ? appointment.date : new Date(appointment.date))
        : null;
    const currentTime = normalizeTime(appointment?.time);
    const sameMoment = !!(
        appointmentDate &&
        selectedDate &&
        chosenTime &&
        isSameDay(appointmentDate, selectedDate) &&
        chosenTime === currentTime
    );
    const sameKind = asSobreturno === (appointment?.type === "Sobreturno");
    const unchanged = sameMoment && sameKind;

    const canConfirm = !!(
        appointment &&
        selectedDate &&
        chosenTime &&
        customTimeValid &&
        !chosenIsPast &&
        !unchanged &&
        !saving &&
        (asSobreturno || dayOption?.freeTimes.includes(chosenTime))
    );

    const summary = useMemo(() => {
        if (!appointment || !selectedDate || !chosenTime || !customTimeValid) return null;
        const when = format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es });
        if (sameMoment) {
            return asSobreturno
                ? "Se convierte en sobreturno, en el mismo horario. No se envía mail porque el día y la hora no cambian."
                : "Pasa a ser un turno normal, en el mismo horario. No se envía mail porque el día y la hora no cambian.";
        }
        const kind = asSobreturno ? " como sobreturno" : "";
        const mail = appointment.patientEmail
            ? " Le enviamos un mail con el horario anterior y el nuevo, sin mail de cancelación."
            : " Este paciente no tiene email: hay que avisarle por otro medio.";
        return `${appointment.patientName} pasa al ${when}, ${chosenTime} hs${kind}.${mail}`;
    }, [appointment, selectedDate, chosenTime, customTimeValid, sameMoment, asSobreturno]);

    const handleConfirm = async () => {
        if (!appointment || !selectedDate || !chosenTime || !canConfirm) return;
        setSaving(true);
        try {
            const result = await appointmentService.moveAppointment(appointment.id, {
                date: selectedDate,
                time: chosenTime,
                asSobreturno,
            });

            if (result.typeOnly) {
                toast.success(asSobreturno ? "El turno quedó como sobreturno." : "El turno quedó como turno normal.");
            } else if (result.emailSkipped) {
                toast.success("Turno movido. Este paciente no tiene email: avísele por otro medio.");
            } else if (result.emailSent) {
                toast.success("Turno movido. Le enviamos un mail con el nuevo horario.");
            } else {
                toast.warning("Turno movido, pero el mail no se pudo enviar. Avísele al paciente por otro medio.");
            }

            onMoved();
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("SLOT_TAKEN")) {
                toast.error("Ese horario se ocupó recién. Elija otro.");
                setSelectedTime(null);
                setReloadToken(token => token + 1);
            } else if (message.includes("NOT_MOVABLE")) {
                toast.error("Este turno ya no se puede mover.");
            } else if (message.includes("PAST_SLOT")) {
                toast.error("No se puede mover a un horario que ya pasó.");
            } else if (message.includes("UNCHANGED")) {
                toast.error("El turno ya está en ese horario.");
            } else {
                console.error(error);
                toast.error("No se pudo mover el turno.");
            }
        } finally {
            setSaving(false);
        }
    };

    const renderTimeButton = (time: string, kind: "free" | "occupied" | "blocked") => {
        const isCurrent = sameDayAsAppointment(selectedDate, appointmentDate) && time === currentTime;
        const selected = selectedTime === time && !customTime;
        return (
            <button
                key={`${kind}-${time}`}
                type="button"
                onClick={() => {
                    setSelectedTime(time);
                    setCustomTime("");
                }}
                className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium text-left transition-colors",
                    selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : kind === "free"
                            ? "border-green-200 bg-white text-green-800 hover:bg-green-50"
                            : kind === "occupied"
                                ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                : "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                )}
            >
                <span className="font-semibold">{time}</span>
                <span className={cn("ml-2 text-xs", selected ? "text-slate-200" : "text-current opacity-80")}>
                    {isCurrent ? "Actual" : kind === "free" ? "Libre" : kind === "occupied" ? "Ocupado" : "Bloqueado"}
                </span>
            </button>
        );
    };

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) onClose(); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mover turno</DialogTitle>
                    <DialogDescription>
                        {appointment ? (
                            <>
                                {appointment.patientName} · {appointmentDate ? format(appointmentDate, "EEEE d 'de' MMMM", { locale: es }) : ""} · {appointment.time} hs
                                {appointment.type === "Sobreturno" ? " · sobreturno" : ""}
                            </>
                        ) : "Seleccione un turno"}
                    </DialogDescription>
                </DialogHeader>

                {loadingDoctor ? (
                    <div className="h-40 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : doctorMissing || !doctor ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No se encontró la agenda de este profesional.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                            <Checkbox
                                id="move-as-sobreturno"
                                checked={asSobreturno}
                                onCheckedChange={(checked) => setAsSobreturno(checked === true)}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="move-as-sobreturno" className="font-medium cursor-pointer">
                                    Sobreturno
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {asSobreturno
                                        ? "Puede ir sobre un horario ocupado o a una hora que no está en la grilla. Queda guardado como sobreturno."
                                        : "Solo se ofrecen horarios libres. Si este turno era un sobreturno, pasa a ser un turno normal."}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Los días en verde tienen al menos un horario libre. Se puede elegir cualquier fecha futura, aunque todavía no esté abierta para que los pacientes reserven solos.
                        </p>

                        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                month={visibleMonth}
                                onMonthChange={(month) => setVisibleMonth(startOfMonth(month))}
                                fromDate={startOfDay(new Date())}
                                locale={es}
                                className="rounded-md border"
                                modifiers={{
                                    hasFree: (date) => {
                                        const option = byDate.get(format(date, "yyyy-MM-dd"));
                                        return !!option && option.freeTimes.length > 0;
                                    }
                                }}
                                modifiersStyles={{
                                    hasFree: { fontWeight: "bold", color: "#15803d" }
                                }}
                            />

                            <div className="min-h-[220px] rounded-md border p-3">
                                {loadingMonth ? (
                                    <div className="h-full min-h-[200px] flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                ) : !dayOption ? (
                                    <p className="text-sm text-muted-foreground">Seleccione un día.</p>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium capitalize">
                                            {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : ""}
                                        </p>

                                        {dayOption.isClosed && (
                                            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
                                                {dayOption.closedReason === "vacation"
                                                    ? "El profesional está de vacaciones este día."
                                                    : "Este día está bloqueado."}
                                                {asSobreturno
                                                    ? " Puede asignar un sobreturno igual, eligiendo una hora."
                                                    : " Para usarlo, márquelo como sobreturno."}
                                            </p>
                                        )}

                                        {!asSobreturno && (
                                            dayOption.freeTimes.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    No hay horarios libres este día.
                                                </p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {dayOption.freeTimes.map(time => renderTimeButton(time, "free"))}
                                                </div>
                                            )
                                        )}

                                        {asSobreturno && (
                                            <div className="space-y-3">
                                                {dayOption.gridTimes.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {dayOption.gridTimes.map(time => {
                                                            if (dayOption.isClosed || !selectedDate) return null;
                                                            if (slotDateTime(selectedDate, time).getTime() < Date.now() - 60_000) return null;
                                                            const kind = dayOption.occupiedTimes.includes(time)
                                                                ? "occupied"
                                                                : dayOption.blockedTimes.includes(time)
                                                                    ? "blocked"
                                                                    : "free";
                                                            return renderTimeButton(time, kind);
                                                        })}
                                                    </div>
                                                )}

                                                {dayOption.extraOccupiedTimes.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-muted-foreground">Horarios fuera de la grilla, ya ocupados</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {dayOption.extraOccupiedTimes
                                                                .filter(time => selectedDate && slotDateTime(selectedDate, time).getTime() >= Date.now() - 60_000)
                                                                .map(time => renderTimeButton(time, "occupied"))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-1.5 pt-1">
                                                    <Label htmlFor="custom-move-time">Otra hora</Label>
                                                    <Input
                                                        id="custom-move-time"
                                                        type="time"
                                                        value={customTime}
                                                        onChange={(event) => {
                                                            setCustomTime(event.target.value);
                                                            if (event.target.value) setSelectedTime(null);
                                                        }}
                                                        className="max-w-[160px]"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Use este campo para un sobreturno entre dos turnos, por ejemplo 11:10.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {chosenIsPast && (
                                            <p className="text-sm text-red-600">Ese horario ya pasó.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {summary && (
                            <p className="text-sm bg-slate-50 border rounded-md p-3">{summary}</p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!canConfirm} className="bg-black text-white hover:bg-slate-800">
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Confirmar cambio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function sameDayAsAppointment(selected: Date | undefined, appointmentDate: Date | null): boolean {
    if (!selected || !appointmentDate) return false;
    return isSameDay(selected, appointmentDate);
}
