"use client";

import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';
import { getDoctorPrefix } from '@/lib/doctorPrefix';

interface ActionReminderEmailProps {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    confirmUrl: string;
}

export const ActionReminderEmail = ({
    patientName,
    doctorName,
    date,
    time,
    confirmUrl,
}: ActionReminderEmailProps) => {
    const prefix = getDoctorPrefix(doctorName);

    return (
        <EmailLayout
            previewText={`⚠️ Acción Requerida: Confirma tu turno para el ${date}`}
            heading="Confirmación de Asistencia"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Tienes un turno <strong>pendiente de confirmación</strong> para el día <strong>{date}</strong> a las <strong>{time}</strong>.
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Para asegurar tu lugar, por favor confirma tu asistencia presionando el siguiente botón:
                </Text>
            </Section>

            <Section className="bg-blue-50 rounded-lg p-4 my-4 border border-blue-100">
                <Text className="m-0 text-[14px] leading-[24px]">
                    <strong>Profesional:</strong> {prefix} {doctorName}
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
                    className="bg-[#16a34a] rounded text-white text-[16px] font-bold no-underline text-center px-8 py-4"
                    href={confirmUrl}
                >
                    ✓ SÍ, ASISTIRÉ
                </Button>
            </Section>

            <Section className="bg-amber-50 rounded-lg p-4 my-4 border border-amber-200">
                <Text className="m-0 text-[13px] leading-[20px] text-amber-800">
                    ⚠️ <strong>Importante:</strong> Si no confirmas en las próximas 24hs, el sistema podría liberar tu turno para otro paciente.
                </Text>
            </Section>

            <Text className="text-[12px] text-gray-500 mt-4">
                Si no puedes asistir, por favor cancela tu turno desde el portal para liberar el horario a otro paciente.
            </Text>
        </EmailLayout>
    );
};

export default ActionReminderEmail;
