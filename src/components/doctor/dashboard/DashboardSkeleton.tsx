"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Block({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-1">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Block className="h-8 w-48" />
                    <Block className="h-4 w-64" />
                </div>
                <Block className="h-9 w-56" />
            </div>
            <Block className="h-10 w-full max-w-xl" />
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Block className="h-6 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Block className="h-32 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Block className="h-6 w-36" />
                    </CardHeader>
                    <CardContent>
                        <Block className="h-32 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Block className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
