import { Doctor, Appointment, DayOff } from "@/types";
import { addMinutes, format, isSameDay, isAfter, parse, startOfDay, isBefore, getDaysInMonth } from "date-fns";

export type DaySlot = {
    time: string;
    status: 'free' | 'occupied' | 'blocked' | 'past';
    appointment?: Appointment;
    /** True when more than one non-cancelled patient appointment shares this time. */
    isCollision?: boolean;
};

function appointmentCreatedAtMs(appt?: Appointment): number {
    const raw = appt?.createdAt as Date | { toDate?: () => Date } | undefined;
    if (!raw) return 0;
    if (raw instanceof Date) return raw.getTime();
    if (typeof raw.toDate === 'function') return raw.toDate().getTime();
    return 0;
}

function isBlockedAppointment(appt: Appointment): boolean {
    return appt.type === 'Bloqueado' || appt.patientId === 'blocked';
}

/** Grilla real del médico ese día (jornada habitual + horario excepcional). Sin ventana de apertura. */
export function buildGridTimes(doctor: Doctor, date: Date): string[] {
    const { workDays } = doctor.schedule;
    const slotDuration = doctor.slotDuration || 20;
    const dateString = format(date, 'yyyy-MM-dd');
    const exceptionalDay = doctor.exceptionalSchedule?.find(s => s.date === dateString);
    const dayOfWeek = date.getDay();
    const isRegularWorkDay = workDays.includes(dayOfWeek);
    const slotTimes: string[] = [];

    if (isRegularWorkDay) {
        let startH: number, startM: number, endH: number, endM: number;

        if (doctor.schedule.dayRanges && doctor.schedule.dayRanges[dayOfWeek]) {
            const dayRange = doctor.schedule.dayRanges[dayOfWeek];
            [startH, startM] = dayRange.startHour.split(':').map(Number);
            [endH, endM] = dayRange.endHour.split(':').map(Number);
        } else if (doctor.schedule.startHour && doctor.schedule.endHour) {
            [startH, startM] = doctor.schedule.startHour.split(':').map(Number);
            [endH, endM] = doctor.schedule.endHour.split(':').map(Number);
        } else {
            startH = 9; startM = 0;
            endH = 17; endM = 0;
        }

        let currentTime = new Date(date);
        currentTime.setHours(startH, startM, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endH, endM, 0, 0);

        while (isBefore(currentTime, endTime)) {
            slotTimes.push(format(currentTime, 'HH:mm'));
            currentTime = addMinutes(currentTime, slotDuration);
        }
    }

    if (exceptionalDay) {
        const [exStartH, exStartM] = exceptionalDay.startHour.split(':').map(Number);
        const [exEndH, exEndM] = exceptionalDay.endHour.split(':').map(Number);

        let exCurrentTime = new Date(date);
        exCurrentTime.setHours(exStartH, exStartM, 0, 0);

        const exEndTime = new Date(date);
        exEndTime.setHours(exEndH, exEndM, 0, 0);

        while (isBefore(exCurrentTime, exEndTime)) {
            const timeStr = format(exCurrentTime, 'HH:mm');
            if (!slotTimes.includes(timeStr)) {
                slotTimes.push(timeStr);
            }
            exCurrentTime = addMinutes(exCurrentTime, slotDuration);
        }
    }

    slotTimes.sort();
    return slotTimes;
}

export type MoveDayOption = {
    date: string;
    isClosed: boolean;
    closedReason?: 'blocked' | 'vacation';
    /** Horarios de la grilla, ocupados o no. */
    gridTimes: string[];
    freeTimes: string[];
    /** Horarios de grilla con al menos un paciente. */
    occupiedTimes: string[];
    /** Horarios de grilla solo bloqueados (sin paciente). */
    blockedTimes: string[];
    /** Sobreturnos u otros turnos fuera de la grilla. */
    extraOccupiedTimes: string[];
};

/**
 * Días del mes con horarios libres para que un médico mueva un turno.
 * No aplica maxDaysAhead ni la apertura quincenal: eso solo limita la reserva del paciente.
 * El turno que se está moviendo debe excluirse antes de llamar, para que su hueco figure libre.
 */
