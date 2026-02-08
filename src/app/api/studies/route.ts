import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email";

// Doctor email mapping
const DOCTOR_EMAILS: Record<string, string> = {
    // Dra. Secondi
    "gTDWYSOdqHXIKxBgnzdCkPrOGat1": "dra.secondi@hotmail.com",
    // Dr. Capparelli  
    "fakeDocId_Capparelli": "dr.gcapparelli@yahoo.com.ar",
    // Dr. Capparelli (by ID)
    "capparelli": "dr.gcapparelli@yahoo.com.ar",
    // Dra. Secondi (by ID)
    "secondi": "dra.secondi@hotmail.com",
};

// Fallback based on name
const DOCTOR_EMAILS_BY_NAME: Record<string, string> = {
    "Secondi": "dra.secondi@hotmail.com",
    "Capparelli": "dr.gcapparelli@yahoo.com.ar",
};

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validate required fields
        const requiredFields = ['doctorId', 'nombre', 'apellido', 'dni', 'telefono', 'email', 'cobertura', 'numeroAfiliado', 'plan', 'pedido'];
        for (const field of requiredFields) {
            if (!data[field]) {
                return NextResponse.json(
                    { error: `Campo requerido: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Determine doctor email
        let doctorEmail = DOCTOR_EMAILS[data.doctorId];

        // Fallback to name-based lookup
        if (!doctorEmail && data.doctorName) {
            for (const [name, email] of Object.entries(DOCTOR_EMAILS_BY_NAME)) {
                if (data.doctorName.includes(name)) {
                    doctorEmail = email;
                    break;
                }
            }
        }

        // Default fallback
        if (!doctorEmail) {
            doctorEmail = "dra.secondi@hotmail.com";
        }

        // Send email
        const result = await emailService.sendStudyRequest(data, doctorEmail);

        if (!result.success) {
            throw new Error("Failed to send email");
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Study API Error:", error);
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        );
    }
}
