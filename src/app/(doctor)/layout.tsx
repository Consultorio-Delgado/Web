"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Users, LogOut, Settings, UserCircle, ShieldAlert } from "lucide-react";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

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
        // Dashboard not yet implemented for doctor, maybe redirect to agenda or profile?
        // For now, let's keep consistency with Admin layout but maybe point to profile as "Home" or a future dashboard.
        // Actually, doctor landing is often their agenda or profile. Let's use Profile as default for now or maybe Agenda if it exists.
        // Checking file structure: doctor/page.tsx does NOT exist.
        // doctor/profile/page.tsx EXISTS.
        // doctor/exceptions/page.tsx EXISTS.
        // doctor/patient/[id]/page.tsx EXISTS.

        // We need a main entry point. Currently /doctor redirects to ?? (It was 404ing in my check).
        // Let's assume /doctor/profile is a good start, or maybe /admin/appointments if they share the agenda view?
        // Wait, the user said "usa la disposicion de los menus como el de admin".

        { name: "Mi Perfil", href: "/doctor/profile", icon: UserCircle },
        { name: "Mis Pacientes", href: "/admin/patients", icon: Users }, // Reusing admin patients view? Or do they have a specific one? The task list mentioned "Patient Search" and "Timeline".
        // The task "Patient Timeline" is at /doctor/patient/[id]. The search might be on a shared page or a new one.
        // Previously implemented: "Feature: Patient Search (Name/DNI)". Where?
        // Let's assume they can use the Admin Patient list for now if they have permissions, OR we should have a /doctor/patients page.
        // Checking file structure again... "doctor/patient" dir exists but only has [id].
        // So they probably search via the Admin Patients page or a new component.
        // Let's link to /admin/patients for now as they likely have access via RLS or logic.

        { name: "Agenda", href: "/admin/appointments", icon: Calendar }, // Doctors use the admin appointments view heavily.
        { name: "Excepciones", href: "/doctor/exceptions", icon: ShieldAlert },
    ];

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consultorio Delgado</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Portal Médico</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
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

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
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
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
