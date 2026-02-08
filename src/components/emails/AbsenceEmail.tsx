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
        </EmailLayout>
    );
};

export default AbsenceEmail;
