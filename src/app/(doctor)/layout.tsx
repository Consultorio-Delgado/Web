"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Calendar,
    Users,
    LogOut,
    Settings,
    UserCircle,
    Clock,
    FileText,
    BarChart3,
    ChevronDown,
    type LucideIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type NavLeaf = {
    name: string;
    href: string;
    icon: LucideIcon;
    devOnly?: boolean;
};

type NavGroup = {
    name: string;
    icon: LucideIcon;
    children: NavLeaf[];
    devOnly?: boolean;
};

type NavEntry = NavLeaf | NavGroup;

function isNavGroup(item: NavEntry): item is NavGroup {
    return "children" in item;
}

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [devMode, setDevMode] = useState(false);

    const navItems: NavEntry[] = [
        {
            name: "Tablero",
            icon: LayoutDashboard,
            children: [
                { name: "Principal", href: "/doctor/dashboard", icon: LayoutDashboard },
                { name: "Estadísticas", href: "/doctor/stats", icon: BarChart3 },
            ],
        },
        { name: "Agenda Diaria", href: "/doctor/daily", icon: Clock },
        { name: "Agenda Mensual", href: "/doctor/appointments", icon: Calendar },
        { name: "Pacientes", href: "/doctor/patients", icon: Users },
        { name: "Pacientes DRAPP", href: "/doctor/drapp-patients", icon: FileText },
        { name: "Doctores", href: "/doctor/doctors", icon: UserCircle, devOnly: true },
        { name: "Mi Perfil", href: "/doctor/profile", icon: Settings },
    ];

    const tableroActive = pathname.startsWith("/doctor/dashboard") || pathname.startsWith("/doctor/stats");
    const [tableroOpen, setTableroOpen] = useState(tableroActive);

    useEffect(() => {
        if (tableroActive) setTableroOpen(true);
    }, [tableroActive]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (profile && profile.role !== "doctor" && profile.role !== "admin") {
                router.push("/portal");
            }
        }
    }, [user, profile, loading, router]);

    if (loading || !profile) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const filteredNavItems = navItems
        .filter((item) => !item.devOnly || devMode)
        .map((item) => {
            if (!isNavGroup(item)) return item;
            return {
                ...item,
                children: item.children.filter((child) => !child.devOnly || devMode),
            };
        })
        .filter((item) => !isNavGroup(item) || item.children.length > 0);

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-0 flex bg-slate-100">
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consultorio Delgado</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Portal Médico</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        if (isNavGroup(item)) {
                            const GroupIcon = item.icon;
                            const open = tableroOpen;
                            return (
                                <div key={item.name} className="space-y-1">
                                    <Button
                                        type="button"
                                        variant={tableroActive ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start",
                                            tableroActive && "bg-slate-100 text-slate-900 font-semibold"
                                        )}
                                        onClick={() => setTableroOpen((v) => !v)}
                                    >
                                        <GroupIcon className="mr-2 h-4 w-4" />
                                        <span className="flex-1 text-left">{item.name}</span>
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 text-slate-400 transition-transform",
                                                open && "rotate-180"
                                            )}
                                        />
                                    </Button>
                                    {open && (
                                        <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                                            {item.children.map((child) => {
                                                const ChildIcon = child.icon;
                                                const isActive =
                                                    pathname === child.href || pathname.startsWith(child.href + "/");
                                                return (
                                                    <Link key={child.href} href={child.href}>
                                                        <Button
                                                            variant={isActive ? "secondary" : "ghost"}
                                                            className={cn(
                                                                "w-full justify-start h-9 text-sm",
                                                                isActive && "bg-slate-100 text-slate-900 font-semibold"
                                                            )}
                                                        >
                                                            <ChildIcon className="mr-2 h-3.5 w-3.5" />
                                                            {child.name}
                                                        </Button>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        // Evitar que /doctor/patients marque también otras rutas con prefijo raro
                        const active =
                            item.href === "/doctor/patients"
                                ? pathname === item.href || pathname.startsWith("/doctor/patients/")
                                : isActive;

                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={active ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        active && "bg-slate-100 text-slate-900 font-semibold"
                                    )}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {item.name}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between px-2 py-2 bg-slate-50 rounded-md border border-slate-100">
                        <Label htmlFor="dev-mode" className="text-xs font-medium text-slate-500 cursor-pointer">
                            Modo Desarrollador
                        </Label>
                        <Switch
                            id="dev-mode"
                            checked={devMode}
                            onCheckedChange={setDevMode}
                            className="scale-75 origin-right"
                        />
                    </div>

                    <div className="flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {profile?.firstName?.[0]}
                            {profile?.lastName?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">
                                {profile?.firstName} {profile?.lastName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">Médico</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={logout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
