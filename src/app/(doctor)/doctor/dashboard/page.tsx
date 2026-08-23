"use client";

import { useAuth } from "@/context/AuthContext";
import { doctorService } from "@/services/doctorService";
import { dashboardService } from "@/services/dashboardService";
import {
    getCachedDashboardOverview,
    setCachedDashboardOverview,
} from "@/lib/dashboardCache";
import { DashboardOverview, DashboardScope } from "@/types/dashboard";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { DashboardScopeToggle } from "@/components/doctor/dashboard/DashboardScopeToggle";
import { KpiGrid } from "@/components/doctor/dashboard/KpiGrid";
import { ContextualBanner } from "@/components/doctor/dashboard/ContextualBanner";
import { DoctorComparison } from "@/components/doctor/dashboard/DoctorComparison";
import { NewPatientsList } from "@/components/doctor/dashboard/NewPatientsList";
import { RecentActivityPanel } from "@/components/doctor/dashboard/RecentActivityPanel";
import { DashboardSkeleton } from "@/components/doctor/dashboard/DashboardSkeleton";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const [scope, setScope] = useState<DashboardScope>("self");
    const [doctorId, setDoctorId] = useState<string | undefined>();
    const [overviewByScope, setOverviewByScope] = useState<
        Partial<Record<DashboardScope, DashboardOverview>>
    >({});
    const [loadingScope, setLoadingScope] = useState<DashboardScope | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fetchGen = useRef(0);

    useEffect(() => {
        async function resolveDoctor() {
            if (!user) return;
            const doc = await doctorService.getDoctorById(user.uid);
            setDoctorId(doc?.id ?? user.uid);
        }
        resolveDoctor();
    }, [user]);

    const loadScope = useCallback(
        async (targetScope: DashboardScope, docId?: string, options?: { silent?: boolean }) => {
            const cached = getCachedDashboardOverview(targetScope, docId);
            if (cached) {
                setOverviewByScope((prev) => ({ ...prev, [targetScope]: cached }));
                setError(null);
                return;
            }

            const gen = ++fetchGen.current;
            if (!options?.silent) {
                setLoadingScope(targetScope);
            }
            setError(null);

            try {
                const data = await dashboardService.getOverview(targetScope, docId);
                if (gen !== fetchGen.current) return;

                if (!data) {
                    setError("No se pudo cargar el tablero.");
                    return;
                }

                setCachedDashboardOverview(targetScope, docId, data);
                setOverviewByScope((prev) => ({ ...prev, [targetScope]: data }));
            } catch (e) {
                if (gen !== fetchGen.current) return;
                console.error("Error loading dashboard:", e);
                setError("No se pudo cargar el tablero.");
            } finally {
                if (gen === fetchGen.current) {
                    setLoadingScope(null);
                }
            }
        },
        []
    );

    // Hidratar desde caché al resolver doctorId (volver de Stats, toggle, etc.)
    useEffect(() => {
        if (!doctorId) return;
        setOverviewByScope((prev) => {
            const next = { ...prev };
            const cachedSelf = getCachedDashboardOverview("self", doctorId);
            if (cachedSelf) next.self = cachedSelf;
            const cachedClinic = getCachedDashboardOverview("clinic");
            if (cachedClinic) next.clinic = cachedClinic;
            return next;
        });
    }, [doctorId]);

    const cachedForScope = useMemo(() => {
        if (scope === "clinic") return getCachedDashboardOverview("clinic");
        if (!doctorId) return null;
        return getCachedDashboardOverview("self", doctorId);
    }, [doctorId, scope]);

    const handleScopeChange = (newScope: DashboardScope) => {
        setScope(newScope);
        if (newScope === "clinic") {
            loadScope("clinic", undefined);
        } else if (doctorId) {
            loadScope("self", doctorId);
        }
    };

    // Siempre arranca en Yo: solo fetch propio cuando hay doctorId
    useEffect(() => {
        if (!user || !doctorId) return;
        loadScope("self", doctorId);
    }, [user, doctorId, loadScope]);

    const overview = overviewByScope[scope] ?? cachedForScope ?? undefined;
    const isWaitingDoctor = !!user && !doctorId;
    const isInitialLoad = isWaitingDoctor || (!overview && loadingScope === scope);
    const isPendingFetch = !overview && !loadingScope && !!doctorId;

    const isRefreshing = !!overview && loadingScope === scope;

    if (isInitialLoad || isPendingFetch) {
        return <DashboardSkeleton />;
    }

    if (!overview) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
                <p>{error ?? "No se pudo cargar el tablero."}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        scope === "self"
                            ? doctorId && loadScope("self", doctorId)
                            : loadScope("clinic")
                    }
                >
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Tablero Principal
                    </h1>
                    <p className="text-muted-foreground">
                        {scope === "self"
                            ? "Su consulta y operación del día"
                            : "Vista del consultorio completo"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isRefreshing && (
                        <Badge variant="secondary" className="gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Actualizando
                        </Badge>
                    )}
                    <DashboardScopeToggle scope={scope} onChange={handleScopeChange} />
                </div>
            </div>

            <ContextualBanner context={overview.context} />

            {overview.drappUnmatchedToday > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
                    <p className="text-sm text-muted-foreground">
                        {overview.drappUnmatchedToday} paciente(s) de hoy sin match DRAPP
                    </p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/doctor/drapp-patients">Revisar DRAPP</Link>
                    </Button>
                </div>
            )}

            <KpiGrid kpi={overview.kpi} timing={overview.timing} />

            <DashboardCharts data={overview.charts} />

            {scope === "clinic" && overview.doctorComparison.length > 0 && (
                <DoctorComparison data={overview.doctorComparison} />
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <NewPatientsList patients={overview.newPatients} />
                <RecentActivityPanel logs={overview.recentActivity} />
            </div>
        </div>
    );
}
