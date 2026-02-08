import Link from "next/link";
import { MapPin, Phone, Instagram, Facebook } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t bg-slate-900">
            {/* Main Footer Section */}
            <div className="container py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-serif text-white mb-4">Datos de contacto</h3>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-slate-300 mb-4">
                            <Phone className="h-4 w-4" />
                            <a href="tel:+541145538329" className="hover:text-white transition-colors">
                                (011) 4553-8329
                            </a>
                        </div>

                        <h4 className="text-lg font-serif text-white mb-2 mt-6">Dirección</h4>
                        <div className="flex items-start justify-center md:justify-start gap-2 text-slate-400">
                            <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                            <p>Delgado 588 1°C, CABA</p>
                        </div>
                    </div>

                    {/* Google Maps Embed */}
                    <div className="text-center">
                        <h3 className="text-lg font-serif text-white mb-4">Mapa</h3>
                        <div className="w-full h-[200px] rounded-lg overflow-hidden shadow-lg">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.8979686254184!2d-58.4513!3d-34.5929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5e53a8f9a1f%3A0x5f6b0a0a0a0a0a0a!2sDelgado%20588%2C%20C1426BMJ%20CABA!5e0!3m2!1ses!2sar!4v1707000000000!5m2!1ses!2sar"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Ubicación Consultorio Delgado"
                            />
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="text-center md:text-right">
                        <h3 className="text-lg font-serif text-white mb-4">Redes</h3>
                        <div className="flex items-center justify-center md:justify-end gap-4">
                            <a
                                href="https://www.instagram.com/consultorio.delgado/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.facebook.com/Consultorio.Delgado"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright and Links */}
            <div className="border-t border-slate-800">
                <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
                    <p className="text-center text-sm leading-loose text-slate-400 md:text-left">
                        &copy; {new Date().getFullYear()} Consultorio Delgado. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-4 text-sm text-slate-400">
                        <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
