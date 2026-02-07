import { Doctor, Appointment } from "@/types";
import { addMinutes, format, isSameDay, isAfter, parse, startOfDay, isBefore } from "date-fns";

export const availabilityService = {
    async getAvailableSlots(doctor: Doctor, date: Date, existingAppointments: Appointment[]): Promise<string[]> {
        const slots: string[] = [];
        const { startHour, endHour, workDays } = doctor.schedule;
        const slotDuration = doctor.slotDuration;
        const dateString = format(date, 'yyyy-MM-dd');

        console.log(`[Availability] Checking for ${doctor.lastName} on ${dateString}`);
        console.log(`[Availability] Schedule: ${startHour}-${endHour}, WorkDays: ${workDays}, Duration: ${slotDuration}`);

        // 0. Check Exceptions
        const { exceptionService } = await import('./exceptions');
        const exceptions = await exceptionService.getByDate(dateString);
        console.log(`[Availability] Found ${exceptions.length} exceptions for date ${dateString}`);

        const isBlockedGlobal = exceptions.some(e => !e.doctorId);
        const isBlockedDoctor = exceptions.some(e => e.doctorId === doctor.id);

        if (isBlockedGlobal || isBlockedDoctor) {
            console.log(`[Availability] Blocked by exception`);
            return [];
        }

        // 1. Validate Work Day
        const dayOfWeek = date.getDay(); // 0 = Sunday
        console.log(`[Availability] Day of week: ${dayOfWeek}`);

        let isWorkDay = false;
        if (dayOfWeek === 0) {
            isWorkDay = workDays.includes(0);
        } else {
            isWorkDay = workDays.includes(dayOfWeek);
        }

        if (!isWorkDay) {
            console.log(`[Availability] Not a work day. WorkDays: ${workDays}, Current: ${dayOfWeek}`);
            return [];
        }

        // 2. Parsers
        const [startH, startM] = startHour.split(':').map(Number);
        const [endH, endM] = endHour.split(':').map(Number);

        let currentTime = new Date(date);
        currentTime.setHours(startH, startM, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endH, endM, 0, 0);

        console.log(`[Availability] Generating slots from ${format(currentTime, 'HH:mm')} to ${format(endTime, 'HH:mm')}`);

        const now = new Date();
        const isToday = isSameDay(date, now);

        // 3. Generate slots
        while (isBefore(currentTime, endTime)) {
            const timeString = format(currentTime, 'HH:mm');

            let isPast = false;
            // Strict past check: if today, check if slot time < now
            if (isToday && isBefore(currentTime, now)) {
                isPast = true;
            }

            const isOccupied = existingAppointments.some(appt =>
                appt.status !== 'cancelled' && appt.time === timeString
            );

            if (!isPast && !isOccupied) {
                slots.push(timeString);
            } else {
                // console.log(`[Availability] Slot ${timeString} skipped. Past: ${isPast}, Occupied: ${isOccupied}`);
            }

            currentTime = addMinutes(currentTime, slotDuration);
        }

        console.log(`[Availability] Returning ${slots.length} slots`);
        return slots;
    },
};
