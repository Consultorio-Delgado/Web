import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Términos y Condiciones",
    description: "Términos y condiciones de uso de los servicios de Consultorio Delgado.",
};

export default function TerminosPage() {
    return (
        <div className="container max-w-4xl py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Términos y Condiciones de Uso</CardTitle>
                    <p className="text-muted-foreground">Última actualización: Febrero 2024</p>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                    <h2>1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar el sitio web de Consultorio Delgado (en adelante, "el Sitio"),
                        usted acepta cumplir con estos términos y condiciones de uso. Si no está de acuerdo
                        con alguno de estos términos, le solicitamos que no utilice el Sitio.
                    </p>

                    <h2>2. Descripción del Servicio</h2>
                    <p>
                        El Sitio proporciona una plataforma para la reserva de turnos médicos en línea.
                        Este servicio está diseñado para facilitar la coordinación entre pacientes y
                        profesionales de la salud que forman parte de Consultorio Delgado.
                    </p>

                    <h2>3. Uso del Servicio</h2>
                    <p>El usuario se compromete a:</p>
                    <ul>
                        <li>Proporcionar información veraz y actualizada al momento de registrarse.</li>
                        <li>Utilizar el servicio exclusivamente para fines de reserva de turnos médicos.</li>
                        <li>No compartir sus credenciales de acceso con terceros.</li>
                        <li>Respetar los horarios de los turnos reservados y cancelar con anticipación si no puede asistir.</li>
                    </ul>

                    <h2>4. Reserva y Cancelación de Turnos</h2>
                    <p>
                        Los usuarios pueden reservar turnos sujetos a disponibilidad. Las cancelaciones
                        deben realizarse con al menos 24 horas de anticipación. El consultorio se reserva
                        el derecho de reprogramar turnos por razones de fuerza mayor, notificando al
                        paciente con la mayor antelación posible.
                    </p>

                    <h2>5. Responsabilidad Médica</h2>
                    <p>
                        El Sitio es únicamente una herramienta de gestión de turnos y no sustituye la
                        consulta médica presencial. Las decisiones sobre tratamientos y diagnósticos
                        son responsabilidad exclusiva de los profesionales médicos del consultorio.
                    </p>

                    <h2>6. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido del Sitio, incluyendo textos, gráficos, logos, e imágenes,
                        es propiedad de Consultorio Delgado y está protegido por las leyes de propiedad
                        intelectual aplicables.
                    </p>

                    <h2>7. Limitación de Responsabilidad</h2>
                    <p>
                        Consultorio Delgado no será responsable por interrupciones del servicio debido
                        a mantenimiento, fallos técnicos, o causas fuera de su control. El uso del
                        Sitio es bajo responsabilidad del usuario.
                    </p>

                    <h2>8. Modificaciones</h2>
                    <p>
                        Nos reservamos el derecho de modificar estos términos en cualquier momento.
                        Los cambios serán efectivos desde su publicación en el Sitio. El uso continuado
                        del servicio implica la aceptación de los términos modificados.
                    </p>

                    <h2>9. Legislación Aplicable</h2>
                    <p>
                        Estos términos se rigen por las leyes de la República Argentina. Cualquier
                        controversia será sometida a la jurisdicción de los tribunales ordinarios
                        de la Ciudad Autónoma de Buenos Aires.
                    </p>

                    <h2>10. Contacto</h2>
                    <p>
                        Para consultas sobre estos términos, puede contactarnos a través de los
                        canales habilitados en el Sitio o en nuestro consultorio ubicado en
                        Delgado 588, 1°C, CABA.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