export function summarizeMonthForMove(
    doctor: Doctor,
    month: Date,
    appointments: Appointment[],
    exceptions: DayOff[],
    now: Date = new Date()
): MoveDayOption[] {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const days = getDaysInMonth(month);
    const options: MoveDayOption[] = [];

    for (let day = 1; day <= days; day++) {
        const date = new Date(year, monthIndex, day);
        const dateString = format(date, 'yyyy-MM-dd');
        const gridTimes = buildGridTimes(doctor, date);

        const dayException = exceptions.find(exc =>
            exc.date === dateString && (!exc.doctorId || exc.doctorId === doctor.id)
        );
        let isClosed = !!dayException;
        let closedReason: MoveDayOption['closedReason'] = dayException ? 'blocked' : undefined;

        if (doctor.vacationEnabled && doctor.vacationStart && doctor.vacationEnd) {
            if (dateString >= doctor.vacationStart && dateString <= doctor.vacationEnd) {
                isClosed = true;
                closedReason = 'vacation';
            }
        }

        const dayAppointments = appointments.filter(appt =>
            appt.doctorId === doctor.id &&
            appt.status !== 'cancelled' &&
            isSameDay(appt.date, date)
        );

        const occupied = new Set<string>();
        const blockedOnly = new Set<string>();
        const extraOccupied: string[] = [];

        const byTime = new Map<string, Appointment[]>();
        for (const appt of dayAppointments) {
            const list = byTime.get(appt.time) || [];
            list.push(appt);
            byTime.set(appt.time, list);
        }

        for (const [time, appts] of byTime) {
            const patients = appts.filter(a => !isBlockedAppointment(a));
            const onGrid = gridTimes.includes(time);
            if (patients.length > 0) {
                occupied.add(time);
                if (!onGrid) extraOccupied.push(time);
            } else if (appts.some(isBlockedAppointment)) {
                blockedOnly.add(time);
            }
        }

        const freeTimes: string[] = [];
        if (!isClosed) {
            for (const time of gridTimes) {
                if (occupied.has(time) || blockedOnly.has(time)) continue;
                const [h, m] = time.split(':').map(Number);
                const slotDate = new Date(date);
                slotDate.setHours(h, m, 0, 0);
                if (isBefore(slotDate, now)) continue;
                freeTimes.push(time);
            }
        }

        extraOccupied.sort();

        options.push({
            date: dateString,
            isClosed,
            closedReason,
            gridTimes,
            freeTimes,
            occupiedTimes: gridTimes.filter(t => occupied.has(t)),
            blockedTimes: gridTimes.filter(t => blockedOnly.has(t)),
            extraOccupiedTimes: extraOccupied,
        });
    }

    return options;
}

