import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email";

const DOCTOR_EMAIL = "dr.gcapparelli@yahoo.com.ar";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const requiredFields = ["nombre", "apellido", "dni", "telefono", "email", "cobertura", "consulta"];
        for (const field of requiredFields) {
            if (!data[field] || !String(data[field]).trim()) {
                return NextResponse.json(
                    { error: `Campo requerido: ${field}` },
                    { status: 400 }
                );
            }
        }

        const isParticular = data.cobertura === "PARTICULAR";
        if (!isParticular) {
            if (!data.numeroAfiliado || !String(data.numeroAfiliado).trim()) {
                return NextResponse.json(
                    { error: "Campo requerido: numeroAfiliado" },
                    { status: 400 }
                );
            }
            if (!data.plan || !String(data.plan).trim()) {
                return NextResponse.json(
                    { error: "Campo requerido: plan" },
                    { status: 400 }
                );
            }
        }

        const result = await emailService.sendGeneralConsultation(
            {
                nombre: String(data.nombre).trim(),
                apellido: String(data.apellido).trim(),
                dni: String(data.dni).trim(),
                telefono: String(data.telefono).trim(),
                email: String(data.email).trim(),
                cobertura: String(data.cobertura).trim(),
                numeroAfiliado: isParticular ? "No aplica" : String(data.numeroAfiliado).trim(),
                plan: isParticular ? "No aplica" : String(data.plan).trim(),
                token: data.token ? String(data.token).trim() : undefined,
                consulta: String(data.consulta).trim(),
                attachments: Array.isArray(data.attachments) ? data.attachments : undefined,
            },
            DOCTOR_EMAIL
        );

        if (!result.success) {
            throw new Error("Failed to send email");
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("General Consultation API Error:", error);
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        );
    }
}
