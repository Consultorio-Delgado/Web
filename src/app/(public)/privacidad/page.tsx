import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Política de Privacidad",
    description: "Política de privacidad y protección de datos personales de Consultorio Delgado.",
};

export default function PrivacidadPage() {
    return (
        <div className="container max-w-4xl py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Política de Privacidad</CardTitle>
                    <p className="text-muted-foreground">Última actualización: Febrero 2024</p>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                    <h2>1. Introducción</h2>
                    <p>
                        En Consultorio Delgado nos comprometemos a proteger la privacidad de los datos
                        personales de nuestros pacientes y usuarios, en cumplimiento de la Ley N° 25.326
                        de Protección de los Datos Personales de la República Argentina y su normativa complementaria.
                    </p>

                    <h2>2. Responsable del Tratamiento</h2>
                    <p>
                        El responsable del tratamiento de sus datos personales es Consultorio Delgado,
                        con domicilio en Delgado 588, 1°C, Ciudad Autónoma de Buenos Aires, Argentina.
                    </p>

                    <h2>3. Datos Personales que Recolectamos</h2>
                    <p>Recopilamos los siguientes tipos de datos:</p>
                    <ul>
                        <li><strong>Datos de identificación:</strong> nombre, apellido, DNI, fecha de nacimiento.</li>
                        <li><strong>Datos de contacto:</strong> correo electrónico, número de teléfono, dirección.</li>
                        <li><strong>Datos de salud:</strong> historial médico, antecedentes, información de consultas previas (datos sensibles protegidos especialmente).</li>
                        <li><strong>Datos de navegación:</strong> cookies, dirección IP, información del dispositivo.</li>
                    </ul>

                    <h2>4. Finalidad del Tratamiento</h2>
                    <p>Sus datos personales son utilizados para:</p>
                    <ul>
                        <li>Gestionar la reserva de turnos médicos.</li>
                        <li>Brindar atención médica de calidad.</li>
                        <li>Enviar recordatorios y confirmaciones de turnos.</li>
                        <li>Mantener el historial clínico según la normativa sanitaria vigente.</li>
                        <li>Comunicar novedades del consultorio (con su consentimiento previo).</li>
                    </ul>

                    <h2>5. Base Legal del Tratamiento</h2>
                    <p>El tratamiento de sus datos se basa en:</p>
                    <ul>
                        <li>Su consentimiento expreso al registrarse y utilizar nuestros servicios.</li>
                        <li>El cumplimiento de obligaciones legales (Ley de Historia Clínica, normativas sanitarias).</li>
                        <li>La ejecución del contrato de prestación de servicios médicos.</li>
                    </ul>

                    <h2>6. Protección de Datos Sensibles</h2>
                    <p>
                        Los datos de salud son considerados datos sensibles bajo la Ley 25.326.
                        Implementamos medidas de seguridad reforzadas para su protección, incluyendo
                        encriptación, controles de acceso y auditoría de operaciones.
                    </p>

                    <h2>7. Transferencia de Datos</h2>
                    <p>
                        Sus datos no serán transferidos a terceros, salvo en los siguientes casos:
                    </p>
                    <ul>
                        <li>Requerimiento de autoridades competentes por mandato legal.</li>
                        <li>Derivación a otros profesionales de la salud con su consentimiento.</li>
                        <li>Proveedores de servicios que actúan como encargados del tratamiento (hosting, sistemas de gestión).</li>
                    </ul>

                    <h2>8. Sus Derechos</h2>
                    <p>Usted tiene derecho a:</p>
                    <ul>
                        <li><strong>Acceso:</strong> Conocer qué datos personales suyos tenemos registrados.</li>
                        <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
                        <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos (respetando plazos legales de conservación de historia clínica).</li>
                        <li><strong>Oposición:</strong> Oponerse al tratamiento para fines de marketing.</li>
                    </ul>
                    <p>
                        Para ejercer estos derechos, puede contactarnos a través de los canales
                        habilitados en el sitio web.
                    </p>

                    <h2>9. Conservación de Datos</h2>
                    <p>
                        Los datos personales se conservan durante el tiempo necesario para cumplir
                        con las finalidades descritas. Los datos clínicos se conservan según los
                        plazos establecidos por la Ley de Historia Clínica N° 26.529 (mínimo 10 años).
                    </p>

                    <h2>10. Cookies</h2>
                    <p>
                        Utilizamos cookies para mejorar su experiencia de navegación. Puede configurar
                        su navegador para rechazar cookies, aunque esto podría afectar la funcionalidad
                        del sitio.
                    </p>

                    <h2>11. Seguridad</h2>
                    <p>
                        Implementamos medidas técnicas y organizativas para proteger sus datos contra
                        acceso no autorizado, pérdida o alteración, incluyendo cifrado de datos,
                        firewalls y protocolos de seguridad actualizados.
                    </p>

                    <h2>12. Modificaciones</h2>
                    <p>
                        Esta política puede ser actualizada periódicamente. Cualquier cambio significativo
                        será comunicado a través del sitio web.
                    </p>

                    <h2>13. Contacto</h2>
                    <p>
                        Para consultas sobre privacidad y protección de datos, puede contactarnos en
                        nuestro consultorio o a través de los canales habilitados en el sitio web.
                    </p>

                    <div className="mt-8 p-4 bg-slate-100 rounded-lg">
                        <p className="text-sm text-slate-600">
                            <strong>AAIP - Agencia de Acceso a la Información Pública</strong><br />
                            Órgano de Control de la Ley 25.326<br />
                            Av. Pte. Julio A. Roca 710, CABA | www.argentina.gob.ar/aaip
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
