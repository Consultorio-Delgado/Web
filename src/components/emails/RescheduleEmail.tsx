import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';
import { getDoctorPrefix } from '@/lib/doctorPrefix';

interface RescheduleEmailProps {
    patientName: string;
    doctorName: string;
    previousDate: string;
    previousTime: string;
    date: string;
    time: string;
    specialty?: string;
    isSobreturno?: boolean;
    showPortalLink?: boolean;
}

export const RescheduleEmail = ({
    patientName,
    doctorName,
    previousDate,
    previousTime,
    date,
    time,
    specialty,
    isSobreturno,
    showPortalLink = true,
}: RescheduleEmailProps) => {
    const prefix = getDoctorPrefix(doctorName);

    return (
        <EmailLayout
            previewText={`Tu turno con ${prefix} ${doctorName} pasó al ${date} a las ${time}`}
            heading="Turno reprogramado"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Te escribimos para avisarte que tu turno cambió de día u horario.
                    El turno anterior queda sin efecto: seguís teniendo un solo turno, el nuevo.
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Si habías recibido un recordatorio con la fecha anterior, ignorá esa fecha.
                </Text>
            </Section>

            <Section className="bg-slate-50 rounded-lg p-4 my-4 border border-slate-100">
                <Text className="m-0 text-[13px] leading-[22px] text-slate-500">
                    Horario anterior
                </Text>
                <Text className="m-0 text-[14px] leading-[24px]" style={{ textDecoration: 'line-through' }}>
                    {previousDate} · {previousTime} hs
                </Text>
            </Section>

            <Section className="bg-blue-50 rounded-lg p-4 my-4 border border-blue-100">
                <Text className="m-0 text-[13px] leading-[22px] text-blue-800">
                    Nuevo horario
                </Text>
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
                {isSobreturno && (
                    <Text className="m-0 text-[13px] leading-[22px] text-blue-900 mt-2">
                        Este horario es un sobreturno. Puede haber una breve espera.
                    </Text>
                )}
            </Section>

            {showPortalLink && (
                <Section className="text-center mt-[32px] mb-[32px]">
                    <Button
                        className="bg-[#2563eb] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                        href="https://consultoriodelgado.com/portal"
                    >
                        Ver mi turno
                    </Button>
                </Section>
            )}

            <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' as const, fontSize: '13px', color: '#64748b' }}>
                <p style={{ margin: '0' }}>Este correo fue enviado automáticamente por Consultorio Delgado.</p>
                <p style={{ margin: '5px 0 0 0' }}>No hace falta responder este mensaje.</p>
            </div>
        </EmailLayout>
    );
};

export default RescheduleEmail;
