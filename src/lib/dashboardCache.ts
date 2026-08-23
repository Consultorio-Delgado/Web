import { DashboardOverview, DashboardScope } from "@/types/dashboard";

const CACHE_PREFIX = "dashboard_overview_v1";
const TTL_MS = 15 * 60 * 1000; // 15 minutos — reduce lecturas al volver al tablero

interface CacheEntry {
    data: DashboardOverview;
    fetchedAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

function cacheKey(scope: DashboardScope, doctorId?: string): string {
    if (scope === "self") {
        return `${CACHE_PREFIX}:self:${doctorId ?? "unknown"}`;
    }
    return `${CACHE_PREFIX}:clinic`;
}

function reviveOverview(raw: DashboardOverview): DashboardOverview {
    return {
        ...raw,
        recentActivity: raw.recentActivity.map((log) => ({
            ...log,
            timestamp: new Date(log.timestamp),
        })),
        newPatients: raw.newPatients.map((p) => ({
            ...p,
            date: new Date(p.date),
        })),
    };
}

function isFresh(entry: CacheEntry): boolean {
    return Date.now() - entry.fetchedAt <= TTL_MS;
}

function readMemory(key: string): CacheEntry | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (!isFresh(entry)) {
        memoryCache.delete(key);
        return null;
    }
    return entry;
}

function readSession(key: string): CacheEntry | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CacheEntry;
        if (!isFresh(parsed)) {
            sessionStorage.removeItem(key);
            return null;
        }
        parsed.data = reviveOverview(parsed.data);
        return parsed;
    } catch {
        return null;
    }
}

function writeCaches(key: string, data: DashboardOverview): void {
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    memoryCache.set(key, entry);
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // quota — memoria alcanza para la sesión SPA
    }
}

export function getCachedDashboardOverview(
    scope: DashboardScope,
    doctorId?: string
): DashboardOverview | null {
    const key = cacheKey(scope, doctorId);
    const fromMemory = readMemory(key);
    if (fromMemory) return fromMemory.data;

    const fromSession = readSession(key);
    if (fromSession) {
        memoryCache.set(key, fromSession);
        return fromSession.data;
    }
    return null;
}

export function setCachedDashboardOverview(
    scope: DashboardScope,
    doctorId: string | undefined,
    data: DashboardOverview
): void {
    writeCaches(cacheKey(scope, doctorId), data);
}

export function invalidateDashboardCache(scope?: DashboardScope, doctorId?: string): void {
    if (!scope) {
        memoryCache.clear();
        if (typeof window === "undefined") return;
        try {
            Object.keys(sessionStorage)
                .filter((k) => k.startsWith(CACHE_PREFIX))
                .forEach((k) => sessionStorage.removeItem(k));
        } catch {
            // ignore
        }
        return;
    }
    const key = cacheKey(scope, doctorId);
    memoryCache.delete(key);
    if (typeof window !== "undefined") {
        try {
            sessionStorage.removeItem(key);
        } catch {
            // ignore
        }
    }
}

export const DASHBOARD_CACHE_TTL_MS = TTL_MS;
