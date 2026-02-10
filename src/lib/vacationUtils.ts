import { Doctor } from '@/types';

/**
 * Check if a doctor is currently on vacation.
 * Returns true if vacationEnabled is ON and today's date is within [vacationStart, vacationEnd] inclusive.
 */
export function isDoctorOnVacation(doctor: Doctor): boolean {
    if (!doctor.vacationEnabled || !doctor.vacationStart || !doctor.vacationEnd) {
        return false;
    }
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return today >= doctor.vacationStart && today <= doctor.vacationEnd;
}

/**
 * Get the formatted vacation end date for display (dd/mm/aaaa).
 */
export function getVacationEndFormatted(doctor: Doctor): string {
    if (!doctor.vacationEnd) return '';
    const [year, month, day] = doctor.vacationEnd.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Get the Dr./Dra. prefix based on the doctor's gender field.
 */
export function getDoctorTitle(doctor: Doctor): string {
    return doctor.gender === 'female' ? 'Dra.' : 'Dr.';
}
