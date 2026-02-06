import { Doctor, Appointment } from "@/types";
import { addMinutes, format, isSameDay, isAfter, parse, startOfDay, isBefore } from "date-fns";

export const availabilityService = {
    getAvailableSlots(doctor: Doctor, date: Date, existingAppointments: Appointment[]): string[] {
        const slots: string[] = [];
        const { startHour, endHour, workDays } = doctor.schedule;
        const slotDuration = doctor.slotDuration;

        // 1. Validate Work Day
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
        // Our type says workDays is [1, 2, 3, 4, 5]. map 0 (Sun) to... wait, getDay returns 0 for Sun.
        // If doctor.workDays uses 1=Monday... let's assume standard JS getDay mapping match or close.
        // Usually 1=Mon, 5=Fri.
        if (!workDays.includes(dayOfWeek)) {
            return [];
        }

        // 2. Parsers for start/end time
        // We assume startHour is "HH:mm" (e.g. "09:00")
        const [startH, startM] = startHour.split(':').map(Number);
        const [endH, endM] = endHour.split(':').map(Number);

        let currentTime = new Date(date);
        currentTime.setHours(startH, startM, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endH, endM, 0, 0);

        const now = new Date();
        const isToday = isSameDay(date, now);

        // 3. Generate all possible slots
        while (isBefore(currentTime, endTime)) {
            const timeString = format(currentTime, 'HH:mm');

            // Check if slot is in the past (if today)
            let isPast = false;
            if (isToday) {
                if (isBefore(currentTime, now)) {
                    isPast = true;
                }
            }

            // Check if slot is occupied
            // An appointment occupies the slot if its time matches
            const isOccupied = existingAppointments.some(appt =>
                appt.status !== 'cancelled' && appt.time === timeString
            );

            if (!isPast && !isOccupied) {
                slots.push(timeString);
            }

            currentTime = addMinutes(currentTime, slotDuration);
        }

        return slots;
    }
};
