import { Appointment, Doctor } from "@/types";
import { ClinicSettings } from "@/services/settingsService";

export type DashboardScope = "self" | "clinic";

export interface MonthlyKpi {
    totalAppointments: number;
    growth: number;
    absent: number;
    firstVisits: number;
}

export interface ChartData {
    insurance: { name: string; value: number; fill?: string }[];
    area: { name: string; total: number }[];
    consultationType: { name: string; value: number }[];
}

export interface TimingSummary {
    avgWaitingMinutes: number;
    avgConsultationMinutes: number;
    earlyPct: number;
    latePct: number;
    count: number;
    prevMonthAvgWaitingMinutes?: number;
    prevMonthAvgConsultationMinutes?: number;
}

export interface DashboardAlert {
    id: string;
    severity: "high" | "medium" | "low";
    title: string;
    description?: string;
    count?: number;
    href: string;
}

export interface DoctorMonthStats {
    doctorId: string;
    doctorName: string;
    appointments: number;
    avgWaitingMinutes: number;
    avgConsultationMinutes: number;
    attendanceRate: number;
}

export interface NewPatientEntry {
    patientId: string;
    patientName: string;
    date: Date;
    insurance?: string;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    performedBy: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

export interface DashboardContext {
    settings: ClinicSettings;
    doctors: Doctor[];
    scopedDoctor?: Doctor | null;
    vacationActive?: boolean;
    vacationUpcoming?: boolean;
    exceptionalScheduleToday?: boolean;
}

export interface DashboardOverview {
    scope: DashboardScope;
    doctorId?: string;
    kpi: MonthlyKpi;
    timing: TimingSummary;
    charts: ChartData;
    recentActivity: AuditLogEntry[];
    doctorComparison: DoctorMonthStats[];
    newPatients: NewPatientEntry[];
    drappUnmatchedToday: number;
    context: DashboardContext;
}
