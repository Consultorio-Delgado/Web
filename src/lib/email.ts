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
                subject: 'Confirmación de Turno - Consultorio Delgado',
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
                subject: 'Turno Cancelado - Consultorio Delgado',
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
                subject: 'Recordatorio de Turno - Mañana',
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
                subject: `⚠️ Acción Requerida: Confirma tu turno para el ${data.date}`,
                html: html
            });
            return { success: true };
        } catch (error) {
            console.error('[EmailService] ActionReminder Error:', error);
            return { success: false, error };
        }
    }
};
