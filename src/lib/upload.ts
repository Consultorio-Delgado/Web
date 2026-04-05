import { ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage in a temporary directory
 * @param file The file to upload
 * @param uid The user ID (optional) to prefix the file
 * @returns The storage reference path (e.g., temp_uploads/uid_uuid_filename)
 */
export async function uploadTempFile(file: File, uid: string = "anonymous"): Promise<string> {
    try {
        // Create an unguessable filename
        const uniqueId = crypto.randomUUID();
        // Clean filename to avoid issues with special characters
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const storagePath = `temp_uploads/${uid}_${uniqueId}_${cleanFileName}`;

        const storageRef = ref(storage, storagePath);
        
        // Upload the file directly as bytes
        await uploadBytes(storageRef, file, {
            contentType: file.type,
        });

        // We only return the path (NO public download URL)
        // This path is extremely lightweight to send over HTTP to Next.js API
        return storagePath;
    } catch (error) {
        console.error("Error uploading temp file:", error);
        throw new Error("No se pudo subir el archivo de manera temporal.");
    }
}
