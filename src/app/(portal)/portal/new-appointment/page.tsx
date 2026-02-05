import { BookingWizard } from "@/components/booking/BookingWizard";

export default function NewAppointmentPage() {
    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8 text-center">Nueva Reserva</h1>
            <BookingWizard />
        </div>
    );
}
