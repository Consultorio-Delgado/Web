import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email";
import { downloadAndCleanupTempFiles } from "@/lib/serverStorage";

// Doctor email - Dra. Secondi
const DRA_SECONDI_EMAIL = "dra.secondi@hotmail.com";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validate required fields
        const requiredFields = ['doctorId', 'nombre', 'apellido', 'dni', 'fechaNacimiento', 'telefono', 'email', 'tipoConsulta', 'consulta'];
        for (const field of requiredFields) {
            if (!data[field]) {
                return NextResponse.json(
                    { error: `Campo requerido: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Process attachments (Download from temp Firebase Storage and delete them)
        let processedAttachments;
        if (data.attachments && data.attachments.length > 0) {
            processedAttachments = await downloadAndCleanupTempFiles(data.attachments);
        }

        // Send email
        const emailData = {
            ...data,
            attachments: processedAttachments
        };
        const result = await emailService.sendVirtualConsultationRequest(emailData, DRA_SECONDI_EMAIL);

        if (!result.success) {
            throw new Error("Failed to send email");
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Virtual Consultation API Error:", error);
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        );
    }
}
