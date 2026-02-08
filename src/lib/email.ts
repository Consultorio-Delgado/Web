import { Resend } from 'resend';
import { render } from '@react-email/render';
import ConfirmationEmail from '@/components/emails/ConfirmationEmail';
import CancellationEmail from '@/components/emails/CancellationEmail';
import ReminderEmail from '@/components/emails/ReminderEmail';
import ActionReminderEmail from '@/components/emails/ActionReminderEmail';

// Initialize Resend with API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Consultorio Delgado <onboarding@resend.dev>';

type EmailData = {
    to: string;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    appointmentId?: string; // Optional for confirmation
};

type ActionReminderData = EmailData & {
    confirmUrl: string;
};

export const emailService = {
    async sendConfirmation(data: EmailData) {
        try {
            const html = await render(ConfirmationEmail({
                patientName: data.patientName,
                doctorName: data.doctorName,
                date: data.date,
                time: data.time,
                appointmentId: data.appointmentId || ''
            }));

            await resend.emails.send({
                from: FROM_EMAIL,
                to: data.to,
                subject: 'Confirmación de Turno - Consultorio Delgado (NO RESPONDER MAIL)',
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('[EmailService] Confirmation Error:', error);
            return { success: false, error };
        }
    },

    async sendCancellation(data: EmailData) {
        try {
            const html = await render(CancellationEmail({
                patientName: data.patientName,
                doctorName: data.doctorName,
                date: data.date,
                time: data.time
            }));

            await resend.emails.send({
                from: FROM_EMAIL,
                to: data.to,
                subject: 'Turno Cancelado - Consultorio Delgado (NO RESPONDER MAIL)',
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('[EmailService] Cancellation Error:', error);
            return { success: false, error };
        }
    },

    async sendReminder(data: EmailData) {
        try {
            const html = await render(ReminderEmail({
                patientName: data.patientName,
                doctorName: data.doctorName,
                date: data.date,
                time: data.time
            }));

            await resend.emails.send({
                from: FROM_EMAIL,
                to: data.to,
                subject: 'Recordatorio de Turno - Mañana (NO RESPONDER MAIL)',
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('[EmailService] Reminder Error:', error);
            return { success: false, error };
        }
    },

    async sendActionReminder(data: ActionReminderData) {
        try {
            const html = await render(ActionReminderEmail({
                patientName: data.patientName,
                doctorName: data.doctorName,
                date: data.date,
                time: data.time,
                confirmUrl: data.confirmUrl
            }));

            await resend.emails.send({
                from: FROM_EMAIL,
                to: data.to,
                subject: `⚠️ Acción Requerida: Confirma tu turno para el ${data.date} (NO RESPONDER MAIL)`,
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('[EmailService] ActionReminder Error:', error);
            return { success: false, error };
        }
    },

    // Contact form email to reception
    async sendContactForm(data: { name: string; email: string; phone: string; message: string }) {
        try {
            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nuevo Mensaje de Contacto</h1>
    </div>
    
    <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px; background: white; border: 1px solid #e2e8f0; font-weight: bold; width: 120px;">Nombre:</td>
                <td style="padding: 12px; background: white; border: 1px solid #e2e8f0;">${data.name}</td>
            </tr>
            <tr>
                <td style="padding: 12px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">Email:</td>
                <td style="padding: 12px; background: white; border: 1px solid #e2e8f0;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
            </tr>
            <tr>
                <td style="padding: 12px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">Teléfono:</td>
                <td style="padding: 12px; background: white; border: 1px solid #e2e8f0;">${data.phone}</td>
            </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin: 0 0 12px 0; color: #1e293b;">Mensaje:</h3>
            <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
            Este mensaje fue enviado desde el formulario de contacto del sitio web.
        </p>
    </div>
</body>
</html>`;

            await resend.emails.send({
                from: FROM_EMAIL,
                to: 'turnosconsultoriodelgado@gmail.com',
                replyTo: data.email,
                subject: `Nuevo mensaje de contacto: ${data.name}`,
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('[EmailService] ContactForm Error:', error);
            return { success: false, error };
        }
    },

    async sendPrescriptionRequest(data: {
        doctorName: string;
        nombre: string;
        apellido: string;
        dni: string;
        telefono: string;
        email: string;
        cobertura: string;
        numeroAfiliado: string;
        plan: string;
        token?: string;
        medicamentos: string;
    }, doctorEmail: string) {
        try {
            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📋 Solicitud de Receta Médica</h1>
    </div>
    
    <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">Datos del Paciente</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold; width: 140px;">Nombre:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;">${data.nombre} ${data.apellido}</td>
            </tr>
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">DNI:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;">${data.dni}</td>
            </tr>
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">Teléfono:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;">${data.telefono}</td>
            </tr>
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">Email:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;"><a href="mailto:${data.email}" style="color: #059669;">${data.email}</a></td>
            </tr>
        </table>

        <h2 style="color: #1e293b;">Cobertura Médica</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold; width: 140px;">Cobertura:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;">${data.cobertura}</td>
            </tr>
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">N° Afiliado:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;">${data.numeroAfiliado}</td>
            </tr>
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">Plan:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;">${data.plan}</td>
            </tr>
            ${data.token ? `
            <tr>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0; font-weight: bold;">Token:</td>
                <td style="padding: 10px; background: white; border: 1px solid #e2e8f0;">${data.token}</td>
            </tr>
            ` : ''}
        </table>

        <h2 style="color: #1e293b;">Medicamentos Solicitados</h2>
        <div style="padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${data.medicamentos}</p>
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
            Este mensaje fue enviado desde el sistema de recetas del sitio web.
        </p>
    </div>
</body>
</html>`;

            await resend.emails.send({
                from: FROM_EMAIL,
                to: doctorEmail,
                replyTo: data.email,
                subject: `Solicitud de Receta - ${data.nombre} ${data.apellido}`,
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('[EmailService] Prescription Error:', error);
            return { success: false, error };
        }
    }
};
