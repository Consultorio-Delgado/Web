"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    getDoc,
    doc as firestoreDoc,
} from "firebase/firestore";
import { startOfDay, endOfDay } from "date-fns";
import { Appointment } from "@/types";

/**
 * Real-time Firestore listener for appointments on a given date.
 * Replaces one-shot `getDocs` calls with `onSnapshot` so that changes
 * made in one browser are instantly reflected in all others.
 *
 * Enriches each appointment with user-profile data (DNI, corrected name,
 * insurance) using an in-memory cache to avoid redundant reads.
 */
export function useRealtimeAppointments(date: Date | null) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Cache of user profiles keyed by patientId — persists across snapshot
    // updates so we don't re-fetch the same user on every delta.
    const profileCache = useRef<Map<string, any>>(new Map());

    // Track whether this is the very first snapshot for this date so we can
    // show a loading spinner only on initial load, not on subsequent updates.
    const isFirstSnapshot = useRef(true);

    // Enrich a single appointment doc with user-profile data.
    // Mirrors the logic in adminService.getDailyAppointments but uses cache.
    const enrichAppointment = useCallback(
        async (
            docId: string,
            data: any
        ): Promise<Appointment> => {
            let patientName = data.patientName;
            let insurance = data.insurance;
            let patientDni = "";

            try {
                const pid = data.patientId;
                if (
                    pid &&
                    !pid.startsWith("manual_") &&
                    pid !== "blocked"
                ) {
                    // Check cache first
                    let userData = profileCache.current.get(pid);
                    if (!userData) {
                        const userSnap = await getDoc(
                            firestoreDoc(db, "users", pid)
                        );
                        if (userSnap.exists()) {
                            userData = userSnap.data();
                            profileCache.current.set(pid, userData);
                        }
                    }

                    if (userData) {
                        if (
                            !patientName ||
                            patientName === "undefined undefined"
                        ) {
                            patientName = `${userData.firstName} ${userData.lastName}`;
                        }
                        if (!insurance) {
                            insurance = userData.insurance;
                        }
                        patientDni = userData.dni || "";
                    } else {
                        if (
                            !patientName ||
                            patientName === "undefined undefined"
                        ) {
                            patientName = "Paciente";
                        }
                    }
                } else {
                    if (
                        !patientName ||
                        patientName === "undefined undefined"
                    ) {
                        patientName = "Paciente";
                    }
                }
            } catch {
                if (
                    !patientName ||
                    patientName === "undefined undefined"
                ) {
                    patientName = "Paciente";
                }
            }

            return {
                id: docId,
                ...data,
                patientName,
                insurance,
                patientDni,
                date: data.date?.toDate?.() ?? new Date(),
                createdAt: data.createdAt?.toDate?.() ?? new Date(),
                arrivedAt: data.arrivedAt?.toDate?.() ?? undefined,
                updatedAt: data.updatedAt?.toDate?.() ?? undefined,
                waitingSegmentStartedAt: data.waitingSegmentStartedAt?.toDate?.() ?? undefined,
                consultationSegmentStartedAt: data.consultationSegmentStartedAt?.toDate?.() ?? undefined,
                consultationStartedAt: data.consultationStartedAt?.toDate?.() ?? undefined,
                times: data.times ? {
                    arrivedAt: data.times.arrivedAt?.toDate?.() ?? undefined,
                    consultationStartedAt: data.times.consultationStartedAt?.toDate?.() ?? undefined,
                    completedAt: data.times.completedAt?.toDate?.() ?? undefined,
                } : undefined,
                timing: data.timing ? {
                    ...data.timing,
                    completedAt: data.timing.completedAt?.toDate?.() ?? undefined,
                } : undefined,
            } as Appointment;
        },
        []
    );

    useEffect(() => {
        if (!date) {
            setAppointments([]);
            setLoading(false);
            return;
        }

        // Reset state for the new date
        setLoading(true);
        setError(null);
        isFirstSnapshot.current = true;

        const q = query(
            collection(db, "appointments"),
            where("date", ">=", Timestamp.fromDate(startOfDay(date))),
            where("date", "<=", Timestamp.fromDate(endOfDay(date))),
            orderBy("date", "asc")
        );

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                try {
                    // Primera carga o resync completo: enriquecer todos los docs.
                    if (isFirstSnapshot.current) {
                        const enriched = await Promise.all(
                            snapshot.docs.map((d) =>
                                enrichAppointment(d.id, d.data())
                            )
                        );
                        setAppointments(enriched);
                    } else {
                        const changes = snapshot.docChanges();
                        if (changes.length === 0) return;

                        // Resync tras reconexión: muchos "added" → recarga completa.
                        if (
                            changes.length === snapshot.size &&
                            changes.every((c) => c.type === "added")
                        ) {
                            const enriched = await Promise.all(
                                snapshot.docs.map((d) =>
                                    enrichAppointment(d.id, d.data())
                                )
                            );
                            setAppointments(enriched);
                            return;
                        }

                        const enrichedChanges = await Promise.all(
                            changes.map(async (change) => ({
                                type: change.type,
                                appointment:
                                    change.type === "removed"
                                        ? ({ id: change.doc.id } as Appointment)
                                        : await enrichAppointment(
                                              change.doc.id,
                                              change.doc.data()
                                          ),
                            }))
                        );

                        setAppointments((prev) => {
                            let next = [...prev];
                            for (const { type, appointment } of enrichedChanges) {
                                if (type === "removed") {
                                    next = next.filter((a) => a.id !== appointment.id);
                                } else if (type === "added") {
                                    next.push(appointment);
                                } else {
                                    const idx = next.findIndex(
                                        (a) => a.id === appointment.id
                                    );
                                    if (idx >= 0) next[idx] = appointment;
                                    else next.push(appointment);
                                }
                            }
                            next.sort((a, b) => {
                                const ta = a.time ?? "";
                                const tb = b.time ?? "";
                                return ta.localeCompare(tb);
                            });
                            return next;
                        });
                    }
                } catch (e) {
                    console.error(
                        "Error enriching real-time appointments:",
                        e
                    );
                    setError(
                        e instanceof Error
                            ? e
                            : new Error("Unknown error")
                    );
                } finally {
                    if (isFirstSnapshot.current) {
                        setLoading(false);
                        isFirstSnapshot.current = false;
                    }
                }
            },
            (err) => {
                console.error("onSnapshot error:", err);
                setError(err);
                setLoading(false);
            }
        );

        // Cleanup: unsubscribe when date changes or component unmounts
        return () => unsubscribe();
    }, [date, enrichAppointment]);

    return { appointments, loading, error };
}
