"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { storageService } from "@/services/storageService";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    pathPrefix: string;
    onUploadComplete: (url: string, file: File) => void;
    maxFiles?: number;
}

export function FileUpload({ pathPrefix, onUploadComplete, maxFiles = 3 }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0]; // Handle one by one for simplicity in this MVP UI
        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("El archivo es demasiado grande (Máx 5MB)");
            return;
        }

        setUploading(true);
        setProgress(10); // Fake start

        try {
            const path = `${pathPrefix}/${Date.now()}_${file.name}`;
            const url = await storageService.uploadFile(file, path);

            setProgress(100);
            toast.success("Archivo subido correctamente");
            onUploadComplete(url, file);
        } catch (error) {
            console.error(error);
            toast.error("Error al subir archivo");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, [pathPrefix, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1, // One at a time for this component instance interaction
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg']
        }
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50",
                    uploading && "pointer-events-none opacity-50"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8 mb-2" />
                    {isDragActive ? (
                        <p className="text-sm">Suelta el archivo aquí...</p>
                    ) : (
                        <p className="text-sm">Arrastra un archivo (PDF/JPG) o haz clic</p>
                    )}
                    <span className="text-xs text-slate-400">Máx 5MB per archivo</span>
                </div>
            </div>

            {uploading && (
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span>Subiendo...</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                </div>
            )}
        </div>
    );
}
