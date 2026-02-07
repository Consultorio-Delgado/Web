import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export type AuditAction =
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_CONFIRMED'
    | 'APPOINTMENT_COMPLETED'
    | 'APPOINTMENT_ARRIVED'
    | 'MEDICAL_NOTE_ADDED'
    | 'PATIENT_FILE_UPLOADED';

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
    }
};
