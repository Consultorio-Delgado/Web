export type Role = 'admin' | 'doctor' | 'patient';

export interface UserProfile {
    uid: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
    dni?: string;
    phone?: string;
    insurance?: string; // Obra Social
    createdAt: Date;
}

export interface Doctor {
    id: string; // 'secondi' | 'capparelli' (allows expansion)
    firstName: string;
    lastName: string;
    specialty: string;
    bio?: string;
    imageUrl?: string;
    schedule: {
        startHour: string; // "09:00"
        endHour: string;   // "17:00"
        workDays: number[]; // [1, 2, 3, 4, 5] (Monday to Friday)
    };
    slotDuration: number; // Minutes per appointment (e.g. 20, 30, 60)
    color: string; // For calendar UI
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string; // Denormalized for faster read
    patientEmail: string;
    doctorId: string;
    date: Date; // Firestore Timestamp converted to Date
    time: string; // "10:00"
    status: AppointmentStatus;
    notes?: string; // Private notes from the doctor? Or patient reason?
    medicalNotes?: string; // Evolution/Diagnosis from Doctor
    createdAt: Date;
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
