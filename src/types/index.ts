export type Role = 'admin' | 'doctor' | 'patient';

export interface UserProfile {
    uid: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
    dni?: string;
    birthDate?: string; // YYYY-MM-DD
    phone?: string;
    insurance?: string; // Obra Social
    insuranceNumber?: string; // Numero de afiliado
    permissions?: string[]; // E.g., ['admin'] to grant admin access regardless of role
    createdAt: Date;
}

export interface Doctor {
    id: string; // 'secondi' | 'capparelli' (allows expansion)
    email?: string; // Contact/Auth email
    firstName: string;
    lastName: string;
    specialty: string;
    bio?: string;
    gender?: 'male' | 'female'; // For Dr./Dra. title
    imageUrl?: string;
    schedule: {
        startHour: string; // "09:00"
        endHour: string;   // "17:00"
        workDays: number[]; // [1, 2, 3, 4, 5] (Monday to Friday)
    };
    slotDuration: number; // Minutes per appointment (e.g. 20, 30, 60)
    color: string; // For calendar UI
    acceptedInsurances?: string[]; // Array of strings from INSURANCE_PROVIDERS
    maxDaysAhead?: number; // Maximum days in future for booking
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'arrived' | 'absent';

export interface DayOff {
    id: string;
    date: string; // "YYYY-MM-DD"
    doctorId?: string; // If null, applies to all (global holiday)
    reason?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string; // Denormalized for faster read
    patientEmail: string;
    doctorId: string;
    doctorName?: string; // Denormalized for emails and lists
    date: Date; // Firestore Timestamp converted to Date
    time: string; // "10:00"
    status: AppointmentStatus;
    notes?: string; // Private notes from the doctor? Or patient reason?
    medicalNotes?: string; // Evolution/Diagnosis from Doctor
    attachments?: { name: string; url: string; type: string; }[]; // PDF/JPG attachments
    type?: string; // "Consulta", "Control", etc.
    patientPhone?: string; // contact
    insurance?: string; // e.g. "OSDE"
    createdAt: Date;
    updatedAt?: Date;
}

export interface MedicalRecord {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentId: string;
    diagnosis: string;
    prescription?: string;
    privateNotes?: string;
    createdAt: Date;
}
