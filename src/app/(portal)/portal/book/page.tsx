"use client";

import { BookingWizard } from "@/components/booking/BookingWizard";

export default function BookPage() {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Reservar un Turno</h1>
                <p className="text-muted-foreground mt-2">Sigue los pasos para agendar tu próxima consulta.</p>
            </div>

            <BookingWizard />
        </div>
    );
}
