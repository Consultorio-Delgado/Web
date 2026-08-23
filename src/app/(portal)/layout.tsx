import { EmailVerificationGuard } from "@/components/auth/EmailVerificationGuard";
import { ProfileCompletionGuard } from "@/components/auth/ProfileCompletionGuard";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <EmailVerificationGuard>
            <ProfileCompletionGuard>
                {children}
            </ProfileCompletionGuard>
        </EmailVerificationGuard>
    );
}
