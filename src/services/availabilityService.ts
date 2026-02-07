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

        // 0. Check Exceptions
        const { exceptionService } = await import('./exceptionService');
        const exceptions = await exceptionService.getByDate(dateString);
        const isBlockedGlobal = exceptions.some(e => !e.doctorId);
        const isBlockedDoctor = exceptions.some(e => e.doctorId === doctor.id);

        // 1. Validate Work Day
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const isWorkDay = workDays.includes(dayOfWeek);

        if (!isWorkDay || isBlockedGlobal || isBlockedDoctor) {
            // If marked as blocked explicitly in exceptions, return entire day as blocked?
            // Or just return empty if it's not a work day.
            // Requirement: "si esta bloqueado, poner un boton que diga desbloquear"
            // So we need to return distinct state for blocked vs non-work day.
            // For now, let's treat them similarly for slot generation (no slots), 
            // but the UI will handle the "Unlock" button based on the *Day* status, not slots.
            // However, for the "Day View" listing, if it blocked, we might want to show slots as "Blocked"?
            // Let's generate slots anyway but mark them as blocked if it is a workday but has an exception.
            if (!isWorkDay) return [];
            // If it IS a workday but blocked by exception, we proceed but mark status as blocked.
        }

        // 2. Parsers
        const [startH, startM] = startHour.split(':').map(Number);
        const [endH, endM] = endHour.split(':').map(Number);

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
                status = 'occupied';
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
