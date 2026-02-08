import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export type AuditAction =
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_CONFIRMED'
    | 'APPOINTMENT_COMPLETED'
    | 'APPOINTMENT_ARRIVED'
    | 'MEDICAL_NOTE_ADDED'
    | 'PATIENT_FILE_UPLOADED'
    | 'PATIENT_PROFILE_UPDATED'
    | 'PATIENT_DELETED'
    | 'PATIENT_RESTORED'
    | 'DOCTOR_DELETED'
    | 'DOCTOR_RESTORED';

export const auditService = {
    async logAction(action: AuditAction, performedBy: string, metadata: any = {}) {
        try {
            await addDoc(collection(db, "audit_logs"), {
                action,
                performedBy,
                timestamp: Timestamp.now(),
                metadata
            });
        } catch (error) {
            console.error("Failed to log audit action:", error);
            // Don't throw, we don't want to break the app flow if logging fails
        }
    },
    async getRecentLogs(limitCount: number = 10) {
        try {
            const { query, orderBy, limit, getDocs } = await import("firebase/firestore");
            const q = query(
                collection(db, "audit_logs"),
                orderBy("timestamp", "desc"),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            return [];
        }
    }
};
