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

        // 0. Check Exceptional Schedule (Overrides Work Day & Regular Hours)
        const exceptionalDay = doctor.exceptionalSchedule?.find(s => s.date === dateString);

        // 1. Check Exceptions (Blocked Days) - only if no exceptional schedule or if logic requires
        // If there is an exceptional schedule, we assume it's a "Working Day" with custom hours, unless blocked explicitly.
        // But usually "Exceptional Day" implies "Working".
        // Let's keep exceptionService check for global blocks or specific blocks.
        const { exceptionService } = await import('./exceptionService');
        const exceptions = await exceptionService.getByDate(dateString);
        const isBlockedGlobal = exceptions.some(e => !e.doctorId);
        const isBlockedDoctor = exceptions.some(e => e.doctorId === doctor.id);

        // 2. Validate Work Day
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const isRegularWorkDay = workDays.includes(dayOfWeek);

        const isWorkDay = exceptionalDay ? true : isRegularWorkDay;

        if (!isWorkDay || isBlockedGlobal || isBlockedDoctor) {
            if (!isWorkDay) return [];
            // If blocked by exception service, return empty or blocked slots?
            // Existing logic returns empty if not workday, but if blocked it proceeds to mark slots as blocked.
            // Let's stick to existing logic for blocks.
        }

        // 3. Parsers
        // Use Exceptional Hours if available, else Regular Hours
        const startHourToUse = exceptionalDay ? exceptionalDay.startHour : startHour;
        const endHourToUse = exceptionalDay ? exceptionalDay.endHour : endHour;

        const [startH, startM] = startHourToUse.split(':').map(Number);
        const [endH, endM] = endHourToUse.split(':').map(Number);

        let currentTime = new Date(date);
        currentTime.setHours(startH, startM, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endH, endM, 0, 0);

        const now = new Date();
        const isToday = isSameDay(date, now);
        const slots: { time: string, status: 'free' | 'occupied' | 'blocked' | 'past', appointment?: Appointment }[] = [];

        // 3. Generate slots
        while (isBefore(currentTime, endTime)) {
            const timeString = format(currentTime, 'HH:mm');
            let status: 'free' | 'occupied' | 'blocked' | 'past' = 'free';
            let appointment: Appointment | undefined = undefined;

            // Check Past
            if (isToday && isBefore(currentTime, now)) {
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

            // Check Blocked (Exception) overrides 'free' but not 'occupied' (usually)
            // But if the whole day is blocked, everything is blocked.
            if ((isBlockedGlobal || isBlockedDoctor) && status === 'free') {
                status = 'blocked';
            }

            // Mark past as past regardless of block, but occupied stays occupied
            if (isToday && isBefore(currentTime, now) && status === 'free') {
                status = 'past';
            }

            slots.push({ time: timeString, status, appointment });
            currentTime = addMinutes(currentTime, slotDuration);
        }

        return slots;
    }
};
