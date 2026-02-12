"use client";

import { useEffect } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Runtime Error Boundary:", error);
    }, [error]);

    return (
        <div className="container py-20 flex justify-center">
            <ErrorAlert error={error} reset={reset} />
        </div>
    );
}
