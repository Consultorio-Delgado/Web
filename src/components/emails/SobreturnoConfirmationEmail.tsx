import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';
import { getDoctorPrefix } from '@/lib/doctorPrefix';

interface SobreturnoConfirmationEmailProps {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    specialty?: string;
}

export const SobreturnoConfirmationEmail = ({
    patientName,
    doctorName,
    date,
    time,
    specialty
}: SobreturnoConfirmationEmailProps) => {
    const prefix = getDoctorPrefix(doctorName);

    return (
        <EmailLayout
            previewText={`Turno asignado con ${prefix} ${doctorName}`}
            heading="¡Turno Asignado!"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Le informamos que se le ha asignado un turno en Consultorio Delgado. A continuación los detalles:
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

            {/* Registration Invitation Section */}
            <Section className="bg-blue-50 rounded-lg p-4 my-4 border border-blue-100">
                <Text className="m-0 text-[14px] leading-[24px] text-blue-900 font-semibold">
                    📋 ¡Cree su cuenta en nuestro portal!
                </Text>
                <Text className="m-0 text-[13px] leading-[22px] text-blue-800 mt-2">
                    Registrándose en nuestro sitio web podrá gestionar sus turnos, solicitar recetas, consultas virtuales y mucho más, todo desde la comodidad de su celular o computadora.
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href="https://consultoriodelgado.com/register"
                >
                    Crear mi Cuenta Gratis
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

            <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' as const, fontSize: '13px', color: '#64748b' }}>
                <p style={{ margin: '0' }}>Este correo fue enviado automáticamente por Consultorio Delgado.</p>
                <p style={{ margin: '5px 0 0 0' }}>Si tiene alguna consulta, comuníquese con el consultorio.</p>
            </div>
        </EmailLayout>
    );
};

export default SobreturnoConfirmationEmail;
