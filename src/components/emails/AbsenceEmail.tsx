import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';
import { getDoctorPrefix } from '@/lib/doctorPrefix';

interface AbsenceEmailProps {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
}

export const paragraph = {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#000',
    marginBottom: '20px',
};

export const AbsenceEmail = ({
    patientName,
    doctorName,
    date,
    time,
}: AbsenceEmailProps) => {
    const prefix = getDoctorPrefix(doctorName);

    return (
        <EmailLayout
            previewText={`Consulta no realizada - Consultorio Delgado`}
            heading="Consulta no realizada"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text style={paragraph}>
                    Le recordamos que un turno <strong>AUSENTE</strong> o cancelado en el día es un turno desaprovechado y dejó sin atención a alguien que realmente lo necesitaba.
                </Text>
                <Text style={paragraph}>
                    Esto genera perjuicio tanto a pacientes como a los Dres.
                </Text>
                <Text style={paragraph}>
                    Es una época de mucha dificultad para el sistema de Salud, Debemos ser solidarios, <strong>TODOS</strong>.
                </Text>
                <Text style={paragraph}>
                    Hay mucha gente en espera, es época de mucha demanda ya que quedan pocos prestadores en las cartillas y cada vez menos por esta entre otras razones.
                </Text>
                <Text style={paragraph}>
                    Atte Recepción Consultorio Delgado
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={`https://consultoriodelgado.com`}
                >
                    Ir al Sitio Web
                </Button>
            </Section>

            <Section style={{ textAlign: 'center' as const, marginTop: '20px', marginBottom: '20px' }}>
                <Text style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px 0' }}>
                    Seguinos en Instagram para las últimas novedades informativas del consultorio
                </Text>
                <a
                    href="https://www.instagram.com/consultorio.delgado/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#E1306C', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
                >
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/174/174855.png"
                        width="20"
                        height="20"
                        alt="Instagram"
                        style={{ verticalAlign: 'middle' }}
                    />
                    @consultorio.delgado
                </a>
            </Section>
        </EmailLayout>
    );
};

export default AbsenceEmail;
