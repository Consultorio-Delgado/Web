"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Users, LogOut, Settings } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter(); // Import this

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (profile && profile.role !== 'admin' && profile.role !== 'doctor') {
                router.push("/portal"); // Kick patients out
            }
        }
    }, [user, profile, loading, router]);

    if (loading || !profile) {
        return <div className="h-screen flex items-center justify-center bg-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>;
    }

    const navItems = [
        { name: "Tablero Principal", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Agenda", href: "/admin/appointments", icon: Calendar },
        { name: "Pacientes", href: "/admin/patients", icon: Users },
        { name: "Doctores", href: "/admin/doctors", icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consultorio Delgado</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Admin Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
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
                            <p className="text-xs text-slate-500 truncate">{profile?.role}</p>
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
                {/* Mobile Header (Todo: implement for mobile responsiveness) */}

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
