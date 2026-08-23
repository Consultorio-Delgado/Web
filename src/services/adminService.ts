import { db, auth } from "@/lib/firebase";
import { auditService } from "./auditService";
import { Appointment, UserProfile } from "@/types";
import { collection, query, where, getDocs, Timestamp, orderBy, updateDoc, doc, getDoc } from "firebase/firestore";
import { startOfDay, endOfDay, startOfToday, endOfToday } from "date-fns";
import { computeAttendanceFromAppointments, type RawAppointmentLike } from "@/lib/attendanceStats";

function normalizeInsuranceLabel(insurance?: string | null): string {
    if (!insurance || insurance.trim() === "") return "Particular";
    if (insurance.toUpperCase() === "PARTICULAR") return "Particular";
    return insurance.trim();
}

function isInMonth(date: Date, year: number, month: number): boolean {
    return date.getFullYear() === year && date.getMonth() === month;
}

async function countDrappUnmatchedFromTodayDocs(
    todayDocs: Record<string, any>[]
): Promise<number> {
    const missingDniPatientIds: string[] = [];
    for (const data of todayDocs) {
        if (data.status === "cancelled") continue;
        if (!data.patientId || data.patientId === "blocked" || data.patientId.startsWith("manual_")) {
            continue;
        }
        if (data.patientDni) continue;
        missingDniPatientIds.push(data.patientId);
    }

    if (missingDniPatientIds.length === 0) return 0;

    const dniByPatient = new Map<string, string>();
    const unique = [...new Set(missingDniPatientIds)];
    await Promise.all(
        unique.map(async (uid) => {
            try {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists() && userSnap.data().dni) {
                    dniByPatient.set(uid, userSnap.data().dni);
                }
            } catch {
                // ignore
            }
        })
    );

    let unmatched = 0;
    for (const data of todayDocs) {
        if (data.status === "cancelled") continue;
        if (!data.patientId || data.patientId === "blocked" || data.patientId.startsWith("manual_")) {
            continue;
        }
        if (data.patientDni || dniByPatient.has(data.patientId)) continue;
        unmatched++;
    }
    return unmatched;
}

