import * as React from 'react';
import { Html, Body, Container, Head, Hr, Img, Link, Preview, Section, Text, Tailwind } from '@react-email/components';

interface EmailLayoutProps {
    previewText: string;
    heading: string;
    children: React.ReactNode;
}

export const EmailLayout = ({ previewText, heading, children }: EmailLayoutProps) => {
    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-[#f6f9fc] my-auto mx-auto font-sans">
                    <Container className="bg-white border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] shadow-sm">
                        <Section className="mt-[20px] mb-[20px]">
                            {/* Ideally use a remote URL for the image. If not, text fallback is fine, but request asked for logo or placeholder. */}
                            {/* Using a placeholder SVG or text for now as I don't have a public URL handy. 
                   Text fallback as per new design request "Consultorio Delgado" is already there, 
                   request asked for Logo centered. Let's use a nice styled text or placeholder img if I had one. 
                   I will stick to the styled text as before but refine spacing. */}
                            <Text className="text-black text-[24px] font-normal text-center p-0 my-0 mx-0">
                                Consultorio <span className="font-bold text-blue-600">Delgado</span>
                            </Text>
                        </Section>

                        <Section>
                            <Text className="text-black text-[20px] leading-[24px] font-bold text-center mt-2 mb-4">
                                {heading}
                            </Text>
                        </Section>

                        {children}

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Section>
                            <Text className="text-[#8898aa] text-[12px] leading-[24px] text-center">
                                © 2026 Consultorio Delgado. Delgado 588, 1°C (1426) CABA.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default EmailLayout;
