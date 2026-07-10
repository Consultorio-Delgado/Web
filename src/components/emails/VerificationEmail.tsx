import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface VerificationEmailProps {
    patientName: string;
    verificationLink: string;
}

export const VerificationEmail = ({
    patientName,
    verificationLink
}: VerificationEmailProps) => {
    return (
        <EmailLayout
            previewText="Verificá tu email - Consultorio Delgado"
            heading="Verificá tu Email"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola <strong>{patientName}</strong>,
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    ¡Gracias por registrarte en Consultorio Delgado! Para completar tu registro
                    y poder gestionar tus turnos online, necesitamos que verifiques tu dirección
                    de correo electrónico.
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[14px] font-semibold no-underline text-center px-8 py-4"
                    href={verificationLink}
                >
                    Verificar mi Email
                </Button>
            </Section>

            <Section className="my-[20px]">
                <Text className="text-[13px] leading-[20px] text-[#64748b]">
                    Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                </Text>
                <Text className="text-[12px] leading-[20px] text-[#2563eb] break-all">
                    {verificationLink}
                </Text>
            </Section>

            <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' as const, fontSize: '13px', color: '#64748b' }}>
                <p style={{ margin: '0' }}>Este correo fue enviado automáticamente por Consultorio Delgado.</p>
                <p style={{ margin: '5px 0 0 0' }}>Si no creaste esta cuenta, podés ignorar este mensaje.</p>
            </div>
        </EmailLayout>
    );
};

export default VerificationEmail;
