export interface PatientProfileFormData {
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    birthDate: string;
    insuranceProvider: string;
    insuranceNumber: string;
    plan: string;
}

export const emptyPatientProfileFormData = (): PatientProfileFormData => ({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    birthDate: "",
    insuranceProvider: "",
    insuranceNumber: "",
    plan: "",
});

export function validatePatientProfileForm(data: PatientProfileFormData): string | null {
    if (!data.insuranceProvider) {
        return "Seleccione una Obra Social.";
    }

    if (!data.phone || data.phone.length < 8) {
        return "Ingrese un número de celular válido.";
    }

    if (
        data.insuranceProvider !== "PARTICULAR" &&
        (!data.insuranceNumber || data.insuranceNumber.length < 1)
    ) {
        return "Ingrese el número de credencial / afiliado.";
    }

    return null;
}

export async function checkDniAvailable(dni: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const response = await fetch("/api/auth/check-dni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni }),
    });

    if (!response.ok) {
        return { ok: false, error: "Error al verificar el documento. Intente nuevamente." };
    }

    const { exists } = await response.json();

    if (exists) {
        return { ok: false, error: "Ya existe un usuario registrado con este documento de identidad." };
    }

    return { ok: true };
}
