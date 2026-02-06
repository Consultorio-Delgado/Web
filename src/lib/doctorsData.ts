
// Doctors Data for Seeding

// NOTE: This script is intended to be run manually or via a special route if configured.
// Since we don't have the service account key in the environment usually for client-side apps,
// this is a template.
// HOWEVER, for this environment, we can assume the user will likely want to use the 'api/seed' route approach
// if they have admin SDK set up, OR better yet, we can create a temporary CLIENT SIDE component to run this once.

// Let's create a Client Side seeder we can visit at /admin/seed-doctors temporarily.

export const doctorsData = [
    {
        id: "capparelli",
        firstName: "Germán",
        lastName: "Capparelli",
        specialty: "Clínica Médica",
        bio: "Especialista en Clínica Médica. Atención integral del paciente adulto.",
        color: "blue",
        slotDuration: 20,
        schedule: {
            startHour: "09:00",
            endHour: "18:00",
            workDays: [1, 2, 3, 4, 5]
        }
    },
    {
        id: "secondi",
        firstName: "María Verónica",
        lastName: "Secondi",
        specialty: "Ginecología",
        bio: "Especialista en Ginecología y Salud de la Mujer.",
        color: "pink",
        slotDuration: 30,
        schedule: {
            startHour: "10:00",
            endHour: "19:00",
            workDays: [1, 3, 5]
        }
    }
];
