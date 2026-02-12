"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsService, ClinicSettings } from "@/services/settingsService";
import { FileUpload } from "@/components/shared/FileUpload";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Megaphone, Loader2, Save } from "lucide-react";
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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-primary" />
                                    Anuncio Global (Popup)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Muestra un mensaje importante a todos los pacientes al entrar.
                                </p>
                            </div>
                            <Switch
                                checked={settings.announcementEnabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, announcementEnabled: checked })}
                            />
                        </div>

                        {settings.announcementEnabled && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label>Texto del Anuncio</Label>
                                <Textarea
                                    placeholder="Ej: El consultorio permanecerá cerrado por vacaciones hasta el 20 de Febrero."
                                    value={settings.announcementText || ''}
                                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Se mostrará en un popup con fondo oscuro al ingresar a la página.
                                </p>
                            </div>
                        )}
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
