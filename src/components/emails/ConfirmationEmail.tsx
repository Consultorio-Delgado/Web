import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface ConfirmationEmailProps {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    appointmentId: string; // Used for "Manage Appointment" link
}

export const ConfirmationEmail = ({
    patientName,
    doctorName,
    date,
    time,
    appointmentId
}: ConfirmationEmailProps) => {
    return (
        <EmailLayout
            previewText={`Confirmación de turno con Dr. ${doctorName}`}
            heading="¡Turno Confirmado!"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Tu turno ha sido reservado exitosamente. A continuación te dejamos los detalles:
                </Text>
            </Section>

            <Section className="bg-slate-50 rounded-lg p-4 my-4 border border-slate-100">
                <Text className="m-0 text-[14px] leading-[24px]">
                    <strong>Profesional:</strong> Dr. {doctorName}
                </Text>
                <Text className="m-0 text-[14px] leading-[24px]">
                    <strong>Fecha:</strong> {date}
                </Text>
                <Text className="m-0 text-[14px] leading-[24px]">
                    <strong>Hora:</strong> {time} hs
                </Text>
                <Text className="m-0 text-[14px] leading-[24px]">
                    <strong>Dirección:</strong> Delgado 588, 1°C (1426) CABA
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={`https://consultoriodelgado.com/portal`}
                >
                    Gestionar mi Turno
                </Button>
            </Section>

            <Text className="text-[12px] text-gray-500 mt-4">
                Si no realizaste esta reserva, por favor contáctanos inmediatamente.
            </Text>
        </EmailLayout>
    );
};

export default ConfirmationEmail;
