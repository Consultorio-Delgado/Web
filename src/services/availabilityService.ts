import { Doctor, Appointment } from "@/types";
import { addMinutes, format, isSameDay, isAfter, parse, startOfDay, isBefore } from "date-fns";

export const availabilityService = {
    async getAvailableSlots(doctor: Doctor, date: Date, existingAppointments: Appointment[]): Promise<string[]> {
        const slots: string[] = [];
        const { startHour, endHour, workDays } = doctor.schedule;
        const slotDuration = doctor.slotDuration;

        // 0. Check Exceptions (Blocked Days)
        // We need to fetch exceptions. Since this is now async, we update the signature.
        // Ideally, we should pass exceptions as an argument to keep this pure, but for now let's fetch here or assume passed.
        // Refactor: We will convert this to async and fetch exceptions.

        // However, to avoid circular deps or complex refactors in BookingWizard right now, 
        // let's assume the caller passes the blocked status OR we act async.
        // The previous signature was synchronous? No, it was just "getAvailableSlots". 
        // Usage in BookingWizard: "const slots = availabilityService.getAvailableSlots(...)" -> It was sync!
        // We need to change it to async to fetch exceptions, OR fetch exceptions in BookingWizard and pass them.

        // Strategy: Make it async. 

        const dateString = format(date, 'yyyy-MM-dd');
        // This import will look like a circular dependency if not careful, but services usually don't depend on each other cyclically.
        // Let's use dynamic import or just standard import. 
        const { exceptionService } = await import('./exceptions');
        const exceptions = await exceptionService.getByDate(dateString);

        const isBlockedGlobal = exceptions.some(e => !e.doctorId);
        const isBlockedDoctor = exceptions.some(e => e.doctorId === doctor.id);

        if (isBlockedGlobal || isBlockedDoctor) {
            return [];
        }

        // 1. Validate Work Day
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
        // Our type says workDays is [1, 2, 3, 4, 5]. map 0 (Sun) to... wait, getDay returns 0 for Sun.
        // If doctor.workDays uses 1=Monday... let's assume standard JS getDay mapping match or close.
        // Usually 1=Mon, 5=Fri.
        if (dayOfWeek === 0) { // Sunday
            if (!workDays.includes(0)) return [];
        } else {
            if (!workDays.includes(dayOfWeek)) return [];
        }

        // ... rest of logic ...
        // 2. Parsers for start/end time
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
            const isOccupied = existingAppointments.some(appt =>
                appt.status !== 'cancelled' && appt.time === timeString
            );

            if (!isPast && !isOccupied) {
                slots.push(timeString);
            }

            currentTime = addMinutes(currentTime, slotDuration);
        }

        return slots;
    },
};
