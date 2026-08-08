import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Appointment } from "@/types";

export type PunctualityBucket = "early" | "ontime" | "late";

export interface OverallTimingStats {
    count: number;
    avgWaitingSeconds: number;
    avgConsultationSeconds: number;
    avgArrivalDeltaSeconds: number;
    punctuality: {
        early: number;
        ontime: number;
        late: number;
        earlyPct: number;
        ontimePct: number;
        latePct: number;
    };
}

export interface MonthlyTimingPoint {
    key: string; // "yyyy-MM"
    label: string; // "ene 2026"
    count: number;
    avgWaitingSeconds: number;
    avgConsultationSeconds: number;
    avgArrivalDeltaSeconds: number;
    avgWaitingMinutes: number;
    avgConsultationMinutes: number;
    avgArrivalDeltaMinutes: number;
    /** Valor absoluto del promedio de puntualidad en minutos (para la barra). */
    avgPunctualityAbsMinutes: number;
}

export interface DurationBucket {
    label: string;
    count: number;
    /** Marcador visual de quiebre (antes | tarde); no cuenta turnos. */
    isBreak?: boolean;
    /** Lado del quiebre en histograma de puntualidad. */
    side?: "early" | "late";
}

export interface MonthDistribution {
    key: string;
    label: string;
    count: number;
    punctuality: { name: string; value: number; key: PunctualityBucket; fill: string }[];
    waitingHistogram: DurationBucket[];
    consultationHistogram: DurationBucket[];
}

export interface PeriodDistribution {
    count: number;
    punctualityCategories: { name: string; value: number; key: PunctualityBucket; fill: string }[];
    waitingHistogram: DurationBucket[];
    consultationHistogram: DurationBucket[];
    /** Histograma de llegada: de más temprano a más tarde. */
    punctualityHistogram: DurationBucket[];
    /** Mediana del delta de llegada (segundos; negativo = temprano). */
    medianArrivalDeltaSeconds: number;
    medianWaitingSeconds: number;
    medianConsultationSeconds: number;
    earlyPct: number;
    latePct: number;
}

/** Buckets de 5 en 5 minutos, desde el mínimo al máximo observado. */
const PUNCT_STEP_MIN = 5;

/** Temprano incluye exactamente 0s; tarde es cualquier valor > 0. */
export function classifyPunctuality(deltaSeconds: number): PunctualityBucket {
    return deltaSeconds <= 0 ? "early" : "late";
}

function avg(nums: number[]): number {
    if (nums.length === 0) return 0;
    return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function median(nums: number[]): number {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return Math.round(sorted[mid]);
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function punctualityCounts(appts: Appointment[]) {
    let early = 0;
    let late = 0;
    for (const a of appts) {
        if (classifyPunctuality(a.timing!.arrivalDeltaSeconds || 0) === "early") early++;
        else late++;
    }
    const count = appts.length || 1;
    return {
        early,
        ontime: 0,
        late,
        earlyPct: Math.round((early / count) * 100),
        ontimePct: 0,
        latePct: Math.round((late / count) * 100),
    };
}

function punctualityPie(appts: Appointment[]) {
    const punct = punctualityCounts(appts);
    return (
        [
            { name: "Temprano / puntual", value: punct.early, key: "early" as const, fill: "#059669" },
            { name: "Tarde", value: punct.late, key: "late" as const, fill: "#ea580c" },
        ] satisfies { name: string; value: number; key: PunctualityBucket; fill: string }[]
    ).filter((d) => d.value > 0);
}

/** Buckets amplios legacy — reemplazados por histograma dinámico de 5 en 5. */
const DURATION_STEP_MIN = 5;

function durationBucketStart(mins: number): number {
    return Math.floor(Math.max(0, mins) / DURATION_STEP_MIN) * DURATION_STEP_MIN;
}

function formatDurationBucketLabel(start: number): string {
    return `${start}–${start + DURATION_STEP_MIN} min`;
}

/** Label del bucket de duración (espera/atención) que contiene estos segundos. */
export function durationBucketLabelForSeconds(totalSeconds: number): string {
    return formatDurationBucketLabel(durationBucketStart(totalSeconds / 60));
}

function histogram(secondsList: number[]): DurationBucket[] {
    if (secondsList.length === 0) return [];

    const starts = secondsList.map((sec) => durationBucketStart(sec / 60));
    const xmin = Math.min(...starts);
    const xmaxStart = Math.max(...starts);

    const counts = new Map<number, number>();
    for (let s = xmin; s <= xmaxStart; s += DURATION_STEP_MIN) {
        counts.set(s, 0);
    }
    for (const s of starts) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
    }

    const buckets: DurationBucket[] = [];
    for (let s = xmin; s <= xmaxStart; s += DURATION_STEP_MIN) {
        buckets.push({
            label: formatDurationBucketLabel(s),
            count: counts.get(s) ?? 0,
        });
    }
    return buckets;
}

/** Inicio del bucket de 5 min (en minutos). 0s → bucket [-5, 0]. */
function punctualityBucketStart(mins: number): number {
    if (mins <= 0) {
        if (mins === 0) return -PUNCT_STEP_MIN;
        return Math.floor(mins / PUNCT_STEP_MIN) * PUNCT_STEP_MIN;
    }
    // (0, 5] → 0; (5, 10] → 5; …
    return Math.ceil(mins / PUNCT_STEP_MIN) * PUNCT_STEP_MIN - PUNCT_STEP_MIN;
}

function formatPunctualityBucketLabel(start: number): string {
    const end = start + PUNCT_STEP_MIN;
    if (start < 0) {
        // start=-15, end=-10 → "10–15 ant."; start=-5, end=0 → "0–5 ant."
        const a = Math.abs(end);
        const b = Math.abs(start);
        return `${a}–${b} ant.`;
    }
    // start=0, end=5 → "0–5 tar."; start=5, end=10 → "5–10 tar."
    return `${start}–${end} tar.`;
}

/** Label del bucket de 5 min que contiene este delta (para ubicar la media en el gráfico). */
export function punctualityBucketLabelForDeltaSeconds(deltaSeconds: number): string {
    return formatPunctualityBucketLabel(punctualityBucketStart(deltaSeconds / 60));
}

/** Turnos (ya cargados) que caen en un bucket de puntualidad por label. */
export function appointmentsInPunctualityBucket(
    appts: Appointment[],
    bucketLabel: string
): Appointment[] {
    return appts.filter((a) => {
        if (!a.timing) return false;
        return punctualityBucketLabelForDeltaSeconds(a.timing.arrivalDeltaSeconds || 0) === bucketLabel;
    });
}

function punctualityHistogram(deltaSecondsList: number[]): DurationBucket[] {
    if (deltaSecondsList.length === 0) return [];

    const starts = deltaSecondsList.map((sec) => punctualityBucketStart(sec / 60));
    const xmin = Math.min(...starts);
    const xmaxStart = Math.max(...starts);

    const counts = new Map<number, number>();
    for (let s = xmin; s <= xmaxStart; s += PUNCT_STEP_MIN) {
        // No hay bucket que empiece en 0 del lado temprano: 0s ya está en -5.
        // Del lado tarde sí existe start=0 → (0, 5].
        counts.set(s, 0);
    }
    for (const s of starts) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
    }

    const buckets: DurationBucket[] = [];
    for (let s = xmin; s <= xmaxStart; s += PUNCT_STEP_MIN) {
        buckets.push({
            label: formatPunctualityBucketLabel(s),
            count: counts.get(s) ?? 0,
            side: s < 0 ? "early" : "late",
        });
    }

    return buckets;
}

