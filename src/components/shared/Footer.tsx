import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full border-t bg-slate-50 py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    &copy; {new Date().getFullYear()} Consultorio Delgado. Todos los derechos reservados.
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <Link href="/terms" className="hover:underline">Términos</Link>
                    <Link href="/privacy" className="hover:underline">Privacidad</Link>
                </div>

            </div>
        </footer>
    );
}
