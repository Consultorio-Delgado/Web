"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Video, Send, CheckCircle, AlertTriangle, Paperclip, XCircle, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { doctorService } from "@/services/doctorService";
import type { Doctor } from "@/types";
import Link from "next/link";

const DOCTOR_PHOTOS: Record<string, string> = {
    'capparelli': '/images/doc_male.png',
    'secondi': '/images/doc_female.png',
};

interface VirtualConsultationFormData {
    doctorId: string;
    nombre: string;
    apellido: string;
    dni: string;
    fechaNacimiento: string;
    telefono: string;
    email: string;

    consulta: string;
}

export default function VirtualConsultationPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState<VirtualConsultationFormData>({
        doctorId: "",
        nombre: profile?.firstName || "",
        apellido: profile?.lastName || "",
        dni: profile?.dni || "",
        fechaNacimiento: profile?.birthDate || "",
        telefono: profile?.phone || "",
        email: user?.email || "",

        consulta: "",
    });

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
                fechaNacimiento: profile.birthDate || prev.fechaNacimiento,
            }));
        }
    }, [profile, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const totalFiles = files.length + newFiles.length;

            if (totalFiles > 3) {
                toast.error("Máximo 3 archivos permitidos");
                return;
            }

            const oversized = newFiles.find(f => f.size > 8 * 1024 * 1024); // 8MB limit requirement
            if (oversized) {
                toast.error(`El archivo ${oversized.name} es muy pesado (máx 8MB)`);
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
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.doctorId) {
            toast.error("Por favor seleccione un profesional");
            return;
        }

        const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
        const isCapparelli = selectedDoctor?.lastName?.toLowerCase().includes('capparelli');

        if (isCapparelli) {
            toast.error("El Dr. Capparelli no está recibiendo consultas virtuales por el momento.");
            return;
        }

        setLoading(true);

        try {
            const attachments = await Promise.all(files.map(async (file) => ({
                filename: file.name,
                content: await convertToBase64(file)
            })));

            const response = await fetch("/api/virtual-consultation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    doctorName: selectedDoctor ? (
                        selectedDoctor.id === 'secondi' ? 'Dra. María Verónica Secondi' :
                            isCapparelli ? 'Dr. Germán Capparelli' :
                                `${selectedDoctor.gender === 'female' ? 'Dra.' : 'Dr.'} ${selectedDoctor.lastName}`
                    ) : "",
                    attachments
                }),
            });

            if (!response.ok) {
                throw new Error("Error al enviar la solicitud");
            }

            setSuccess(true);
            setFiles([]);
            setFormData(prev => ({
                ...prev,
                doctorId: "",

                consulta: ""
            }));
            toast.success("¡Solicitud enviada correctamente!");
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
                        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Consulta Enviada!</h2>
                        <p className="text-slate-600 mb-2">Tu consulta virtual ha sido enviada a la Dra. Secondi.</p>
                        <p className="text-sm text-slate-500 mb-6">
                            Te responderemos a la brevedad al correo electrónico o teléfono proporcionado.
                        </p>
                        <div className="flex flex-col gap-3 justify-center items-center">
                            <Link href="/portal">
                                <Button variant="outline">Volver al Inicio</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const selectedDoctorForRender = doctors.find(d => d.id === formData.doctorId);
    const isCapparelliSelected = selectedDoctorForRender?.lastName?.toLowerCase().includes('capparelli');

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Video className="h-6 w-6" />
                        Consulta Virtual Particular
                    </CardTitle>
                    <CardDescription>
                        Servicio exclusivo de consulta online. Seleccione el profesional para continuar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        {/* Doctor Selection */}
                        <div className="space-y-2">
                            <Label>Seleccione Profesional *</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {doctors.map((doc) => {
                                    const isSelected = formData.doctorId === doc.id;
                                    const isDocCapparelli = doc.lastName.toLowerCase().includes('capparelli');

                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => handleSelectChange("doctorId", doc.id)}
                                            className={`
                                                cursor-pointer rounded-xl border p-4 transition-all select-none flex items-center gap-4
                                                ${isSelected
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-offset-2 ring-slate-900"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                }
                                            `}
                                        >
                                            <div className={`h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border-2 ${isSelected ? 'border-slate-700' : 'border-slate-100'}`}>
                                                {doc.photoURL || DOCTOR_PHOTOS[doc.id] || (isDocCapparelli ? DOCTOR_PHOTOS['capparelli'] : null) || (doc.lastName.toLowerCase().includes('secondi') ? DOCTOR_PHOTOS['secondi'] : null) ? (
                                                    <img
                                                        src={doc.photoURL || DOCTOR_PHOTOS[doc.id] || (isDocCapparelli ? DOCTOR_PHOTOS['capparelli'] : null) || (doc.lastName.toLowerCase().includes('secondi') ? DOCTOR_PHOTOS['secondi'] : null) || ""}
                                                        alt={`${doc.firstName} ${doc.lastName}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-slate-400">
                                                            {doc.firstName.charAt(0)}{doc.lastName.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                    {doc.id === 'secondi' ? 'Dra. María Verónica Secondi' :
                                                        isDocCapparelli ? 'Dr. Germán Capparelli' :
                                                            `${doc.gender === 'female' ? 'Dra.' : 'Dr.'} ${doc.lastName}`}
                                                </span>
                                                <span className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    {doc.specialty}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t pt-4" />

                        {isCapparelliSelected && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-red-900 mb-4">Consulta Dr. Capparelli</h3>
                                    <p className="text-red-800 font-medium text-lg leading-relaxed mb-6">
                                        Estimado paciente, por la gran cantidad de consultas recibidas, por el momento no se recibirán nuevas hasta poder dar curso a las ya recibidas.
                                    </p>
                                    <div className="bg-white/50 rounded-lg p-4 text-left flex items-start gap-3">
                                        <div className="text-2xl font-bold text-red-600">!</div>
                                        <p className="text-red-900 text-sm font-medium">
                                            Si solicita la consulta virtual esté atento al teléfono que deja de contacto. Tenga en cuenta que la llamada puede ser de un número Privado.
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-red-700 pt-2">Sepa disculpar las molestias.</p>
                            </div>
                        )}

                        {formData.doctorId && !isCapparelliSelected && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Payment Link Banner */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Video className="h-24 w-24 text-blue-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-blue-900 font-semibold flex items-center gap-2 mb-2">
                                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Paso 1</span>
                                            Abonar Consulta
                                        </h3>
                                        <p className="text-sm text-blue-800 mb-4">
                                            Para realizar la consulta virtual, primero debe abonar el servicio a través de MercadoPago.
                                        </p>
                                        <a
                                            href="https://mpago.la/2aLzw8s"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-[#009EE3] hover:bg-[#008ED0] text-white font-bold rounded-lg transition-colors shadow-sm hover:shadow"
                                        >
                                            Pagar Consulta con MercadoPago
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Paso 2</span>
                                        <h3 className="text-blue-900 font-semibold">Completar Datos</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre *</Label>
                                        <Input id="nombre" value={formData.nombre} onChange={handleChange} required disabled={loading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apellido">Apellido *</Label>
                                        <Input id="apellido" value={formData.apellido} onChange={handleChange} required disabled={loading} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dni">DNI *</Label>
                                        <Input id="dni" value={formData.dni} onChange={handleChange} required disabled={loading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fechaNacimiento">Fecha Nacimiento (dd/mm/aaaa) *</Label>
                                        <Input id="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} required disabled={loading} />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="telefono">Teléfono *</Label>
                                    <Input id="telefono" type="tel" value={formData.telefono} onChange={handleChange} required disabled={loading} />
                                </div>

                                <div>
                                    <Label htmlFor="email">Correo electrónico *</Label>
                                    <Input id="email" type="email" value={formData.email} onChange={handleChange} required disabled={loading} />
                                </div>



                                <div>
                                    <Label htmlFor="consulta">Consulta *</Label>
                                    <Textarea
                                        id="consulta"
                                        value={formData.consulta}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        placeholder="Describa brevemente el motivo de su consulta..."
                                        disabled={loading}
                                    />
                                </div>

                                {/* File Attachments */}
                                <div className="space-y-2">
                                    <Label>Si desea adjuntar estudios (Máx 3, 8MB máx)</Label>
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
                                                    {files.length >= 3 ? "Límite de archivos alcanzado" : "Seleccionar archivos"}
                                                </span>
                                                <span className="text-xs text-slate-400">JPG, PNG, PDF</span>
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

                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-800">
                                            En 24hs hábiles se contactarán vía WhatsApp para confirmar y coordinar la consulta.
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800">
                                            <strong>Importante:</strong> Si solicita la consulta virtual esté atento al teléfono que deja de contacto. Tenga en cuenta que la llamada puede ser de un número Privado.
                                        </p>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 border border-red-100">
                                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-800 font-medium">
                                            Recordar que esta consulta virtual es un servicio de pago independientemente si usted es particular o tiene prepaga. Gracias.
                                        </p>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Enviar Consulta
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
