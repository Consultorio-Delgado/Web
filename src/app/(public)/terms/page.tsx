export default function TermsPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-6">Términos y Condiciones</h1>
            <div className="prose prose-slate">
                <p>Bienvenido a Consultorio Delgado. Al utilizar nuestro sitio web y servicios, usted acepta los siguientes términos:</p>
                <h3>1. Uso del Servicio</h3>
                <p>La plataforma permite la reserva de turnos médicos. El usuario se compromete a proporcionar información veraz y a utilizar el servicio de manera responsable.</p>
                <h3>2. Turnos y Cancelaciones</h3>
                <p>Los turnos deben ser cancelados con al menos 24 horas de antelación. Consultorio Delgado se reserva el derecho de suspender cuentas con múltiples inasistencias injustificadas.</p>
                <h3>3. Privacidad</h3>
                <p>Sus datos personales están protegidos según nuestra Política de Privacidad.</p>
                <h3>4. Modificaciones</h3>
                <p>Nos reservamos el derecho de modificar estos términos en cualquier momento.</p>
                <p className="mt-8 text-sm text-slate-500">Última actualización: Febrero 2026</p>
            </div>
        </div>
    );
}
