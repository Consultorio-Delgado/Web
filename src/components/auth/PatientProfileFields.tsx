"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INSURANCE_PROVIDERS } from "@/constants";
import { PatientProfileFormData } from "@/lib/patientProfileForm";

interface PatientProfileFieldsProps {
    formData: PatientProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectChange: (value: string, id: keyof PatientProfileFormData) => void;
    disabled?: boolean;
}

export function PatientProfileFields({
    formData,
    onChange,
    onSelectChange,
    disabled = false,
}: PatientProfileFieldsProps) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">
                        Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={onChange}
                        disabled={disabled}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">
                        Apellido <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={onChange}
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dni">
                    DNI <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="dni"
                    type="number"
                    required
                    value={formData.dni}
                    onChange={onChange}
                    disabled={disabled}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">
                    Celular <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="Ej: 1123456789"
                    value={formData.phone}
                    onChange={onChange}
                    disabled={disabled}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="birthDate">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="birthDate"
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={onChange}
                    disabled={disabled}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="insuranceProvider">
                    Obra Social / Prepaga <span className="text-red-500">*</span>
                </Label>
                <Select
                    onValueChange={(val) => onSelectChange(val, "insuranceProvider")}
                    value={formData.insuranceProvider}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {INSURANCE_PROVIDERS.map((ins) => (
                            <SelectItem key={ins} value={ins}>
                                {ins}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {formData.insuranceProvider && formData.insuranceProvider !== "PARTICULAR" && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="insuranceNumber">
                            Número de Credencial / Afiliado <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="insuranceNumber"
                            required
                            value={formData.insuranceNumber}
                            onChange={onChange}
                            disabled={disabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="plan">
                            Plan <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                        </Label>
                        <Input
                            id="plan"
                            placeholder="Ej: 310, 510, A1"
                            value={formData.plan}
                            onChange={onChange}
                            disabled={disabled}
                        />
                    </div>
                </>
            )}
        </>
    );
}
