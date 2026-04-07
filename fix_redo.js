const fs = require('fs');
const path = 'c:/Users/nicoc/Downloads/Consultorio Delgado/src/app/(doctor)/doctor/daily/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                                                                        await appointmentService.updateAppointment(appt.id, {
                                                                            status: 'confirmed',
                                                                            arrivedAt: null
                                                                        } as any);
                                                                        toast.success("Estado revertido a Confirmado");
                                                                        fetchSlots();`;

const replacement = `                                                                        try {
                                                                            const { deleteField } = await import("firebase/firestore");
                                                                            const updatePromises: Promise<any>[] = [
                                                                                appointmentService.updateAppointment(appt.id, {
                                                                                    status: 'confirmed',
                                                                                    arrivedAt: null
                                                                                } as any)
                                                                            ];

                                                                            if (appt.status === 'absent' && appt.patientId) {
                                                                                updatePromises.push(
                                                                                    userService.updateUserProfile(appt.patientId, { 
                                                                                        blockedUntil: deleteField() 
                                                                                    } as any)
                                                                                );
                                                                            }

                                                                            await Promise.all(updatePromises);
                                                                            toast.success("Estado revertido a Confirmado");
                                                                            fetchSlots();
                                                                        } catch (error) {
                                                                            toast.error("Error al revertir estado");
                                                                        }`;

// Since the indent might be slightly different or have tabs/spaces issues, let's use a regex that is more robust
const regex = /await appointmentService\.updateAppointment\(appt\.id, \{\s+status: 'confirmed',\s+arrivedAt: null\s+\} as any\);\s+toast\.success\("Estado revertido a Confirmado"\);\s+fetchSlots\(\);/g;

if (regex.test(content)) {
    const newContent = content.replace(regex, (match) => {
        // We need to be careful with the nesting. The previous code was:
        /*
        onClick={async () => {
             setActionLoading(appt.id);
             try {
                 <MATCH>
             } catch (error) { ... }
        }
        */
        // My replacement includes a try block, which might nest double.
        // Let's just replace the INNER part of the EXISTING try block.
        return `const { deleteField } = await import("firebase/firestore");
                                                                        const updatePromises: Promise<any>[] = [
                                                                            appointmentService.updateAppointment(appt.id, {
                                                                                status: 'confirmed',
                                                                                arrivedAt: null
                                                                            } as any)
                                                                        ];

                                                                        if (appt.status === 'absent' && appt.patientId) {
                                                                            updatePromises.push(
                                                                                userService.updateUserProfile(appt.patientId, { 
                                                                                    blockedUntil: deleteField() 
                                                                                } as any)
                                                                            );
                                                                        }

                                                                        await Promise.all(updatePromises);
                                                                        toast.success("Estado revertido a Confirmado");
                                                                        fetchSlots();`;
    });
    fs.writeFileSync(path, newContent);
    console.log("Successfully updated the file.");
} else {
    console.log("Target content not found with regex.");
}
