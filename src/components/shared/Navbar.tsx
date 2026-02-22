"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ContactButton } from "@/components/shared/ContactButton";

export function Navbar() {
    const { user, profile, logout } = useAuth();
    const role = profile?.role;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">

                {/* Logo */}
                <div className="flex gap-2 md:gap-10 items-center shrink-0">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/images/logo.png"
                            alt="Consultorio Delgado"
                            width={160}
                            height={48}
                            className="h-10 w-auto md:h-14 object-contain"
                            priority
                        />
                    </Link>

                    {/* Navegación Desktop */}
                    <nav className="hidden md:flex gap-6">
                        <NavItems />
                    </nav>
                </div>

                {/* Acciones (Login / Perfil) */}
                <div className="flex items-center gap-1 md:gap-4 shrink-0">
                    {user ? (
                        <div className="flex items-center gap-1 md:gap-4">
                            {/* Direct Links */}
                            {role === 'admin' || role === 'doctor' ? (
                                <Link href="/doctor/dashboard" className="hidden md:block">
                                    <Button variant="ghost" className="text-slate-600 hover:text-primary hover:bg-slate-50">
                                        Portal Médico
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/portal">
                                        <Button variant="ghost" className="px-2 md:px-4 text-xs md:text-sm text-slate-600 hover:text-primary hover:bg-slate-50 h-8 md:h-10">
                                            Portal Paciente
                                        </Button>
                                    </Link>
                                    <Link href="/portal/profile">
                                        <Button variant="ghost" className="px-2 md:px-4 text-xs md:text-sm text-slate-600 hover:text-primary hover:bg-slate-50 h-8 md:h-10">
                                            Mi Perfil
                                        </Button>
                                    </Link>
                                </>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1 md:ml-2">
                                        <Avatar className="h-8 w-8 border border-slate-200">
                                            <AvatarImage src="" />
                                            <AvatarFallback className="bg-primary/5 text-primary">
                                                {profile?.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{profile?.firstName} {profile?.lastName}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                        Cerrar Sesión
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Ingresar</Button>
                            </Link>
                            <Link href="/register" className="hidden sm:inline-flex">
                                <Button size="sm">Registrarse</Button>
                            </Link>
                        </div>
                    )}

                    {/* Botón Menú Móvil */}
                    <button
                        className="md:hidden p-1 text-slate-600"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Menú Móvil Desplegable */}
            {isMenuOpen && (
                <div className="md:hidden border-t p-4 bg-background animate-in slide-in-from-top-2">
                    <nav className="flex flex-col gap-4">
                        {user && (
                            <>
                                <Link href="/portal" className="text-lg py-2 border-b border-border/50 font-medium text-slate-900" onClick={() => setIsMenuOpen(false)}>
                                    Portal Paciente
                                </Link>
                                <Link href="/portal/profile" className="text-lg py-2 border-b border-border/50 font-medium text-slate-900" onClick={() => setIsMenuOpen(false)}>
                                    Mi Perfil
                                </Link>
                            </>
                        )}
                        <NavItems mobile onClick={() => setIsMenuOpen(false)} />
                    </nav>
                </div>
            )}
        </header>
    );
}

function NavItems({ mobile = false, onClick }: { mobile?: boolean; onClick?: () => void }) {
    const baseStyles = "text-sm font-medium transition-colors hover:text-primary";
    const mobileStyles = "text-lg py-2 border-b border-border/50 text-slate-600";

    const className = mobile ? mobileStyles : baseStyles;

    return (
        <>
            <Link href="/" className={className} onClick={onClick}>
                Inicio
            </Link>
            <Link href="/#staff" className={className} onClick={onClick}>
                Especialistas
            </Link>
            <Link href="/portal/new-appointment" className={className} onClick={onClick}>
                Reservar Turno
            </Link>
            <Link href="/portal/prescriptions" className={className} onClick={onClick}>
                Recetas
            </Link>
        </>
    );
}
