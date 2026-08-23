"use client";

import Link from "next/link";
import { Clock, Calendar, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
    { href: "/doctor/daily", label: "Agenda Diaria", icon: Clock },
    { href: "/doctor/appointments", label: "Agenda Mensual", icon: Calendar },
    { href: "/doctor/patients", label: "Pacientes", icon: Users },
    { href: "/doctor/stats", label: "Estadísticas", icon: BarChart3 },
];

export function QuickActions() {
    return (
        <div className="flex flex-wrap gap-2">
            {actions.map(({ href, label, icon: Icon }) => (
                <Button key={href} variant="outline" size="sm" asChild className="h-9">
                    <Link href={href}>
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                    </Link>
                </Button>
            ))}
        </div>
    );
}
