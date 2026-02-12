"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { settingsService, ClinicSettings } from "@/services/settingsService";
import { usePathname } from "next/navigation";
import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnnouncementPopup() {
    const pathname = usePathname();
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await settingsService.getSettings();
            setSettings(data);

            if (data.announcementEnabled && data.announcementText) {
                // Determine if we are in public or portal area to show announcement again on transition
                const isPortal = pathname.startsWith('/portal') || pathname.startsWith('/doctor');
                const areaKey = isPortal ? 'portal' : 'public';

                const announcementKey = `dismissed_announcement_${areaKey}_${btoa(data.announcementText).substring(0, 16)}`;
                const isDismissed = localStorage.getItem(announcementKey);

                if (!isDismissed) {
                    setIsOpen(true);
                }
            }
        };

        fetchSettings();
    }, [pathname]); // Re-run when navigating (e.g. from landing to portal)

    const handleClose = () => {
        setIsOpen(false);
        if (settings?.announcementText) {
            const isPortal = pathname.startsWith('/portal') || pathname.startsWith('/doctor');
            const areaKey = isPortal ? 'portal' : 'public';
            const announcementKey = `dismissed_announcement_${areaKey}_${btoa(settings.announcementText).substring(0, 16)}`;
            localStorage.setItem(announcementKey, "true");
        }
    };

    if (!settings || !settings.announcementEnabled || !settings.announcementText) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
        }}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary/5 p-6 flex flex-col items-center text-center border-b">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Megaphone className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-serif text-primary">Anuncio Importante</DialogTitle>
                </div>

                <div className="p-8 pb-10">
                    <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                        {settings.announcementText}
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Button
                            onClick={handleClose}
                            className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-white font-medium shadow-lg transition-transform hover:scale-105"
                        >
                            Entendido
                        </Button>
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Cerrar</span>
                </button>
            </DialogContent>
        </Dialog>
    );
}
