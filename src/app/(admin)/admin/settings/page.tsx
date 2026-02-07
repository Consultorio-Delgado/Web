"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsService, ClinicSettings } from "@/services/settingsService";
import { FileUpload } from "@/components/shared/FileUpload";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        settingsService.getSettings().then(data => {
            setSettings(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await settingsService.updateSettings(settings);
            toast.success("Configuración actualizada correctamente");
            // Optional: Reload page or context to reflect changes in Navbar immediately
        } catch (error) {
            toast.error("Error al guardar");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!settings) return <div>Error loading settings</div>;

    return (
        <div className="container max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-8">Administración de Clínica</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración General</CardTitle>
                    <CardDescription>
                        Información pública visible en el portal de pacientes y correos electrónicos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Nombre de la Clínica</Label>
                        <Input
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Teléfono de Contacto</Label>
                        <Input
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Dirección</Label>
                        <Input
                            value={settings.address || ''}
                            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Logo de la Clínica</Label>
                        <div className="flex items-center gap-4 mb-4">
                            {settings.logoUrl && (
                                <div className="relative h-20 w-20 border rounded-md overflow-hidden">
                                    <Image src={settings.logoUrl} alt="Logo" fill className="object-contain" />
                                </div>
                            )}
                        </div>
                        <FileUpload
                            pathPrefix="branding"
                            onUploadComplete={(url) => setSettings({ ...settings, logoUrl: url })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Recomendado: PNG o JPG con fondo transparente.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
