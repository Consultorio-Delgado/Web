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

export function Navbar() {
    const { user, profile, logout } = useAuth();
    const role = profile?.role;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">

                {/* Logo */}
                <div className="flex gap-6 md:gap-10">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/images/logo.png" alt="Consultorio Delgado" width={40} height={40} className="w-10 h-10 object-contain" />
                        <span className="inline-block font-bold text-xl text-primary">
                            Consultorio Delgado
                        </span>
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="" />
                                            <AvatarFallback>{profile?.firstName?.[0] || user.email?.[0]?.toUpperCase()}</AvatarFallback>
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
                                    <DropdownMenuItem onClick={() => {
                                        if (role === 'admin') router.push("/admin/dashboard");
                                        else if (role === 'doctor') router.push("/doctor/profile");
                                        else router.push("/portal");
                                    }}>
                                        {role === 'admin' ? "Panel Administrativo" : role === 'doctor' ? "Portal Médico" : "Portal Paciente"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
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
        </>
    );
}
