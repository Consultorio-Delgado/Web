---
name: transactional-emails-resend
description: "Manages email notifications using Resend and React Email templates. Use this skill when creating, modifying, or debugging email functionality."
---

# Transactional Emails with Resend

## When to Use

- Creating new email templates
- Adding new email types (confirmation, cancellation, reminder, etc.)
- Modifying the email service or API route
- Debugging email delivery issues
- Working with Cron-based reminders

## Instructions

### Architecture Overview

```
src/
├── lib/email.ts                        # Email service (Resend abstraction)
├── app/api/emails/route.ts             # API route (POST handler, type dispatcher)
├── app/api/cron/daily-reminders/route.ts  # Cron for reminder emails
└── components/emails/                  # React Email templates
    ├── EmailLayout.tsx                 # Shared layout wrapper
    ├── ConfirmationEmail.tsx           # Standard booking confirmation
    ├── SobreturnoConfirmationEmail.tsx # Manual patient confirmation + registration invite
    ├── CancellationEmail.tsx           # Cancellation notice
    ├── ReminderEmail.tsx              # Appointment reminder
    ├── ActionReminderEmail.tsx        # Reminder with confirm action button
    └── AbsenceEmail.tsx              # Absence notification
```

### Email Flow

```mermaid
graph LR
    A[Client Component] -->|fetch POST| B[/api/emails]
    B -->|type switch| C[emailService.*]
    C -->|render template| D[React Email Component]
    C -->|send via| E[Resend API]
    F[Cron Job] -->|direct call| C
```

### Creating a New Email Template

1. **Create template** in `src/components/emails/NewEmail.tsx`:
   - Import and use `EmailLayout` as the wrapper
   - Use `@react-email/components` for `Section`, `Text`, `Button`, etc.
   - Use `getDoctorPrefix()` from `@/lib/doctorPrefix` for doctor name formatting
   - Export both named and default export

2. **Add service method** in `src/lib/email.ts`:
   - Import the new template component
   - Add an `async sendNewEmail(data: EmailData)` method
   - Use `render()` from `@react-email/render` to convert to HTML
   - Send via `resend.emails.send()` with `FROM_EMAIL`
   - Always return `{ success: true }` or `{ success: false, error }`

3. **Add API route case** in `src/app/api/emails/route.ts`:
   - Add a new `case 'new_type':` in the switch statement
   - Call `emailService.sendNewEmail(data)`

4. **Trigger from client**:
   ```typescript
   fetch('/api/emails', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ type: 'new_type', data: { to, patientName, ... } })
   }).catch(err => console.error("Failed to send email:", err));
   ```

### Email Data Type

```typescript
type EmailData = {
    to: string;           // Recipient email
    patientName: string;  // Patient display name
    doctorName: string;   // Doctor display name
    date: string;         // Formatted date string
    time: string;         // Time in HH:MM format
    appointmentId?: string;
    specialty?: string;   // "Ginecología", "Clínica Médica", etc.
};
```

### Security Rules

1. **Never** expose `RESEND_API_KEY` to the client — it's server-only in `lib/email.ts`
2. **Always** use `FROM_EMAIL` from env var `EMAIL_FROM` (fallback: `onboarding@resend.dev`)
3. **Always** add `(NO RESPONDER MAIL)` to subject lines
4. Email sends should be **fire-and-forget** (`.catch()` only) — don't block the UI

### Cron Reminders

- Runs at 17:00 ART (20:00 UTC) via Vercel Cron
- Sends reminders for appointments **2 days ahead** (pasado mañana)
- Filters: `patientId !== 'blocked'`, status is `confirmed`/`pending`, `patientEmail` is truthy
- Uses **Admin SDK** (server-side) — never Client SDK
- Protected by `CRON_SECRET` bearer token

### Manual Patients (Sobreturnos)

- Manual patients have `patientId` starting with `manual_`
- Standard confirmation email is **skipped** for manual patients in `createAppointment`
- Instead, `SobreturnoDialog` sends a `sobreturno_confirmation` email with registration invite
- Reminder emails work normally if `patientEmail` is populated
