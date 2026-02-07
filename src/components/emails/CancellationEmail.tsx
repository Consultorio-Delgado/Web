import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface CancellationEmailProps {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
}

export const CancellationEmail = ({
    patientName,
    doctorName,
    date,
    time,
}: CancellationEmailProps) => {
    return (
        <EmailLayout
            previewText={`Cancelación de turno con Dr. ${doctorName}`}
            heading="Turno Cancelado"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Te informamos que tu turno ha sido cancelado exitosamente.
                </Text>
            </Section>

            <Section className="bg-red-50 rounded-lg p-4 my-4 border border-red-100">
                <Text className="m-0 text-[14px] leading-[24px] text-red-800 font-semibold">
                    Detalles del turno cancelado:
                </Text>
                <Text className="m-0 text-[14px] leading-[24px] text-red-800">
                    Dr. {doctorName} - {date} a las {time} hs
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={`https://consultoriodelgado.com/portal/new-appointment`}
                >
                    Reservar Nuevo Turno
                </Button>
            </Section>
        </EmailLayout>
    );
};

export default CancellationEmail;
