export interface CrashReport {
    name: string;
    message: string;
    stack?: string;
    url: string;
    userAgent: string;
    userId?: string;
    userEmail?: string;
}

export const reportService = {
    async submitErrorReport(error: Error, extra?: { userId?: string; userEmail?: string }) {
        try {
            const url = typeof window !== "undefined" ? window.location.href : "N/A";
            const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "N/A";

            const response = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: `CRASH REPORT: ${error.name}: ${error.message}\n\nStack: ${error.stack}`,
                    pathname: url,
                    userId: extra?.userId,
                    email: extra?.userEmail,
                    userAgent: userAgent,
                    ticketId: `CRASH-${Date.now()}`, // Temporary ID prefix, API will generate real ID
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to report crash via API");
            }

            const result = await response.json();
            return result.ticketId;
        } catch (err) {
            console.error("Error submitting crash report:", err);
            throw err;
        }
    },
};