export const availabilityService = {
    async getAvailableSlots(doctor: Doctor, date: Date, existingAppointments: Appointment[]): Promise<string[]> {
        const fullSlots = await this.getAllDaySlots(doctor, date, existingAppointments);
        // A time is free only if no slot row for that time is occupied/blocked
        const busyTimes = new Set(
            fullSlots.filter(s => s.status === 'occupied' || s.status === 'blocked').map(s => s.time)
        );
        return [...new Set(fullSlots.filter(s => s.status === 'free' && !busyTimes.has(s.time)).map(s => s.time))];
    },

    async getAllDaySlots(doctor: Doctor, date: Date, existingAppointments: Appointment[]): Promise<DaySlot[]> {
        const { workDays } = doctor.schedule;
        const dateString = format(date, 'yyyy-MM-dd');

        // 0. Get Exceptional Schedule
        const exceptionalDay = doctor.exceptionalSchedule?.find(s => s.date === dateString);

        // 1. Check Exceptions (Blocked Days - Global or Doctor specific)
        const { exceptionService } = await import('./exceptionService');
        const exceptions = await exceptionService.getByDate(dateString);
        const isBlockedGlobal = exceptions.some(e => !e.doctorId);
        let isBlockedDoctor = exceptions.some(e => e.doctorId === doctor.id);

        // 1.1 Check Vacation (Blocking)
        if (doctor.vacationEnabled && doctor.vacationStart && doctor.vacationEnd) {
            if (dateString >= doctor.vacationStart && dateString <= doctor.vacationEnd) {
                isBlockedDoctor = true;
            }
        }

        // 2. Validate Work Day (Regular)
        const isRegularWorkDay = workDays.includes(date.getDay());

        // Usage: If blocked globally or by doctor specific block (not vacation/exception), return empty or blocked.
        // If simply not a work day and no exception, return empty.

        if (!isRegularWorkDay && !exceptionalDay) {
            // Check if there are appointments on this day (e.g. Sobreturnos on a Sunday)
            const hasAppointments = existingAppointments.some(a =>
                a.doctorId === doctor.id && a.status !== 'cancelled'
            );

            // If NO appointments and NOT a work day, THEN return empty.
            if (!hasAppointments) {
                return [];
            }
        }


        const slotTimes = buildGridTimes(doctor, date);

        // 4. Build Result — one UI row per patient appointment (show collisions instead of hiding them)
        const now = new Date();
        const isToday = isSameDay(date, now);
        const slots: DaySlot[] = [];

        for (const timeString of slotTimes) {
            const [h, m] = timeString.split(':').map(Number);
            const slotDate = new Date(date);
            slotDate.setHours(h, m, 0, 0);

            const allApptAtTime = existingAppointments.filter(appt =>
                appt.status !== 'cancelled' &&
                appt.time === timeString &&
                appt.doctorId === doctor.id
            );

            const patientAppts = allApptAtTime
                .filter(a => !isBlockedAppointment(a))
                .sort((a, b) => appointmentCreatedAtMs(a) - appointmentCreatedAtMs(b));
            const blockedAppt = allApptAtTime.find(isBlockedAppointment);

            if (patientAppts.length > 0) {
                const isCollision = patientAppts.length > 1;
                for (const appt of patientAppts) {
                    slots.push({
                        time: timeString,
                        status: 'occupied',
                        appointment: appt,
                        isCollision,
                    });
                }
                continue;
            }

            if (blockedAppt) {
                slots.push({
                    time: timeString,
                    status: 'blocked',
                    appointment: blockedAppt,
                });
                continue;
            }

            let status: DaySlot['status'] = 'free';
            if ((isBlockedGlobal || isBlockedDoctor)) {
                status = 'blocked';
            } else if (isToday && isBefore(slotDate, now)) {
                status = 'past';
            }

            slots.push({ time: timeString, status });
        }

        // 4.1 Inject Sobreturnos (or any appointment not in grid)
        const slottedTimes = new Set(slots.map(s => s.time));
        const extraAppointments = existingAppointments.filter(appt =>
            appt.doctorId === doctor.id &&
            appt.status !== 'cancelled' &&
            !slottedTimes.has(appt.time)
        );

        // Group extras by time so simultaneous sobreturnos all appear
        const extrasByTime = new Map<string, Appointment[]>();
        for (const appt of extraAppointments) {
            const list = extrasByTime.get(appt.time) || [];
            list.push(appt);
            extrasByTime.set(appt.time, list);
        }

        for (const [time, apptsAtTime] of extrasByTime) {
            const patientAppts = apptsAtTime
                .filter(a => !isBlockedAppointment(a))
                .sort((a, b) => appointmentCreatedAtMs(a) - appointmentCreatedAtMs(b));
            const blockedAppt = apptsAtTime.find(isBlockedAppointment);

            if (patientAppts.length > 0) {
                const isCollision = patientAppts.length > 1;
                for (const appt of patientAppts) {
                    slots.push({
                        time,
                        status: 'occupied',
                        appointment: appt,
                        isCollision,
                    });
                }
            } else if (blockedAppt) {
                slots.push({
                    time,
                    status: 'blocked',
                    appointment: blockedAppt,
                });
            }
        }

        // 5. Final Sort (stable: time, then creation order already applied within collisions)
        slots.sort((a, b) => {
            const byTime = a.time.localeCompare(b.time);
            if (byTime !== 0) return byTime;
            return appointmentCreatedAtMs(a.appointment) - appointmentCreatedAtMs(b.appointment);
        });

        return slots;
    }
};
