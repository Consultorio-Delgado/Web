import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { email, nombre, fecha, hora, doctorName } = req.body;

    try {
        const data = await resend.emails.send({
            from: 'Consultorio Delgado <turnos@consultoriodelgado.com>', // User can update this later
            to: [email],
            subject: 'Confirmación de Turno - Consultorio Delgado',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #0ea5e9;">Hola ${nombre},</h1>
            <p style="font-size: 16px;">Tu turno ha sido confirmado con éxito.</p>
            
            <div style="background-color: #fce7f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Profesional:</strong> ${doctorName || 'Consultorio Delgado'}</p>
                <p style="margin: 5px 0;"><strong>Fecha:</strong> ${fecha}</p>
                <p style="margin: 5px 0;"><strong>Hora:</strong> ${hora} hs</p>
                <p style="margin: 5px 0;"><strong>Dirección:</strong> Delgado 760, Colegiales</p>
            </div>

            <p>Si necesitas cancelar o reprogramar, por favor avísanos con anticipación.</p>
            <p>¡Te esperamos!</p>
        </div>
      `
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Resend Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
