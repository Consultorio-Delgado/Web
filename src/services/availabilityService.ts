import { Doctor, Appointment } from "@/types";
import { addMinutes, format, isSameDay, isAfter, parse, startOfDay, isBefore } from "date-fns";

export const availabilityService = {
    async getAvailableSlots(doctor: Doctor, date: Date, existingAppointments: Appointment[]): Promise<string[]> {
        const fullSlots = await this.getAllDaySlots(doctor, date, existingAppointments);
        return fullSlots
            .filter(s => s.status === 'free')
            .map(s => s.time);
    },

    async getAllDaySlots(doctor: Doctor, date: Date, existingAppointments: Appointment[]): Promise<{ time: string, status: 'free' | 'occupied' | 'blocked' | 'past', appointment?: Appointment }[]> {
        const { startHour, endHour, workDays } = doctor.schedule;
        const slotDuration = doctor.slotDuration;
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
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const isRegularWorkDay = workDays.includes(dayOfWeek);

        // Usage: If blocked globally or by doctor specific block (not vacation/exception), return empty or blocked.
        // If simply not a work day and no exception, return empty.

        if (!isRegularWorkDay && !exceptionalDay) {
            return [];
        }

        // 3. Generate Slots
        let slotTimes: string[] = [];

        // 3.1 Regular Slots
        if (isRegularWorkDay) {
            const [startH, startM] = startHour.split(':').map(Number);
            const [endH, endM] = endHour.split(':').map(Number);

            let currentTime = new Date(date);
            currentTime.setHours(startH, startM, 0, 0);

            const endTime = new Date(date);
            endTime.setHours(endH, endM, 0, 0);

            while (isBefore(currentTime, endTime)) {
                slotTimes.push(format(currentTime, 'HH:mm'));
                currentTime = addMinutes(currentTime, slotDuration);
            }
        }

        // 3.2 Exceptional Slots
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

        // Sort slots
        slotTimes.sort();

        // 4. Build Result
        const now = new Date();
        const isToday = isSameDay(date, now);
        const slots: { time: string, status: 'free' | 'occupied' | 'blocked' | 'past', appointment?: Appointment }[] = [];

        for (const timeString of slotTimes) {
            let status: 'free' | 'occupied' | 'blocked' | 'past' = 'free';
            let appointment: Appointment | undefined = undefined;

            const [h, m] = timeString.split(':').map(Number);
            const slotDate = new Date(date);
            slotDate.setHours(h, m, 0, 0);

            // Check Past
            if (isToday && isBefore(slotDate, now)) {
                status = 'past';
            }

            // Check Occupied
            const foundAppt = existingAppointments.find(appt =>
                appt.status !== 'cancelled' && appt.time === timeString
            );

            if (foundAppt) {
                if (foundAppt.type === 'Bloqueado' || foundAppt.patientId === 'blocked') {
                    status = 'blocked';
                } else {
                    status = 'occupied';
                }
                appointment = foundAppt;
            }

            // Check Blocked (Exception/Vacation)
            // If the day is blocked, everything is blocked.
            if ((isBlockedGlobal || isBlockedDoctor) && status === 'free') {
                status = 'blocked';
            }

            // Mark past as past regardless of block, but occupied stays occupied
            if (isToday && isBefore(slotDate, now) && status === 'free') {
                status = 'past';
            }

            slots.push({ time: timeString, status, appointment });
        }

        return slots;
    }
};
