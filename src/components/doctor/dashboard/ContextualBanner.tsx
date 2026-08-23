"use client";

import { ReactNode } from "react";
import { DashboardContext } from "@/types/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Palmtree, CalendarClock } from "lucide-react";
import { getVacationEndFormatted } from "@/lib/vacationUtils";

interface ContextualBannerProps {
    context: DashboardContext;
}

export function ContextualBanner({ context }: ContextualBannerProps) {
    const banners: ReactNode[] = [];

    if (context.settings.announcementEnabled && context.settings.announcementText) {
        banners.push(
            <Card key="announcement" className="border-blue-200 bg-blue-50/50">
                <CardContent className="flex gap-3 pt-4">
                    <Megaphone className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                        <p className="font-medium text-sm">Anuncio de la clínica</p>
                        <p className="text-sm text-muted-foreground">{context.settings.announcementText}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (context.scopedDoctor && context.vacationActive) {
        banners.push(
            <Card key="vacation-active" className="border-amber-200 bg-amber-50/50">
                <CardContent className="flex gap-3 pt-4">
                    <Palmtree className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                        <p className="font-medium text-sm">Vacaciones activas</p>
                        <p className="text-sm text-muted-foreground">
                            Está de vacaciones hasta el {getVacationEndFormatted(context.scopedDoctor)}.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    } else if (context.scopedDoctor && context.vacationUpcoming && context.scopedDoctor.vacationStart) {
        banners.push(
            <Card key="vacation-upcoming">
                <CardContent className="flex gap-3 pt-4">
                    <Palmtree className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-medium text-sm">Vacaciones próximas</p>
                        <p className="text-sm text-muted-foreground">
                            Sus vacaciones comienzan el{" "}
                            {context.scopedDoctor.vacationStart.split("-").reverse().join("/")}.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (context.exceptionalScheduleToday && context.scopedDoctor) {
        const todaySchedule = context.scopedDoctor.exceptionalSchedule?.find(
            (s) => s.date === new Date().toISOString().split("T")[0]
        );
        banners.push(
            <Card key="exceptional" className="border-purple-200 bg-purple-50/50">
                <CardContent className="flex gap-3 pt-4">
                    <CalendarClock className="h-5 w-5 text-purple-600 shrink-0" />
                    <div>
                        <p className="font-medium text-sm">Horario excepcional hoy</p>
                        <p className="text-sm text-muted-foreground">
                            Atención con horario especial
                            {todaySchedule
                                ? `: ${todaySchedule.startHour} – ${todaySchedule.endHour}`
                                : "."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (banners.length === 0) return null;

    return <div className="space-y-3">{banners}</div>;
}
