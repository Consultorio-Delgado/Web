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
                <div className="flex gap-6 md:gap-10 items-center">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/images/logo.png"
                            alt="Consultorio Delgado"
                            width={200}
                            height={60}
                            className="h-14 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Navegación Desktop */}
                    <nav className="hidden md:flex gap-6">
                        <NavItems />
                    </nav>
                </div>

                {/* Acciones (Login / Perfil) */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            {/* Direct Links based on Role */}
                            {role === 'admin' || role === 'doctor' ? (
                                <Link href="/doctor/dashboard">
                                    <Button variant="ghost" className="text-slate-600 hover:text-primary hover:bg-slate-50">
                                        Portal Médico
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/portal">
                                        <Button variant="ghost" className="text-slate-600 hover:text-primary hover:bg-slate-50">
                                            Portal Paciente
                                        </Button>
                                    </Link>
                                    <Link href="/portal/profile">
                                        <Button variant="ghost" className="text-slate-600 hover:text-primary hover:bg-slate-50">
                                            Mi Perfil
                                        </Button>
                                    </Link>
                                </>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
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
                            <Link href="/register">
                                <Button size="sm">Registrarse</Button>
                            </Link>
                        </div>
                    )}

                    {/* Botón Menú Móvil */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Menú Móvil Desplegable */}
            {isMenuOpen && (
                <div className="md:hidden border-t p-4 bg-background">
                    <nav className="flex flex-col gap-4">
                        <NavItems mobile />
                    </nav>
                </div>
            )}
        </header>
    );
}

function NavItems({ mobile = false }: { mobile?: boolean }) {
    const baseStyles = "text-sm font-medium transition-colors hover:text-primary";
    const mobileStyles = "text-lg py-2 border-b border-border/50";

    const className = mobile ? mobileStyles : baseStyles;

    return (
        <>
            <Link href="/" className={className}>
                Inicio
            </Link>
            <Link href="/#staff" className={className}>
                Especialistas
            </Link>
            <Link href="/portal/new-appointment" className={className}>
                Reservar Turno
            </Link>
            <Link href="/portal/prescriptions" className={className}>
                Recetas
            </Link>
            <ContactButton variant="link" className={className} />
        </>
    );
}