export function aggregateOverall(appts: Appointment[]): OverallTimingStats | null {
    if (appts.length === 0) return null;
    return {
        count: appts.length,
        avgWaitingSeconds: avg(appts.map((a) => a.timing!.waitingSeconds || 0)),
        avgConsultationSeconds: avg(appts.map((a) => a.timing!.consultationSeconds || 0)),
        avgArrivalDeltaSeconds: avg(appts.map((a) => a.timing!.arrivalDeltaSeconds || 0)),
        punctuality: punctualityCounts(appts),
    };
}

export function aggregateByMonth(appts: Appointment[]): MonthlyTimingPoint[] {
    const byMonth = new Map<string, Appointment[]>();
    for (const a of appts) {
        const key = format(a.date, "yyyy-MM");
        const list = byMonth.get(key) ?? [];
        list.push(a);
        byMonth.set(key, list);
    }

    return Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, list]) => {
            const waiting = avg(list.map((a) => a.timing!.waitingSeconds || 0));
            const consultation = avg(list.map((a) => a.timing!.consultationSeconds || 0));
            const arrival = avg(list.map((a) => a.timing!.arrivalDeltaSeconds || 0));
            const monthDate = startOfMonth(list[0].date);
            return {
                key,
                label: format(monthDate, "MMM yyyy", { locale: es }),
                count: list.length,
                avgWaitingSeconds: waiting,
                avgConsultationSeconds: consultation,
                avgArrivalDeltaSeconds: arrival,
                avgWaitingMinutes: Math.round((waiting / 60) * 10) / 10,
                avgConsultationMinutes: Math.round((consultation / 60) * 10) / 10,
                avgArrivalDeltaMinutes: Math.round((arrival / 60) * 10) / 10,
                avgPunctualityAbsMinutes: Math.round((Math.abs(arrival) / 60) * 10) / 10,
            };
        });
}

export function distributionForMonth(appts: Appointment[], yearMonth: string): MonthDistribution | null {
    const list = appts.filter((a) => format(a.date, "yyyy-MM") === yearMonth);
    if (list.length === 0) return null;

    const monthDate = startOfMonth(list[0].date);

    return {
        key: yearMonth,
        label: format(monthDate, "MMMM yyyy", { locale: es }),
        count: list.length,
        punctuality: punctualityPie(list),
        waitingHistogram: histogram(list.map((a) => a.timing!.waitingSeconds || 0)),
        consultationHistogram: histogram(list.map((a) => a.timing!.consultationSeconds || 0)),
    };
}

/** Distribuciones del período completo (para ver outliers). */
export function distributionForPeriod(appts: Appointment[]): PeriodDistribution | null {
    if (appts.length === 0) return null;
    const waiting = appts.map((a) => a.timing!.waitingSeconds || 0);
    const consultation = appts.map((a) => a.timing!.consultationSeconds || 0);
    const arrival = appts.map((a) => a.timing!.arrivalDeltaSeconds || 0);
    const punct = punctualityCounts(appts);
    return {
        count: appts.length,
        punctualityCategories: punctualityPie(appts),
        waitingHistogram: histogram(waiting),
        consultationHistogram: histogram(consultation),
        punctualityHistogram: punctualityHistogram(arrival),
        medianArrivalDeltaSeconds: median(arrival),
        medianWaitingSeconds: median(waiting),
        medianConsultationSeconds: median(consultation),
        earlyPct: punct.earlyPct,
        latePct: punct.latePct,
    };
}
