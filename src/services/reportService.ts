import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
            const report: Omit<CrashReport & { timestamp: any }, 'timestamp'> = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                url: typeof window !== "undefined" ? window.location.href : "N/A",
                userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "N/A",
                userId: extra?.userId,
                userEmail: extra?.userEmail,
            };

            // 1. Save to Firestore
            const docRef = await addDoc(collection(db, "crash_reports"), {
                ...report,
                timestamp: serverTimestamp(),
            });

            // 2. Notify via API (Reuse support endpoint or specific one)
            // We'll reuse /api/support for now as it handles email notifications
            await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: `CRASH REPORT: ${report.name}: ${report.message}\n\nStack: ${report.stack}`,
                    pathname: report.url,
                    userId: report.userId,
                    email: report.userEmail,
                    userAgent: report.userAgent,
                    ticketId: `CRASH-${docRef.id}`,
                }),
            });

            return docRef.id;
        } catch (err) {
            console.error("Error submitting crash report:", err);
            throw err;
        }
    },
};
