import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';
import { getDoctorPrefix } from '@/lib/doctorPrefix';

interface ConfirmationEmailProps {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    appointmentId: string;
    specialty?: string;
}

export const ConfirmationEmail = ({
    patientName,
    doctorName,
    date,
    time,
    appointmentId,
    specialty
}: ConfirmationEmailProps) => {
    const prefix = getDoctorPrefix(doctorName);

    return (
        <EmailLayout
            previewText={`Confirmación de turno con ${prefix} ${doctorName}`}
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
                    <strong>Profesional:</strong> {prefix} {doctorName}
                </Text>
                {specialty && (
                    <Text className="m-0 text-[14px] leading-[24px] text-slate-600">
                        <strong>Especialidad:</strong> {specialty}
                    </Text>
                )}
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

            <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' as const, fontSize: '13px', color: '#64748b' }}>
                <p style={{ margin: '0' }}>Este correo fue enviado automáticamente por Consultorio Delgado.</p>
                <p style={{ margin: '5px 0 0 0' }}>Si no realizaste esta reserva, cancelala clickeando en tu portal.</p>
            </div>
        </EmailLayout>
    );
};

export default ConfirmationEmail;
