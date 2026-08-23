import { format } from "date-fns";
import { AppointmentStatus } from "@/types";

export const ATTENDED_STATUSES: AppointmentStatus[] = [
    "completed",
    "arrived",
    "in_consultation",
];

export interface RawAppointmentLike {
    doctorId?: string;
    patientId?: string;
    type?: string;
    status?: string;
    date?: Date | { toDate: () => Date };
    time?: string;
}

export interface AttendanceSlotStats {
    attended: number;
    absent: number;
    /** Cancelación sin reemplazo en el mismo horario. */
    free: number;
    /** Horarios pasados sin marcar (pending/confirmed). */
    unresolved: number;
    attendanceRate: number;
}

function toDate(raw: RawAppointmentLike["date"]): Date | null {
    if (!raw) return null;
    if (raw instanceof Date) return raw;
    if (raw && typeof (raw as { toDate?: () => Date }).toDate === "function") {
        return (raw as { toDate: () => Date }).toDate();
    }
    return new Date(raw as unknown as string);
}

export function isPatientAppointment(a: RawAppointmentLike): boolean {
    if (!a.patientId || a.patientId === "blocked") return false;
    if (a.type === "Bloqueado") return false;
    return true;
}

export function slotKey(a: RawAppointmentLike): string | null {
    if (!a.doctorId || !a.time) return null;
    const d = toDate(a.date);
    if (!d) return null;
    return `${a.doctorId}|${format(d, "yyyy-MM-dd")}|${a.time}`;
}

export function slotDateTime(a: RawAppointmentLike): Date | null {
    if (!a.time) return null;
    const d = toDate(a.date);
    if (!d) return null;
    const [h, m] = a.time.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const dt = new Date(d);
    dt.setHours(h, m, 0, 0);
    return dt;
}

type SlotOutcome = "attended" | "absent" | "free" | "unresolved";

function classifySlot(appts: RawAppointmentLike[]): SlotOutcome {
    const patients = appts.filter(isPatientAppointment);
    if (patients.length === 0) return "unresolved";

    if (patients.some((a) => ATTENDED_STATUSES.includes(a.status as AppointmentStatus))) {
        return "attended";
    }
    if (patients.some((a) => a.status === "absent")) {
        return "absent";
    }
    if (patients.every((a) => a.status === "cancelled")) {
        return "free";
    }
    return "unresolved";
}

/**
 * Asistencia por casillero (fecha + hora + médico):
 * asistieron / (asistieron + ausentes + libres)
 *
 * - Canceló y el horario se reocupó con alguien que vino → cuenta como asistido.
 * - Canceló y quedó vacío → casillero libre (no es ausentismo).
 * - Horarios futuros o sin cerrar → no entran al cálculo.
 */
export function computeAttendanceFromAppointments(
    appointments: RawAppointmentLike[],
    options?: { now?: Date; onlyPast?: boolean; doctorId?: string }
): AttendanceSlotStats {
    const now = options?.now ?? new Date();
    const onlyPast = options?.onlyPast ?? true;

    const bySlot = new Map<string, RawAppointmentLike[]>();

    for (const appt of appointments) {
        if (options?.doctorId && appt.doctorId !== options.doctorId) continue;

        const key = slotKey(appt);
        if (!key) continue;

        if (onlyPast) {
            const dt = slotDateTime(appt);
            if (!dt || dt >= now) continue;
        }

        const list = bySlot.get(key) ?? [];
        list.push(appt);
        bySlot.set(key, list);
    }

    let attended = 0;
    let absent = 0;
    let free = 0;
    let unresolved = 0;

    for (const appts of bySlot.values()) {
        switch (classifySlot(appts)) {
            case "attended":
                attended++;
                break;
            case "absent":
                absent++;
                break;
            case "free":
                free++;
                break;
            case "unresolved":
                unresolved++;
                break;
        }
    }

    const denominator = attended + absent + free;
    const attendanceRate =
        denominator > 0 ? Math.round((attended / denominator) * 100) : 100;

    return { attended, absent, free, unresolved, attendanceRate };
}
