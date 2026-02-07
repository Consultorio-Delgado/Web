import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface ReminderEmailProps {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
}

export const ReminderEmail = ({
    patientName,
    doctorName,
    date,
    time,
}: ReminderEmailProps) => {
    return (
        <EmailLayout
            previewText={`Recordatorio de turno: Mañana con Dr. ${doctorName}`}
            heading="Recordatorio de Turno"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Te recordamos que tienes un turno programado para <strong>mañana</strong>.
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Por favor, recuerda llegar 10 minutos antes.
                </Text>
            </Section>

            <Section className="bg-blue-50 rounded-lg p-4 my-4 border border-blue-100">
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
                    <strong>Dirección:</strong> Av. Delgado 1234
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={`https://consultoriodelgado.com/portal`}
                >
                    Ver mis Turnos
                </Button>
            </Section>

            <Text className="text-[12px] text-gray-500 mt-4">
                Si no puedes asistir, por favor cancela tu turno desde el portal para liberar el horario a otro paciente.
            </Text>
        </EmailLayout>
    );
};

export default ReminderEmail;