async function fetchInsuranceByPatientIds(patientIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const unique = [...new Set(patientIds.filter((id) => id && id !== "blocked" && !id.startsWith("manual_")))];
    await Promise.all(
        unique.map(async (uid) => {
            try {
                const snap = await getDoc(doc(db, "users", uid));
                if (snap.exists()) {
                    const insurance = snap.data().insurance as string | undefined;
                    if (insurance) map.set(uid, insurance);
                }
            } catch {
                // ignore per-patient failures
            }
        })
    );
    return map;
}

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
                let insurance = data.insurance;
                let patientDni = '';

                // Always fetch user profile to get DNI (for DrApp matching) + fallback name/insurance
                try {
                    if (data.patientId && !data.patientId.startsWith('manual_') && data.patientId !== 'blocked') {
                        const { getDoc, doc: docRef } = await import("firebase/firestore");
                        const userSnap = await getDoc(docRef(db, "users", data.patientId));
                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            if (!patientName || patientName === 'undefined undefined') {
                                patientName = `${userData.firstName} ${userData.lastName}`;
                            }
                            if (!insurance) {
                                insurance = userData.insurance;
                            }
                            patientDni = userData.dni || '';
                        } else {
                            if (!patientName || patientName === 'undefined undefined') {
                                patientName = "Paciente";
                            }
                        }
                    } else {
                        if (!patientName || patientName === 'undefined undefined') {
                            patientName = "Paciente";
                        }
                    }
                } catch (e) {
                    if (!patientName || patientName === 'undefined undefined') {
                        patientName = "Paciente";
                    }
                }

                return {
                    id: doc.id,
                    ...data,
                    patientName,
                    insurance,
                    patientDni,
                    date: data.date.toDate(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    arrivedAt: data.arrivedAt?.toDate() || undefined
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

    /** Stats ligeros para el tablero: 1 query de turnos (6 meses) + perfiles solo si faltan OS. */
    async getDashboardStats(doctorId?: string) {
        try {
            const now = new Date();
            const startMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
            const endMonth = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
            const sixMonthsStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - 5, 1));

            const constraints: any[] = [
                where("date", ">=", Timestamp.fromDate(sixMonthsStart)),
                where("date", "<=", Timestamp.fromDate(endMonth)),
            ];
            if (doctorId) {
                constraints.push(where("doctorId", "==", doctorId));
            }
            const snap = await getDocs(query(collection(db, "appointments"), ...constraints));
            const allDocs = snap.docs.map(
                (d) => ({ id: d.id, ...d.data() } as Record<string, any> & { id: string })
            );

            const curY = now.getFullYear();
            const curM = now.getMonth();
            const lastM = curM === 0 ? 11 : curM - 1;
            const lastY = curM === 0 ? curY - 1 : curY;

            const currentDocs = allDocs.filter((d) => isInMonth(d.date.toDate(), curY, curM));
            const lastMonthDocs = allDocs.filter((d) => isInMonth(d.date.toDate(), lastY, lastM));

            const currentTotal = currentDocs.length;
            const lastTotal = lastMonthDocs.length;
            const growth =
                lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : currentTotal > 0 ? 100 : 0;

            const idsNeedingInsurance = currentDocs
                .filter((d) => !d.insurance && d.patientId && d.patientId !== "blocked")
                .map((d) => d.patientId as string);
            const insuranceByPatient = await fetchInsuranceByPatientIds(idsNeedingInsurance);

            const insuranceMap: Record<string, number> = {};
            const consultationTypeMap: Record<string, number> = {};

            currentDocs.forEach((data) => {
                if (data.patientId === "blocked") return;
                const insurance = normalizeInsuranceLabel(
                    data.insurance || insuranceByPatient.get(data.patientId)
                );
                insuranceMap[insurance] = (insuranceMap[insurance] || 0) + 1;
                if (data.consultationType) {
                    consultationTypeMap[data.consultationType] =
                        (consultationTypeMap[data.consultationType] || 0) + 1;
                }
            });

            const insuranceSorted = Object.entries(insuranceMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
            const insuranceData =
                insuranceSorted.length <= 6
                    ? insuranceSorted
                    : [
                          ...insuranceSorted.slice(0, 5),
                          {
                              name: "Otros",
                              value: insuranceSorted.slice(5).reduce((sum, item) => sum + item.value, 0),
                          },
                      ].filter((item) => item.value > 0);

            const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const areaData: { name: string; total: number }[] = [];
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const count = allDocs.filter((d) =>
                    isInMonth(d.date.toDate(), monthDate.getFullYear(), monthDate.getMonth())
                ).length;
                areaData.push({
                    name: `${monthLabels[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
                    total: count,
                });
            }

            const attendance = computeAttendanceFromAppointments(
                currentDocs as RawAppointmentLike[],
                { doctorId }
            );

            const todayStart = startOfDay(now);
            const todayEnd = endOfDay(now);
            const todayDocs = allDocs.filter((d) => {
                const dt = d.date.toDate();
                return dt >= todayStart && dt <= todayEnd;
            });
            const drappUnmatchedToday = await countDrappUnmatchedFromTodayDocs(todayDocs);

            return {
                kpi: {
                    totalAppointments: currentTotal,
                    growth: Math.round(growth),
                    absent: attendance.absent,
                    firstVisits: currentDocs.filter((d) => d.isFirstVisit === true).length,
                },
                charts: {
                    insurance: insuranceData,
                    area: areaData,
                    consultationType: Object.keys(consultationTypeMap).map((key) => ({
                        name: key.replace(/-/g, " "),
                        value: consultationTypeMap[key],
                    })),
                },
                rawCurrentMonth: currentDocs,
                rawLastMonth: lastMonthDocs,
                drappUnmatchedToday,
            };
        } catch (error) {
            console.error("Error calculating dashboard stats:", error);
            return null;
        }
    },

    /** Solo para banner DRAPP: turnos de hoy sin DNI (máx. 1 lectura de perfil por paciente). */
    async countDrappUnmatchedToday(doctorId?: string): Promise<number> {
        try {
            const now = new Date();
            const constraints: any[] = [
                where("date", ">=", Timestamp.fromDate(startOfDay(now))),
                where("date", "<=", Timestamp.fromDate(endOfDay(now))),
            ];
            if (doctorId) {
                constraints.push(where("doctorId", "==", doctorId));
            }
            const snap = await getDocs(query(collection(db, "appointments"), ...constraints));

            const missingDniPatientIds: string[] = [];
            for (const docSnap of snap.docs) {
                const data = docSnap.data();
                if (data.status === "cancelled") continue;
                if (!data.patientId || data.patientId === "blocked" || data.patientId.startsWith("manual_")) {
                    continue;
                }
                if (data.patientDni) continue;
                missingDniPatientIds.push(data.patientId);
            }

            if (missingDniPatientIds.length === 0) return 0;

            const dniByPatient = new Map<string, string>();
            const unique = [...new Set(missingDniPatientIds)];
            await Promise.all(
                unique.map(async (uid) => {
                    try {
                        const userSnap = await getDoc(doc(db, "users", uid));
                        if (userSnap.exists() && userSnap.data().dni) {
                            dniByPatient.set(uid, userSnap.data().dni);
                        }
                    } catch {
                        // ignore
                    }
                })
            );

            let unmatched = 0;
            for (const docSnap of snap.docs) {
                const data = docSnap.data();
                if (data.status === "cancelled") continue;
                if (!data.patientId || data.patientId === "blocked" || data.patientId.startsWith("manual_")) {
                    continue;
                }
                if (data.patientDni || dniByPatient.has(data.patientId)) continue;
                unmatched++;
            }
            return unmatched;
        } catch (error) {
            console.error("Error counting DRAPP unmatched:", error);
            return 0;
        }
    },

    async getExtendedStats(doctorId?: string) {
        try {
            const now = new Date();
            const startMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
            const endMonth = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
            const startLastMonth = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
            const endLastMonth = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));

            const sixMonthsStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - 5, 1));

            const fetchRange = async (start: Date, end: Date) => {
                const constraints: any[] = [
                    where("date", ">=", Timestamp.fromDate(start)),
                    where("date", "<=", Timestamp.fromDate(end)),
                ];
                if (doctorId) {
                    constraints.push(where("doctorId", "==", doctorId));
                }
                const q = query(collection(db, "appointments"), ...constraints);
                const snap = await getDocs(q);
                return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, any> & { id: string }));
            };

            const [currentDocs, lastDocs, sixMonthDocs, allPatients] = await Promise.all([
                fetchRange(startMonth, endMonth),
                fetchRange(startLastMonth, endLastMonth),
                fetchRange(sixMonthsStart, endMonth),
                this.getAllPatients(),
            ]);

            const insuranceByPatient = new Map(
                allPatients.map((p) => [p.uid, p.insurance])
            );

            const currentTotal = currentDocs.length;
            const lastTotal = lastDocs.length;
            const growth = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : currentTotal > 0 ? 100 : 0;

            const attendance = computeAttendanceFromAppointments(
                currentDocs as RawAppointmentLike[],
                { doctorId }
            );

            const uniquePatients = new Set(
                currentDocs.filter((d) => d.patientId && d.patientId !== "blocked").map((d) => d.patientId)
            ).size;

            const startNext = new Date();
            const endNext = new Date(now.getTime() + 48 * 60 * 60 * 1000);
            let nextAppointments: any[] = [];
            try {
                const nextConstraints: any[] = [
                    where("date", ">=", Timestamp.fromDate(startNext)),
                    where("date", "<=", Timestamp.fromDate(endNext)),
                    orderBy("date", "asc"),
                ];
                if (doctorId) {
                    nextConstraints.push(where("doctorId", "==", doctorId));
                }
                const qNext = query(collection(db, "appointments"), ...nextConstraints);
                const nextSnap = await getDocs(qNext);
                nextAppointments = nextSnap.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    date: docSnap.data().date.toDate(),
                }));
            } catch {
                const allNext = await fetchRange(startNext, endNext);
                nextAppointments = allNext
                    .filter((d) => !doctorId || d.doctorId === doctorId)
                    .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
                    .map((d) => ({ ...d, date: d.date.toDate() }));
            }

            const daysMap: Record<string, number> = { Lun: 0, Mar: 0, Mie: 0, Jue: 0, Vie: 0, Sab: 0 };
            const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
            const insuranceMap: Record<string, number> = {};
            const consultationTypeMap: Record<string, number> = {};

            currentDocs.forEach((data) => {
                if (data.patientId === "blocked") return;

                const day = dayNames[data.date.toDate().getDay()];
                if (daysMap[day] !== undefined) daysMap[day]++;

                const insurance = normalizeInsuranceLabel(
                    data.insurance || insuranceByPatient.get(data.patientId)
                );
                insuranceMap[insurance] = (insuranceMap[insurance] || 0) + 1;

                if (data.consultationType) {
                    consultationTypeMap[data.consultationType] = (consultationTypeMap[data.consultationType] || 0) + 1;
                }
            });

            const insuranceSorted = Object.entries(insuranceMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            const insuranceData =
                insuranceSorted.length <= 6
                    ? insuranceSorted
                    : [
                          ...insuranceSorted.slice(0, 5),
                          {
                              name: "Otros",
                              value: insuranceSorted.slice(5).reduce((sum, item) => sum + item.value, 0),
                          },
                      ].filter((item) => item.value > 0);

            const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const areaData: { name: string; total: number }[] = [];
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
                const count = sixMonthDocs.filter((d) => {
                    const dt = d.date.toDate();
                    return dt.getFullYear() === monthDate.getFullYear() && dt.getMonth() === monthDate.getMonth();
                }).length;
                areaData.push({ name: `${monthLabels[monthDate.getMonth()]} ${monthDate.getFullYear()}`, total: count });
            }

            return {
                kpi: {
                    totalAppointments: currentTotal,
                    growth: Math.round(growth),
                    attendanceRate: attendance.attendanceRate,
                    uniquePatients,
                    pending: currentDocs.filter((d) => d.status === "pending").length,
                    absent: attendance.absent,
                    cancelled: currentDocs.filter((d) => d.status === "cancelled").length,
                    firstVisits: currentDocs.filter((d) => d.isFirstVisit === true).length,
                    occupancyRate: 0,
                },
                nextAppointments,
                charts: {
                    weekly: Object.keys(daysMap).map((key) => ({ name: key, value: daysMap[key] })),
                    insurance: insuranceData,
                    area: areaData,
                    consultationType: Object.keys(consultationTypeMap).map((key) => ({
                        name: key.replace(/-/g, " "),
                        value: consultationTypeMap[key],
                    })),
                },
                rawCurrentMonth: currentDocs,
            };
        } catch (error) {
            console.error("Error calculating extended stats:", error);
            return null;
        }
    },

    async getDashboardStatsLegacy() {
        const stats = await this.getDashboardStats();
        if (!stats) {
            return { todayAppointments: 0, activeDoctors: 2, newPatients: 0, pendingConfirmations: 0 };
        }
        return {
            todayAppointments: stats.kpi.totalAppointments,
            activeDoctors: 2,
            newPatients: stats.kpi.firstVisits,
            pendingConfirmations: 0,
        };
    },
    async getAllPatients(): Promise<UserProfile[]> {
        try {
            // Fetch all patients first to avoid "not equal" issues with missing fields
            // Firestore '!=' query excludes documents where the field does not exist.
            const q = query(
                collection(db, "users"),
                where("role", "==", "patient")
            );

            const querySnapshot = await getDocs(q);

            // Filter out soft-deleted users client-side
            return querySnapshot.docs
                .map(doc => doc.data() as UserProfile)
                .filter(user => !user.isDeleted);
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
    },

    async getPatientById(uid: string): Promise<UserProfile | null> {
        try {
            const { getDoc, doc: docRef } = await import("firebase/firestore");
            const docSnap = await getDoc(docRef(db, "users", uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Return null if soft-deleted
                if (data.isDeleted) {
                    return null;
                }
                return data as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching patient by ID:", error);
            return null;
        }
    },

    // Soft delete patient - mark as deleted instead of removing
    async deletePatient(uid: string): Promise<void> {
        try {
            const docRef = doc(db, "users", uid);
            await updateDoc(docRef, {
                isDeleted: true,
                deletedAt: new Date()
            });

            // Audit
            await auditService.logAction('PATIENT_DELETED', auth.currentUser?.uid || 'admin', {
                patientId: uid
            });
        } catch (error) {
            console.error(`Error soft-deleting patient ${uid}:`, error);
            throw error;
        }
    },

    // Restore a soft-deleted patient
    async restorePatient(uid: string): Promise<void> {
        try {
            const docRef = doc(db, "users", uid);
            await updateDoc(docRef, {
                isDeleted: false,
                deletedAt: null,
                restoredAt: new Date()
            });

            // Audit
            await auditService.logAction('PATIENT_RESTORED', auth.currentUser?.uid || 'admin', {
                patientId: uid
            });
        } catch (error) {
            console.error(`Error restoring patient ${uid}:`, error);
            throw error;
        }
    }
};
