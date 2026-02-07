"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Doctor } from "@/types";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Schema generator to handle dynamic requirements
const createSchema = (isEditing: boolean) => {
    return z.object({
        firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
        lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
        password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
        specialty: z.string().min(1, "Seleccione una especialidad."),
        slotDuration: z.string(),
        startHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM inválido"),
        endHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM inválido"),
    }).refine((data) => {
        if (!isEditing) {
            // Creation mode: Email and Password are required
            return !!data.email && !!data.password;
        }
        return true;
    }, {
        message: "Email y contraseña son obligatorios para nuevos médicos",
        path: ["password"] // Attach error to password field
    });
};

import { INSURANCE_PROVIDERS } from "@/constants";
import { Checkbox } from "@/components/ui/checkbox";

// ... existing imports

// ... existing createSchema

interface Props {
    defaultValues?: Doctor;
    onSubmit: (values: any) => Promise<void>;
    loading?: boolean;
}

export function DoctorForm({ defaultValues, onSubmit, loading }: Props) {
    const isEditing = !!defaultValues;
    const schema = createSchema(isEditing);

    const form = useForm<z.infer<typeof schema> & { acceptedInsurances: string[] }>({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: defaultValues?.firstName || "",
            lastName: defaultValues?.lastName || "",
            email: defaultValues?.email || "",
            password: "",
            specialty: defaultValues?.specialty || "",
            slotDuration: defaultValues?.slotDuration?.toString() || "30",
            startHour: defaultValues?.schedule?.startHour || "09:00",
            endHour: defaultValues?.schedule?.endHour || "17:00",
            acceptedInsurances: defaultValues?.acceptedInsurances || [],
        },
    });

    async function handleSubmit(values: any) {
        // Prepare data for submission
        const doctorData = {
            ...values,
            slotDuration: parseInt(values.slotDuration),
            schedule: {
                startHour: values.startHour,
                endHour: values.endHour,
                workDays: [1, 2, 3, 4, 5], // Default M-F
            },
            color: "blue",
        };
        await onSubmit(doctorData);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {!isEditing && (
                        <>
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
                                            <Input type="password" placeholder="******" autoComplete="new-password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}

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

                <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Especialidad</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Cardiología">Cardiología</SelectItem>
                                    <SelectItem value="Clínica Médica">Clínica Médica</SelectItem>
                                    <SelectItem value="Pediatría">Pediatría</SelectItem>
                                    <SelectItem value="Traumatología">Traumatología</SelectItem>
                                    <SelectItem value="Dermatología">Dermatología</SelectItem>
                                    <SelectItem value="Ginecología">Ginecología</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="slotDuration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duración Turno</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Minutos" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="15">15 min</SelectItem>
                                        <SelectItem value="20">20 min</SelectItem>
                                        <SelectItem value="30">30 min</SelectItem>
                                        <SelectItem value="40">40 min</SelectItem>
                                        <SelectItem value="60">60 min</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="startHour"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Inicio Jornada</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endHour"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fin Jornada</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="acceptedInsurances"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Obras Sociales Aceptadas</FormLabel>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {INSURANCE_PROVIDERS.map((item) => (
                                    <FormField
                                        key={item}
                                        control={form.control}
                                        name="acceptedInsurances"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={item}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), item])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== item
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {item}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Doctor"}
                </Button>
            </form>
        </Form>
    );
}
