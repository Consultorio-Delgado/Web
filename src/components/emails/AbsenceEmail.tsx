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
                    Entendemos que pueden surgir imprevistos, pero un turno ausente implica un turno menos disponible para alguien que lo necesitaba. Por favor cancelar el turno 48hs antes por la web, para que otro paciente pueda tomarlo.
                </Text>
                <Text className="text-[14px] leading-[24px] text-black">
                    Si crees que esto es un error, por favor comunícate con nosotros por el formulario de CONTACTO de la web.
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
