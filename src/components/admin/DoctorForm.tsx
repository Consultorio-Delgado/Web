import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

// Schema for creation only - essentials
const createSchema = () => {
    return z.object({
        firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
        lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Mínimo 6 caracteres"),
        // Hidden fields with defaults - included in schema to satisfy TS but not validated in UI
        specialty: z.string().optional(),
        slotDuration: z.string().optional(),
        startHour: z.string().optional(),
        endHour: z.string().optional(),
        workDays: z.array(z.number()).optional(),
        acceptedInsurances: z.array(z.string()).optional(),
    });
};

interface Props {
    onSubmit: (values: any) => Promise<void>;
    loading?: boolean;
}

export function DoctorForm({ onSubmit, loading }: Props) {
    const schema = createSchema();

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            // Default values for hidden fields
            specialty: "Médico Clínico",
            slotDuration: "30",
            startHour: "09:00",
            endHour: "17:00",
            workDays: [1, 2, 3, 4, 5], // Mon-Fri
            acceptedInsurances: [],
        },
    });

    async function handleSubmit(values: any) {
        // Prepare data for submission with enforced defaults (double check)
        const doctorData = {
            ...values,
            slotDuration: parseInt(values.slotDuration || "30"),
            schedule: {
                startHour: values.startHour || "09:00",
                endHour: values.endHour || "17:00",
                workDays: values.workDays || [1, 2, 3, 4, 5],
            },
            color: "blue",
        };
        await onSubmit(doctorData);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email (Acceso)</FormLabel>
                                <FormControl>
                                    <Input placeholder="doctor@clinica.com" autoComplete="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                    <PasswordInput placeholder="******" autoComplete="new-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <Input placeholder="Juan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Apellido</FormLabel>
                                <FormControl>
                                    <Input placeholder="Pérez" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm text-slate-500">
                    <p>
                        <strong>Nota:</strong> La especialidad, horarios y obras sociales se crearán con valores predeterminados.
                        El doctor podrá configurarlos luego desde su perfil.
                    </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creando..." : "Crear Doctor"}
                </Button>
            </form>
        </Form>
    );
}
