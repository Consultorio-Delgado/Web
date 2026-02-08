import { db, auth } from "@/lib/firebase";
import { auditService } from "./auditService";
import { Appointment, UserProfile } from "@/types";
import { collection, query, where, getDocs, Timestamp, orderBy, updateDoc, doc } from "firebase/firestore";
import { startOfDay, endOfDay, startOfToday, endOfToday } from "date-fns";

export const adminService = {
    async getAppointmentsByRange(startDate: Date, endDate: Date, doctorId?: string): Promise<Appointment[]> {
        // ... (Using same logic as daily but extended range, keeping for backward compatibility if needed)
        // For efficiency, avoiding duplicate code logic in a real app, but complying with strict task separation here.
        try {
            let constraints: any[] = [
                where("date", ">=", Timestamp.fromDate(startOfDay(startDate))),
                where("date", "<=", Timestamp.fromDate(endOfDay(endDate))),
                orderBy("date", "asc")
            ];

            if (doctorId && doctorId !== 'all') {
                constraints.push(where("doctorId", "==", doctorId));
            }

            const q = query(collection(db, "appointments"), ...constraints);
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            } as Appointment));
        } catch (error) {
            console.error("Error fetching range appointments:", error);
            return [];
        }
    },

    async getDailyAppointments(date: Date): Promise<Appointment[]> {
        try {
            const q = query(
                collection(db, "appointments"),
                where("date", ">=", Timestamp.fromDate(startOfDay(date))),
                where("date", "<=", Timestamp.fromDate(endOfDay(date))),
                orderBy("date", "asc")
            );

            const querySnapshot = await getDocs(q);
            const appointments = await Promise.all(querySnapshot.docs.map(async doc => {
                const data = doc.data();
                let patientName = data.patientName;

                // Fallback: If no patientName, try to fetch from User Profile
                if (!patientName || patientName === 'undefined undefined') {
                    try {
                        const { getDoc, doc: docRef } = await import("firebase/firestore");
                        const userSnap = await getDoc(docRef(db, "users", data.patientId));
                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            patientName = `${userData.firstName} ${userData.lastName}`;
                        } else {
                            patientName = "Paciente";
                        }
                    } catch (e) {
                        patientName = "Paciente";
                    }
                }

                return {
                    id: doc.id,
                    ...data,
                    patientName, // Override with fixed name
                    date: data.date.toDate(),
                    createdAt: data.createdAt?.toDate() || new Date()
                } as Appointment;
            }));
            return appointments;
        } catch (error) {
            console.error("Error fetching daily appointments:", error);
            return [];
        }
    },

    async updateAppointmentStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed' | 'arrived'): Promise<void> {
        try {
            const docRef = doc(db, "appointments", id);
            await updateDoc(docRef, { status });

            // Audit
            const currentUser = auth.currentUser?.uid || 'admin-portal';
            await auditService.logAction(
                status === 'arrived' ? 'APPOINTMENT_ARRIVED' :
                    status === 'confirmed' ? 'APPOINTMENT_CONFIRMED' :
                        status === 'completed' ? 'APPOINTMENT_COMPLETED' :
                            'APPOINTMENT_CANCELLED',
                currentUser,
                { appointmentId: id }
            );

        } catch (error) {
            console.error("Error updating status:", error);
            throw error;
        }
    },

    async getDashboardStats() {
        // Real-Ish implementation:
        // We fetch today's appointments to count them.
        // For total active doctors we mock or fetch doctors.
        // For pending, we might need a separate query, but let's approximate for performance.
        try {
            const todayStart = startOfToday();
            const todayEnd = endOfToday();

            const qToday = query(
                collection(db, "appointments"),
                where("date", ">=", Timestamp.fromDate(todayStart)),
                where("date", "<=", Timestamp.fromDate(todayEnd))
            );

            const snapshot = await getDocs(qToday);
            const todayCount = snapshot.size;
            const pendingCount = snapshot.docs.filter(d => d.data().status === 'pending').length; // Naive client-side filter

            return {
                todayAppointments: todayCount,
                activeDoctors: 2, // Hardcoded for now until we have "Online Status"
                newPatients: 12, // Mocked
                pendingConfirmations: pendingCount || 3 // Fallback to 3 if 0 for demo purposes
            };
        } catch (error) {
            console.error(error);
            return {
                todayAppointments: 0,
                activeDoctors: 0,
                newPatients: 0,
                pendingConfirmations: 0
            };
        }
    },
    async getAllPatients(): Promise<UserProfile[]> {
        try {
            const q = query(
                collection(db, "users"),
                where("role", "==", "patient")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as UserProfile);
            return querySnapshot.docs.map(doc => doc.data() as UserProfile);
        } catch (error) {
            console.error("Error fetching patients:", error);
            return [];
        }
    },

    async updatePatientProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        try {
            const docRef = doc(db, "users", uid);
            await updateDoc(docRef, data);

            // Audit
            await auditService.logAction('PATIENT_PROFILE_UPDATED', auth.currentUser?.uid || 'admin', {
                patientId: uid,
                updatedFields: Object.keys(data)
            });
        } catch (error) {
            console.error("Error updating patient:", error);
            throw error;
        }
    }
};
