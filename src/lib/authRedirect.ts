/** Rutas internas seguras para redirección post-login. */
export function getSafeRedirectPath(path: string | null | undefined): string | null {
    if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
    if (path.startsWith("/login") || path.startsWith("/register")) return null;
    return path;
}

export function buildLoginUrl(returnPath: string): string {
    const safePath = getSafeRedirectPath(returnPath) ?? "/portal";
    return `/login?redirect=${encodeURIComponent(safePath)}`;
}
