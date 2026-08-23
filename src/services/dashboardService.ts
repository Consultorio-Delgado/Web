import { adminService } from "@/services/adminService";
import { auditService } from "@/services/auditService";
import { doctorService } from "@/services/doctorService";
import { settingsService } from "@/services/settingsService";
import { distributionForPeriod } from "@/lib/timingStats";
import { computeAttendanceFromAppointments, type RawAppointmentLike } from "@/lib/attendanceStats";
import { isDoctorOnVacation } from "@/lib/vacationUtils";
import {
    DashboardOverview,
    DashboardScope,
    DoctorMonthStats,
    NewPatientEntry,
    TimingSummary,
} from "@/types/dashboard";
import { Appointment } from "@/types";
import { format } from "date-fns";

/** Convierte docs crudos del query de 6 meses a turnos con timing (sin lecturas extra). */
function rawDocsToTimedAppointments(docs: Record<string, unknown>[]): Appointment[] {
    return docs
        .filter((d) => d.status === "completed" && d.timing)
        .map((d) => {
            const dateField = d.date as { toDate?: () => Date } | undefined;
            const createdField = d.createdAt as { toDate?: () => Date } | undefined;
            const timingField = d.timing as Record<string, unknown> | undefined;
            return {
                id: d.id as string,
                ...d,
                date: dateField?.toDate?.() ?? new Date(),
                createdAt: createdField?.toDate?.() ?? new Date(),
                timing: timingField
                    ? {
                          ...timingField,
                          completedAt:
                              (timingField.completedAt as { toDate?: () => Date } | undefined)?.toDate?.() ??
                              undefined,
                      }
                    : undefined,
            } as Appointment;
        });
}

function buildTimingSummary(timed: Appointment[], prevTimed: Appointment[]): TimingSummary {
    const dist = distributionForPeriod(timed);
    const prevDist = distributionForPeriod(prevTimed);

    return {
        avgWaitingMinutes: dist ? Math.round(dist.medianWaitingSeconds / 60) : 0,
        avgConsultationMinutes: dist ? Math.round(dist.medianConsultationSeconds / 60) : 0,
        earlyPct: dist?.earlyPct ?? 0,
        latePct: dist?.latePct ?? 0,
        count: dist?.count ?? 0,
        prevMonthAvgWaitingMinutes: prevDist
            ? Math.round(prevDist.medianWaitingSeconds / 60)
            : undefined,
        prevMonthAvgConsultationMinutes: prevDist
            ? Math.round(prevDist.medianConsultationSeconds / 60)
            : undefined,
    };
}

function buildDoctorComparison(
    doctors: { id: string; lastName: string }[],
    currentMonthRaw: Record<string, unknown>[]
): DoctorMonthStats[] {
    return doctors.map((doc) => {
        const docAppts = currentMonthRaw.filter((a) => a.doctorId === doc.id);
        const attendance = computeAttendanceFromAppointments(
            docAppts as RawAppointmentLike[],
            { doctorId: doc.id }
        );

        const timed = docAppts.filter((a) => a.timing);
        const waiting = timed.map((a) => (a.timing as { waitingSeconds?: number }).waitingSeconds || 0);
        const consultation = timed.map(
            (a) => (a.timing as { consultationSeconds?: number }).consultationSeconds || 0
        );
        const avg = (nums: number[]) =>
            nums.length > 0 ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length / 60) : 0;

        return {
            doctorId: doc.id,
            doctorName: doc.lastName,
            appointments: docAppts.length,
            avgWaitingMinutes: avg(waiting),
            avgConsultationMinutes: avg(consultation),
            attendanceRate: attendance.attendanceRate,
        };
    });
}

function buildNewPatients(currentMonthRaw: Record<string, unknown>[]): NewPatientEntry[] {
    return currentMonthRaw
        .filter((a) => a.isFirstVisit && a.patientId && a.patientId !== "blocked")
        .sort(
            (a, b) =>
                (b.date as { toDate: () => Date }).toDate().getTime() -
                (a.date as { toDate: () => Date }).toDate().getTime()
        )
        .slice(0, 5)
        .map((a) => ({
            patientId: a.patientId as string,
            patientName: (a.patientName as string) || "Paciente",
            date: (a.date as { toDate: () => Date }).toDate(),
            insurance: a.insurance as string | undefined,
        }));
}

export const dashboardService = {
    async getOverview(scope: DashboardScope, doctorId?: string): Promise<DashboardOverview | null> {
        try {
            const filterDoctorId = scope === "self" ? doctorId : undefined;
            const now = new Date();

            const [stats, logs, doctors, settings] = await Promise.all([
                adminService.getDashboardStats(filterDoctorId),
                auditService.getRecentLogs(8),
                doctorService.getAllDoctors(),
                settingsService.getSettings(),
            ]);

            if (!stats) return null;

            const timedCurrent = rawDocsToTimedAppointments(stats.rawCurrentMonth ?? []);
            const timedPrevious = rawDocsToTimedAppointments(stats.rawLastMonth ?? []);

            const scopedDoctor = filterDoctorId
                ? doctors.find((d) => d.id === filterDoctorId) ?? null
                : null;

            const todayStr = format(now, "yyyy-MM-dd");
            const vacationActive = scopedDoctor ? isDoctorOnVacation(scopedDoctor) : false;
            const vacationUpcoming =
                scopedDoctor?.vacationEnabled &&
                scopedDoctor.vacationStart &&
                !vacationActive
                    ? (() => {
                          const daysUntil = Math.ceil(
                              (new Date(scopedDoctor.vacationStart!).getTime() - now.getTime()) /
                                  (1000 * 60 * 60 * 24)
                          );
                          return daysUntil > 0 && daysUntil <= 7;
                      })()
                    : false;

            return {
                scope,
                doctorId: filterDoctorId,
                kpi: stats.kpi,
                timing: buildTimingSummary(timedCurrent, timedPrevious),
                charts: stats.charts,
                recentActivity: logs.map((l: Record<string, unknown>) => ({
                    id: l.id as string,
                    action: l.action as string,
                    performedBy: l.performedBy as string,
                    timestamp: l.timestamp as Date,
                    metadata: l.metadata as Record<string, unknown> | undefined,
                })),
                doctorComparison:
                    scope === "clinic"
                        ? buildDoctorComparison(doctors, stats.rawCurrentMonth ?? [])
                        : [],
                newPatients: buildNewPatients(stats.rawCurrentMonth ?? []),
                drappUnmatchedToday: stats.drappUnmatchedToday ?? 0,
                context: {
                    settings,
                    doctors,
                    scopedDoctor,
                    vacationActive,
                    vacationUpcoming: !!vacationUpcoming,
                    exceptionalScheduleToday: scopedDoctor?.exceptionalSchedule?.some(
                        (s) => s.date === todayStr
                    ),
                },
            };
        } catch (error) {
            console.error("Error loading dashboard overview:", error);
            return null;
        }
    },
};

export function filterAppointmentsByScope(
    appointments: Appointment[],
    scope: DashboardScope,
    doctorId?: string
): Appointment[] {
    if (scope === "clinic" || !doctorId) return appointments;
    return appointments.filter((a) => a.doctorId === doctorId);
}
