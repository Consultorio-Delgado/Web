"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491123456789";
const DEFAULT_MESSAGE = "Hola! Tengo una consulta sobre un turno en Consultorio Delgado.";

interface WhatsAppButtonProps {
    message?: string;
}

export function WhatsAppButton({ message = DEFAULT_MESSAGE }: WhatsAppButtonProps) {
    const handleClick = () => {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <button
            onClick={handleClick}
            aria-label="Contactar por WhatsApp"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#128C7E] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300"
        >
            <MessageCircle className="h-7 w-7 fill-current" />

            {/* Pulse animation ring */}
            <span className="absolute -z-10 h-14 w-14 animate-ping rounded-full bg-[#25D366] opacity-30" />
        </button>
    );
}
