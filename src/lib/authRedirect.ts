import type { Role } from "@/types";

/** Rutas internas seguras para redirección post-login. */
export function getSafeRedirectPath(path: string | null | undefined): string | null {
    if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
    if (path.startsWith("/login") || path.startsWith("/register")) return null;
    return path;
}

function isDoctorRoute(path: string): boolean {
    return path.startsWith("/doctor") || path.startsWith("/admin");
}

/** Devuelve el redirect solo si el rol del usuario puede acceder a esa ruta. */
export function getRoleAllowedRedirectPath(
    path: string | null | undefined,
    role: Role | undefined
): string | null {
    const safePath = getSafeRedirectPath(path);
    if (!safePath) return null;

    if (isDoctorRoute(safePath)) {
        if (role === "doctor" || role === "admin") return safePath;
        return null;
    }

    return safePath;
}

export function buildLoginUrl(returnPath: string): string {
    const safePath = getSafeRedirectPath(returnPath) ?? "/portal";
    return `/login?redirect=${encodeURIComponent(safePath)}`;
}
