import { storage } from "./firebaseAdmin";

export interface AttachmentRequest {
    filename: string;
    path: string;
}

export interface ProcessedAttachment {
    filename: string;
    content: Buffer;
}

/**
 * Downloads temporary files from Firebase Storage to memory Buffers
 * and deletes them from Storage for security and cost savings.
 * 
 * @param attachments List of attachments with their temp storage paths
 * @returns List of processed attachments ready for Resend
 */
export async function downloadAndCleanupTempFiles(attachments?: AttachmentRequest[]): Promise<ProcessedAttachment[]> {
    if (!attachments || attachments.length === 0) {
        return [];
    }

    const processedAttachments: ProcessedAttachment[] = [];
    const bucket = storage.bucket();

    for (const attachment of attachments) {
        if (!attachment.path) continue;
        
        try {
            const file = bucket.file(attachment.path);
            
            // Download file into memory Buffer
            const [buffer] = await file.download();
            
            processedAttachments.push({
                filename: attachment.filename,
                content: buffer
            });

            // Delete file from Firebase Storage to maintain privacy and clean up space
            await file.delete();
            console.log(`[Storage] Automatically deleted temp file: ${attachment.path}`);
        } catch (error) {
            console.error(`[Storage] Error processing file ${attachment.path}:`, error);
            // We continue processing other files even if one fails
        }
    }

    return processedAttachments;
}
