"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { adminService } from "@/services/adminService";

// --- SVG Icon de WhatsApp embebido ---
function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

// --- Enlace REAL de Google Maps del Consultorio Delgado ---
const GOOGLE_REVIEW_LINK = "https://g.page/r/CS5JJEKCiqQsEBM/review";

/**
 * Limpia el teléfono del paciente y lo normaliza al formato argentino.
 * Maneja formatos como: "+54 9 11 1234-5678", "011-1234-5678", "1112345678", etc.
 * Resultado final: "5491112345678" (sin + ni espacios)
 */
function cleanPhoneForWhatsApp(phone: string): string {
    // 1. Remover todo lo que no sea un dígito
    let cleaned = phone.replace(/\D/g, "");

    // 2. Si ya empieza con 54, verificar que tenga el 9 (celular)
    if (cleaned.startsWith("54")) {
        if (cleaned.startsWith("549")) {
            return cleaned;
        }
        return "549" + cleaned.slice(2);
    }

    // 3. Si empieza con 0 (ej: 01112345678), remover el 0 del prefijo
    if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
    }

    // 4. Si empieza con 15 (formato viejo de celular), removerlo
    //    y asumir código de área 11 (Buenos Aires)
    if (cleaned.startsWith("15") && cleaned.length <= 10) {
        cleaned = "11" + cleaned.slice(2);
    }

    // 5. Agregar código de país + 9 para celular argentino
    return "549" + cleaned;
}

/**
 * Genera el mensaje personalizado para solicitar la reseña.
 */
function buildReviewMessage(patientFirstName: string): string {
    return (
        `¡Hola ${patientFirstName}! 👋😊\n\n` +
        `Hoy te atendiste en el Consultorio Delgado. Esperamos que hayas tenido una buena experiencia ✨\n\n` +
        `¿Nos ayudarías dejando tu reseña en Google? ¡Solo te toma 1 minuto! ⭐\n\n` +
        `👉 ${GOOGLE_REVIEW_LINK}\n\n` +
        `¡Muchas gracias! 🙏❤️`
    );
}

// --- Props del componente ---
interface WhatsAppReviewButtonProps {
    patientName: string;
    patientPhone?: string;   // Teléfono directo (si ya lo tenemos)
    patientId?: string;      // ID del paciente para buscar teléfono si no lo tenemos
    variant?: "default" | "compact";
}

/**
 * Botón "Solicitar Reseña" de WhatsApp.
 * Si no tiene el teléfono directo, lo busca del perfil del paciente usando patientId.
 * Abre WhatsApp en nueva pestaña con el mensaje pre-cargado.
 */
export function WhatsAppReviewButton({
    patientName,
    patientPhone,
    patientId,
    variant = "default",
}: WhatsAppReviewButtonProps) {
    const [loading, setLoading] = useState(false);

    /**
     * Abre el enlace de WhatsApp con el teléfono dado.
     */
    const openWhatsApp = (phone: string) => {
        const firstName = patientName.split(" ")[0];
        const cleanedPhone = cleanPhoneForWhatsApp(phone);
        const message = buildReviewMessage(firstName);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`;

        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        toast.success(`Mensaje de reseña preparado para ${firstName}`);
    };

    const handleClick = async () => {
        // Si ya tenemos el teléfono directo, usarlo
        if (patientPhone) {
            openWhatsApp(patientPhone);
            return;
        }

        // Si no hay teléfono pero sí patientId, buscarlo del perfil
        if (patientId) {
            setLoading(true);
            try {
                const patient = await adminService.getPatientById(patientId);
                if (patient?.phone) {
                    openWhatsApp(patient.phone);
                } else {
                    toast.error("Este paciente no tiene teléfono registrado en su perfil.");
                }
            } catch (error) {
                console.error("Error fetching patient phone:", error);
                toast.error("Error al buscar el teléfono del paciente.");
            } finally {
                setLoading(false);
            }
            return;
        }

        // No hay ni teléfono ni ID
        toast.error("No se puede enviar: falta teléfono y datos del paciente.");
    };

    if (variant === "compact") {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-700 hover:text-green-900 hover:bg-green-50 gap-1"
                onClick={handleClick}
                disabled={loading}
                title="Solicitar reseña por WhatsApp"
            >
                {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                )}
                Reseña
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-200 gap-1.5"
            onClick={handleClick}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <WhatsAppIcon className="h-4 w-4" />
            )}
            Solicitar Reseña
        </Button>
    );
}
