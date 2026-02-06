"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Doctor } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
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
import { useEffect } from "react";

const formSchema = z.object({
    firstName: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    lastName: z.string().min(2, {
        message: "El apellido debe tener al menos 2 caracteres.",
    }),
    specialty: z.string().min(1, {
        message: "Seleccione una especialidad.",
    }),
    slotDuration: z.string(), // We'll parse to number on submit
    startHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM inválido"),
    endHour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM inválido"),
});

interface Props {
    defaultValues?: Doctor;
    onSubmit: (values: any) => Promise<void>;
    loading?: boolean;
}

export function DoctorForm({ defaultValues, onSubmit, loading }: Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: defaultValues?.firstName || "",
            lastName: defaultValues?.lastName || "",
            specialty: defaultValues?.specialty || "",
            slotDuration: defaultValues?.slotDuration?.toString() || "30",
            startHour: defaultValues?.schedule?.startHour || "09:00",
            endHour: defaultValues?.schedule?.endHour || "17:00",
        },
    });

    async function handleSubmit(values: z.infer<typeof formSchema>) {
        // Transform flat form values to Doctor structure
        const doctorData = {
            firstName: values.firstName,
            lastName: values.lastName,
            specialty: values.specialty,
            slotDuration: parseInt(values.slotDuration),
            schedule: {
                startHour: values.startHour,
                endHour: values.endHour,
                workDays: [1, 2, 3, 4, 5], // Hardcoded MVP
            },
            color: "blue", // Default
        };
        await onSubmit(doctorData);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Doctor"}
                </Button>
            </form>
        </Form>
    );
}
