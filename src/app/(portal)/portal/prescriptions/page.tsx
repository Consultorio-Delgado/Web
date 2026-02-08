"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, FileText, Send, CheckCircle, AlertTriangle, Paperclip, XCircle } from "lucide-react";
import { toast } from "sonner";
import { doctorService } from "@/services/doctorService";
import type { Doctor } from "@/types";

const COBERTURAS = [
    "OSDE",
    "Swiss Medical",
    "Omint",
    "Luis Pasteur",
    "Galeno",
    "Otra"
];

interface PrescriptionFormData {
    doctorId: string;
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
    email: string;
    cobertura: string;
    numeroAfiliado: string;
    plan: string;
    token: string;
    medicamentos: string;
}

export default function PrescriptionsPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState<PrescriptionFormData>({
        doctorId: "",
        nombre: profile?.firstName || "",
        apellido: profile?.lastName || "",
        dni: "",
        telefono: profile?.phone || "",
        email: user?.email || "",
        cobertura: "",
        numeroAfiliado: "",
        plan: "",
        token: "",
        medicamentos: "",
    });

    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const totalFiles = files.length + newFiles.length;

            if (totalFiles > 3) {
                toast.error("Máximo 3 archivos permitidos");
                return;
            }

            // Validate size (e.g. 4MB limit per file purely for email constraints)
            const oversized = newFiles.find(f => f.size > 4 * 1024 * 1024);
            if (oversized) {
                toast.error(`El archivo ${oversized.name} es muy pesado (máx 4MB)`);
                return;
            }

            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g. "data:image/png;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    useEffect(() => {
        const loadDoctors = async () => {
            const allDoctors = await doctorService.getAllDoctors();
            setDoctors(allDoctors);
        };
        loadDoctors();
    }, []);

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                nombre: profile.firstName || prev.nombre,
                apellido: profile.lastName || prev.apellido,
                telefono: profile.phone || prev.telefono,
                dni: profile.dni || prev.dni,
                email: user?.email || prev.email,
                cobertura: profile.insurance || prev.cobertura,
                numeroAfiliado: profile.insuranceNumber || prev.numeroAfiliado,
            }));
        }
    }, [profile, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.doctorId) {
            toast.error("Por favor seleccione un profesional");
            return;
        }

        setLoading(true);

        try {
            const selectedDoctor = doctors.find(d => d.id === formData.doctorId);

            // Process attachments
            const attachments = await Promise.all(files.map(async (file) => ({
                filename: file.name,
                content: await convertToBase64(file)
            })));

            const response = await fetch("/api/prescriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    doctorName: selectedDoctor ? `${selectedDoctor.gender === 'female' ? 'Dra.' : 'Dr.'} ${selectedDoctor.lastName}` : "",
                    attachments
                }),
            });

            if (!response.ok) {
                throw new Error("Error al enviar la solicitud");
            }

            setSuccess(true);
            setFiles([]); // Reset files
            toast.success("¡Solicitud enviada! La receta llegará dentro de los 5 días hábiles.");
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar la solicitud. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud Enviada!</h2>
                        <p className="text-slate-600 mb-2">Tu pedido de receta fue enviado correctamente.</p>
                        <p className="text-sm text-slate-500 mb-6">
                            La receta llegará dentro de los <strong>5 días hábiles</strong>.
                        </p>
                        <Button onClick={() => setSuccess(false)}>
                            Solicitar Otra Receta
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Solicitar Receta Médica
                    </CardTitle>
                    <CardDescription>
                        Complete el formulario para solicitar una receta médica a su profesional.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Doctor Selection */}
                        <div className="space-y-2">
                            <Label>Seleccione Profesional *</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {doctors.map((doc) => {
                                    const isSelected = formData.doctorId === doc.id;
                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => handleSelectChange("doctorId", doc.id)}
                                            className={`
                                                cursor-pointer rounded-full border py-3 px-4 text-center transition-all font-medium select-none
                                                ${isSelected
                                                    ? "bg-slate-200 border-slate-300 text-slate-900 shadow-inner"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-slate-50"
                                                }
                                            `}
                                        >
                                            {doc.gender === 'female' ? 'Dra.' : 'Dr.'} {doc.firstName} {doc.lastName}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Conditional Form Content */}
                        {formData.doctorId && (
                            <>
                                {formData.doctorId === 'capparelli' ? (
                                    <div className="space-y-4">
                                        <div className="bg-white border-l-4 border-red-500 p-4 shadow-sm">
                                            <h3 className="text-lg font-bold text-red-600 mb-2">
                                                CON LA NUEVA DISPOSICION DE RECETAS DIGITALES DEL MINISTERIO DE SALUD EN EL 2023 LAS RECETAS SERÁN TODAS CON CODIGO DE BARRA INCLUSIVE LAS DE PSICOFARMACO
                                            </h3>
                                        </div>

                                        <div className="text-sm text-slate-700 space-y-3">
                                            <p>
                                                Tiene <strong>SWISSMEDICAL, LUIS PASTEUR, GALENO u OMINT</strong>, como la receta se genera automáticamente por una red ajena a nosotros, a veces tiene errores, verifique que su receta debajo del código de barras comience con el número <strong>9207</strong> y al pie de la receta salga la palabra <strong>FARMALINK</strong> y un número, sino es así avísenos para poder rehacerla.
                                            </p>
                                            <p>
                                                Complete todo el formulario para solicitar una receta cumpliendo los requerimientos de cada cobertura, <strong className="text-green-600">RECUERDE SI TIENE OMINT O SWISSMEDICAL COLOCAR EL TOKEN. PARA GALENO Y OSDE SE SOLICITARÁ POR WHATSAPP.</strong>
                                            </p>
                                            <p>
                                                Luego de completar el formulario recibirá por mail las mismas en el transcurso de la semana.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-amber-800">
                                                <p className="font-semibold">MUY IMPORTANTE:</p>
                                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                                    <li>La receta llegará dentro de los <strong>5 días hábiles</strong>.</li>
                                                    <li>Solo se realizan recetas de medicación indicada por el profesional.</li>
                                                    <li>La prescripción está reservada a pacientes con historia clínica y controles actualizados.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4" />

                                {/* Personal Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre *</Label>
                                        <Input
                                            id="nombre"
                                            required
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apellido">Apellido *</Label>
                                        <Input
                                            id="apellido"
                                            required
                                            value={formData.apellido}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dni">DNI *</Label>
                                        <Input
                                            id="dni"
                                            required
                                            value={formData.dni}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telefono">Teléfono *</Label>
                                        <Input
                                            id="telefono"
                                            type="tel"
                                            required
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="border-t pt-4" />

                                {/* Insurance Info */}
                                <div className="space-y-2">
                                    <Label>Cobertura Social *</Label>
                                    <Select onValueChange={(v) => handleSelectChange("cobertura", v)} value={formData.cobertura}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione su cobertura" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COBERTURAS.map((cob) => (
                                                <SelectItem key={cob} value={cob}>{cob}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500">
                                        Si no se encuentra en el listado seleccione "Otra" y especifíquela abajo junto al pedido de la medicación.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="numeroAfiliado">Número de Afiliado *</Label>
                                        <Input
                                            id="numeroAfiliado"
                                            required
                                            placeholder="Sin espacios entre los números"
                                            value={formData.numeroAfiliado}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="plan">Plan *</Label>
                                        <Input
                                            id="plan"
                                            required
                                            value={formData.plan}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="token">Token (OMINT y SWISS)</Label>
                                    <Input
                                        id="token"
                                        placeholder="Si tiene credencial digital"
                                        value={formData.token}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Para OSDE y Galeno se solicitará por WhatsApp.
                                    </p>
                                </div>

                                <div className="border-t pt-4" />

                                {/* Medications */}
                                <div className="space-y-2">
                                    <Label htmlFor="medicamentos">Medicamentos que necesita *</Label>
                                    <Textarea
                                        id="medicamentos"
                                        required
                                        rows={4}
                                        placeholder="Coloque qué medicamentos y dosis necesita para poder confeccionar correctamente la receta."
                                        value={formData.medicamentos}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>

                                {/* File Attachments */}
                                <div className="space-y-2">
                                    <Label>Adjuntar Archivos (Máx 3, imágenes o PDF)</Label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            id="file-upload"
                                            onChange={handleFileChange}
                                            disabled={loading || files.length >= 3}
                                        />
                                        <Label htmlFor="file-upload" className="cursor-pointer block h-full w-full">
                                            <div className="flex flex-col items-center gap-2">
                                                <Paperclip className="h-8 w-8 text-slate-400" />
                                                <span className="text-sm text-slate-600 font-medium">
                                                    {files.length >= 3 ? "Límite de archivos alcanzado" : "Hacé click para subir archivos"}
                                                </span>
                                                <span className="text-xs text-slate-400">JPG, PNG, PDF (Máx 4MB)</span>
                                            </div>
                                        </Label>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {files.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border text-sm">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <FileText className="h-4 w-4 text-slate-500" />
                                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(idx)}
                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Payment Info */}
                                <div className="bg-slate-50 border rounded-lg p-4 text-sm text-slate-600">
                                    {formData.doctorId === 'capparelli' ? (
                                        <>
                                            <p className="font-bold text-slate-800 mb-2 uppercase">
                                                Recuerde que si tiene coseguro o diferencial realizar la transferencia al Alias: DR.CAPPARELLI
                                            </p>
                                            <p className="mb-4">CBU: <strong>0150509201000115863100</strong></p>

                                            <div className="flex items-start gap-2 mt-4 pt-4 border-t border-slate-200">
                                                <div className="h-5 w-5 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs">!</div>
                                                <p className="text-slate-500 text-xs">
                                                    Recuerde revisar la bandeja de SPAM ya que la misma puede entrar a dicha casilla, la receta puede ir desde el remitente DrApp , RCTA TU RECETA DIGITAL o SWISSMEDICAL.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-medium text-slate-800 mb-2">Si tiene coseguro o diferencial:</p>
                                            <p className="mb-1">Realizar la transferencia al Alias: <strong>SECONDI.CONSULTORIO</strong></p>
                                            <p>CBU: <strong>0150509201000119792673</strong></p>
                                        </>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Enviar Solicitud
                                        </>
                                    )}
                                </Button>
                            </>
                        )}

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
