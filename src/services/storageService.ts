import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const storageService = {
    async uploadFile(file: File, path: string): Promise<string> {
        const storageRef = ref(storage, path);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    },

    async deleteFile(path: string): Promise<void> {
        const storageRef = ref(storage, path);
        try {
            await deleteObject(storageRef);
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    }
};
