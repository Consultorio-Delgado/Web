"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, User as UserIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function Navbar() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const NavItems = () => (
        <>
            <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
                Inicio
            </Link>
            <Link href="/staff" className="text-sm font-medium hover:underline underline-offset-4">
                Especialistas
            </Link>
            <Link href="/booking" className="text-sm font-medium hover:underline underline-offset-4">
                Reservar Turno
            </Link>
        </>
    );

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        🏥 Consultorio Delgado
                    </Link>
                    <nav className="hidden md:flex gap-6 ml-6">
                        <NavItems />
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={profile?.firstName ? "" : ""} />
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
                                <DropdownMenuItem onClick={() => router.push("/portal")}>
                                    Portal Paciente
                                </DropdownMenuItem>
                                {profile?.role === 'admin' && (
                                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                                        Panel Administrativo
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    Cerrar Sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Ingresar</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">Registrarse</Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <div className="flex flex-col gap-4 mt-8">
                                <NavItems />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
