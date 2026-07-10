import * as React from 'react';
import { Section, Text, Button } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface PasswordResetEmailProps {
    patientName?: string;
    resetLink: string;
}

export const PasswordResetEmail = ({
    patientName,
    resetLink
}: PasswordResetEmailProps) => {
    return (
        <EmailLayout
            previewText="Restablecé tu contraseña - Consultorio Delgado"
            heading="Restablecer Contraseña"
        >
            <Section className="my-[20px]">
                <Text className="text-[14px] leading-[24px] text-black">
                    Hola{patientName ? <> <strong>{patientName}</strong></> : ''},
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta en
                    Consultorio Delgado. Hacé clic en el botón de abajo para crear una nueva
                    contraseña:
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[14px] font-semibold no-underline text-center px-8 py-4"
                    href={resetLink}
                >
                    Cambiar mi Contraseña
                </Button>
            </Section>

            <Section className="my-[20px]">
                <Text className="text-[13px] leading-[20px] text-[#64748b]">
                    Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                </Text>
                <Text className="text-[12px] leading-[20px] text-[#2563eb] break-all">
                    {resetLink}
                </Text>
            </Section>

            <Section className="bg-amber-50 rounded-lg p-4 my-4 border border-amber-100">
                <Text className="m-0 text-[13px] leading-[20px] text-amber-800">
                    ⚠️ Este enlace expira en 1 hora. Si no solicitaste este cambio, podés ignorar
                    este mensaje y tu contraseña seguirá siendo la misma.
                </Text>
            </Section>

            <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' as const, fontSize: '13px', color: '#64748b' }}>
                <p style={{ margin: '0' }}>Este correo fue enviado automáticamente por Consultorio Delgado.</p>
                <p style={{ margin: '5px 0 0 0' }}>Si no solicitaste restablecer tu contraseña, ignorá este email.</p>
            </div>
        </EmailLayout>
    );
};

export default PasswordResetEmail;
