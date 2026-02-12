import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface BugReport {
    description: string;
    pathname: string;
    userId?: string;
    email?: string;
    userAgent: string;
    timestamp: any;
}

export const supportService = {
    async reportBug(data: Omit<BugReport, 'timestamp'>) {
        try {
            // 1. Save to Firestore
            const docRef = await addDoc(collection(db, "support_tickets"), {
                ...data,
                timestamp: serverTimestamp(),
            });

            // 2. Notify via API (Resend)
            await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    ticketId: docRef.id,
                }),
            });

            return docRef.id;
        } catch (error) {
            console.error("Error reporting bug:", error);
            throw error;
        }
    },
};
