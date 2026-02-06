export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
            <div className="prose prose-slate">
                <p>En Consultorio Delgado, nos tomamos muy en serio la privacidad de sus datos.</p>
                <h3>1. Datos que Recopilamos</h3>
                <p>Recopilamos información personal como nombre, DNI, email y teléfono únicamente para gestionar sus turnos y su historia clínica.</p>
                <h3>2. Uso de la Información</h3>
                <p>Sus datos no serán compartidos con terceros, excepto cuando sea necesario para la prestación del servicio médico o por requerimiento legal.</p>
                <h3>3. Seguridad</h3>
                <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales.</p>
                <h3>4. Sus Derechos</h3>
                <p>Tiene derecho a acceder, rectificar y suprimir sus datos personales contactándonos a través de nuestros canales oficiales.</p>
                <p className="mt-8 text-sm text-slate-500">Última actualización: Febrero 2026</p>
            </div>
        </div>
    );
}
