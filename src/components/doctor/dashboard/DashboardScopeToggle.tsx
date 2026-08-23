"use client";

import { DashboardScope } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardScopeToggleProps {
    scope: DashboardScope;
    onChange: (scope: DashboardScope) => void;
}

export function DashboardScopeToggle({ scope, onChange }: DashboardScopeToggleProps) {
    return (
        <div className="flex items-center rounded-lg border bg-muted/40 p-1">
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 gap-1.5",
                    scope === "self" && "bg-background shadow-sm"
                )}
                onClick={() => onChange("self")}
            >
                <User className="h-3.5 w-3.5" />
                Yo
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 gap-1.5",
                    scope === "clinic" && "bg-background shadow-sm"
                )}
                onClick={() => onChange("clinic")}
            >
                <Building2 className="h-3.5 w-3.5" />
                Consultorio
            </Button>
        </div>
    );
}
