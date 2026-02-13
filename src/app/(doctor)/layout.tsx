"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Users, LogOut, Settings, UserCircle, ShieldAlert, Clock, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [devMode, setDevMode] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (profile && profile.role !== 'doctor' && profile.role !== 'admin') {
                router.push("/portal");
            }
        }
    }, [user, profile, loading, router]);

    if (loading || !profile) {
        return <div className="h-screen flex items-center justify-center bg-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>;
    }

    const navItems = [
        { name: "Tablero Principal", href: "/doctor/dashboard", icon: LayoutDashboard },
        { name: "Agenda Diaria", href: "/doctor/daily", icon: Clock },
        { name: "Agenda Mensual", href: "/doctor/appointments", icon: Calendar },
        { name: "Pacientes", href: "/doctor/patients", icon: Users },
        { name: "Pacientes DRAPP", href: "/doctor/drapp-patients", icon: FileText },
        { name: "Doctores", href: "/doctor/doctors", icon: UserCircle, devOnly: true },
        { name: "Mi Perfil", href: "/doctor/profile", icon: Settings },
    ];

    const filteredNavItems = navItems.filter(item => !item.devOnly || devMode);

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-0 flex bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consultorio Delgado</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Portal Médico</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn("w-full justify-start", isActive && "bg-slate-100 text-slate-900 font-semibold")}
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
                        <Label htmlFor="dev-mode" className="text-xs font-medium text-slate-500 cursor-pointer">Modo Desarrollador</Label>
                        <Switch id="dev-mode" checked={devMode} onCheckedChange={setDevMode} className="scale-75 origin-right" />
                    </div>

                    <div className="flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{profile?.firstName} {profile?.lastName}</p>
                            <p className="text-xs text-slate-500 truncate">Médico</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
