import { EmailVerificationGuard } from "@/components/auth/EmailVerificationGuard";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <EmailVerificationGuard>
            {children}
        </EmailVerificationGuard>
    );
}
