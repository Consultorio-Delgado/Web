import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function normalizeSearchText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export function matchesSearchQuery(fields: string[], query: string): boolean {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;

    const haystack = normalizeSearchText(fields.filter(Boolean).join(" "));

    if (haystack.includes(normalizedQuery)) return true;

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return tokens.every((token) => haystack.includes(token));
}

/** Parse YYYY-MM-DD as local date (avoids UTC timezone shift). */
export function parseBirthDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day);
}

/** Format YYYY-MM-DD to dd/MM/yyyy without timezone issues. */
export function formatBirthDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    if (!year || !month || !day) return dateStr;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}
