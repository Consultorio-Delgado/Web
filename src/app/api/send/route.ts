
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { to, patientName, doctorName, date, time } = payload;

    console.log(`[API/Send] Payload received:`, { to, patientName, doctorName, date, time });
    console.log(`[API/Send] API Key present:`, !!process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Consultorio Delgado <onboarding@resend.dev>', // Default testing domain
      to: [to],
      subject: 'Confirmación de Turno - Consultorio Delgado',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Confirmación de Turno</h1>
          <p>Hola <strong>${patientName}</strong>,</p>
          <p>Tu turno ha sido confirmado con éxito.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctorName}</p>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Horario:</strong> ${time} hs</p>
            <p style="margin: 5px 0;"><strong>Dirección:</strong> Av. Delgado 1234, Ciudad</p>
          </div>

          <p>Si necesitas cancelar o reprogramar, puedes hacerlo desde tu <a href="https://consultoriodelgado.com/portal">Portal de Paciente</a>.</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
            Consultorio Delgado - Cuidamos tu salud.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(`[API/Send] Resend Error:`, error);
      return Response.json({ error }, { status: 400 });
    }

    console.log(`[API/Send] Success:`, data);
    return Response.json({ data });
  } catch (error) {
    console.error(`[API/Send] Internal Error:`, error);
    return Response.json({ error }, { status: 500 });
  }
}
