export interface BugReport {
    description: string;
    pathname: string;
    userId?: string;
    email?: string;
    userAgent: string;
}

export const supportService = {
    async reportBug(data: BugReport) {
        try {
            const response = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to report bug via API");
            }

            const result = await response.json();
            return result.ticketId;
        } catch (error) {
            console.error("Error reporting bug:", error);
            throw error;
        }
    },
};
