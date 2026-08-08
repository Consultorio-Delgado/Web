import { differenceInSeconds } from "date-fns";
import { Appointment } from "@/types";

// Formatea segundos como "MM:SS" (o "HH:MM:SS" si supera la hora).
export function formatDuration(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
}

// Texto de puntualidad a partir del delta (negativo = llegó temprano).
// Sin margen: 0 = en horario, <0 = antes, >0 = tarde.
export function formatPunctuality(deltaSeconds: number): { label: string; early: boolean; onTime: boolean } {
    if (deltaSeconds === 0) return { label: "En horario", early: false, onTime: true };
    const early = deltaSeconds < 0;
    const abs = Math.abs(deltaSeconds);
    return {
        label: `${formatDuration(abs)} ${early ? "antes" : "tarde"}`,
        early,
        onTime: false,
    };
}

// Segundos de espera vivos (acumulado + segmento abierto si está en espera).
export function computeWaitingSeconds(appt: Appointment, now: Date = new Date()): number {
    if (appt.timing) return appt.timing.waitingSeconds;
    const accumulated = appt.waitingAccumulatedSeconds || 0;
    if (appt.status === "arrived") {
        // Fallback a arrivedAt para turnos marcados antes de existir el segmento.
        const segmentStart = appt.waitingSegmentStartedAt ?? appt.arrivedAt;
        if (segmentStart) {
            return accumulated + Math.max(0, differenceInSeconds(now, segmentStart));
        }
    }
    return accumulated;
}

// Segundos de atención vivos (acumulado + segmento abierto si está en consultorio).
export function computeConsultationSeconds(appt: Appointment, now: Date = new Date()): number {
    if (appt.timing) return appt.timing.consultationSeconds;
    const accumulated = appt.consultationAccumulatedSeconds || 0;
    if (appt.status === "in_consultation" && appt.consultationSegmentStartedAt) {
        return accumulated + Math.max(0, differenceInSeconds(now, appt.consultationSegmentStartedAt));
    }
    return accumulated;
}

export function getArrivalDelta(appt: Appointment): number | undefined {
    if (appt.timing) return appt.timing.arrivalDeltaSeconds;
    return appt.arrivalDeltaSeconds;
}
