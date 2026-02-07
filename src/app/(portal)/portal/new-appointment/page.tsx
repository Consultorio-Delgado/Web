import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default function NewAppointmentPage() {
    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8 text-center">Nueva Reserva</h1>
            <Suspense fallback={<div className="flex justify-center p-8"><span className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent"></span></div>}>
                <BookingWizard />
            </Suspense>
        </div>
    );
}
