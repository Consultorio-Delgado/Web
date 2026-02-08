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
                <Text className="text-[14px] leading-[24px] text-black">
                    Notamos que no pudiste asistir a tu turno programado para hoy, {date} a las {time} hs, con {prefix} {doctorName}.
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Entendemos que pueden surgir imprevistos. Te invitamos a reprogramar tu visita a través de nuestro portal de pacientes o contactándonos por WhatsApp.
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Si crees que esto es un error, por favor comunícate con nosotros.
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2563eb] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={`https://consultoriodelgado.com/portal/new-appointment`}
                >
                    Reprogramar Turno
                </Button>
            </Section>
        </EmailLayout>
    );
};

export default AbsenceEmail;
