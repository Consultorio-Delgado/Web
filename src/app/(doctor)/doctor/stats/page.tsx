"use client";

import { useEffect, useMemo, useState } from "react";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointments";
import { Doctor, Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { subMonths, subYears, endOfDay } from "date-fns";
import {
    aggregateByMonth,
    distributionForMonth,
    distributionForPeriod,
} from "@/lib/timingStats";
import { MonthlyTimingChart } from "@/components/doctor/MonthlyTimingChart";
import { MonthTimingDrilldown } from "@/components/doctor/MonthTimingDrilldown";
import { PeriodTimingDistributions } from "@/components/doctor/PeriodTimingDistributions";

type PeriodKey = "all" | "year" | "semester" | "month";

const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: "all", label: "Todo" },
    { key: "year", label: "Último año" },
    { key: "semester", label: "Último semestre" },
    { key: "month", label: "Último mes" },
];

function periodStart(period: PeriodKey): Date | null {
    const now = new Date();
    if (period === "all") return null;
    if (period === "year") return subYears(now, 1);
    if (period === "semester") return subMonths(now, 6);
    return subMonths(now, 1);
}

function doctorColumnLabel(doc: Doctor): string {
    const isSecondi = doc.id === "secondi" || doc.lastName?.toLowerCase().includes("secondi");
    const prefix = isSecondi ? "Dra." : "Dr.";
    return `${prefix} ${doc.lastName}`;
}

/** Capparelli a la izquierda, Secondi a la derecha; resto alfabético. */
function sortDoctorsForColumns(list: Doctor[]): Doctor[] {
    const rank = (d: Doctor) => {
        const id = d.id.toLowerCase();
        const ln = d.lastName.toLowerCase();
        if (id === "capparelli" || ln.includes("capparelli")) return 0;
        if (id === "secondi" || ln.includes("secondi")) return 1;
        return 2;
    };
    return [...list].sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        return a.lastName.localeCompare(b.lastName, "es");
    });
}

function DoctorStatsColumn({
    doctor,
    appointments,
    selectedMonth,
    onSelectMonth,
}: {
    doctor: Doctor;
    appointments: Appointment[];
    selectedMonth: string | null;
    onSelectMonth: (key: string | null) => void;
}) {
    const monthly = useMemo(() => aggregateByMonth(appointments), [appointments]);
    const periodDist = useMemo(() => distributionForPeriod(appointments), [appointments]);
    const drilldown = useMemo(
        () => (selectedMonth ? distributionForMonth(appointments, selectedMonth) : null),
        [appointments, selectedMonth]
    );

    return (
        <section className="space-y-4 min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {doctorColumnLabel(doctor)}
            </h2>

            {!periodDist ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Todavía no hay turnos con tiempos registrados en este período.
                    </p>
                </div>
            ) : (
                <>
                    <MonthlyTimingChart
                        data={monthly}
                        selectedKey={selectedMonth}
                        onSelectMonth={(key) =>
                            onSelectMonth(selectedMonth === key ? null : key)
                        }
                        compact
                    />
                    {drilldown && (
                        <MonthTimingDrilldown
                            distribution={drilldown}
                            onClose={() => onSelectMonth(null)}
                        />
                    )}
                    <PeriodTimingDistributions
                        distribution={periodDist}
                        appointments={appointments}
                        compact
                    />
                </>
            )}
        </section>
    );
}

export default function DoctorStatsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [period, setPeriod] = useState<PeriodKey>("month");
    const [byDoctor, setByDoctor] = useState<Record<string, Appointment[]>>({});
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState<Record<string, string | null>>({});

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingDoctors(true);
            try {
                const list = await doctorService.getAllDoctors();
                if (cancelled) return;
                setDoctors(sortDoctorsForColumns(list));
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setLoadingDoctors(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (doctors.length === 0) return;
        let cancelled = false;
        (async () => {
            setLoadingData(true);
            setSelectedMonths({});
            try {
                const start = periodStart(period);
                const end = endOfDay(new Date());
                const results = await Promise.all(
                    doctors.map(async (doc) => {
                        const data = await appointmentService.getTimedAppointments(doc.id, start, end);
                        return [doc.id, data] as const;
                    })
                );
                if (cancelled) return;
                setByDoctor(Object.fromEntries(results));
            } catch (e) {
                console.error(e);
                if (!cancelled) setByDoctor({});
            } finally {
                if (!cancelled) setLoadingData(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [doctors, period]);

    if (loadingDoctors) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (doctors.length === 0) {
        return (
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
                <p className="text-muted-foreground">No se encontraron doctores.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
                    <p className="text-muted-foreground">
                        Tiempos de espera, atención y puntualidad por doctor.
                    </p>
                </div>
                <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1 lg:mt-1">
                    {PERIODS.map((p) => (
                        <Button
                            key={p.key}
                            size="sm"
                            variant="ghost"
                            className={cn(
                                "h-8 px-3 text-xs sm:text-sm",
                                period === p.key && "bg-background shadow-sm font-semibold"
                            )}
                            onClick={() => setPeriod(p.key)}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>

            {loadingData ? (
                <div className="flex h-[40vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-6">
                    {doctors.map((doc) => (
                        <DoctorStatsColumn
                            key={doc.id}
                            doctor={doc}
                            appointments={byDoctor[doc.id] ?? []}
                            selectedMonth={selectedMonths[doc.id] ?? null}
                            onSelectMonth={(key) =>
                                setSelectedMonths((prev) => ({ ...prev, [doc.id]: key }))
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
