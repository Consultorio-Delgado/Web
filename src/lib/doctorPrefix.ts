// Helper to determine doctor prefix based on name (Dr. vs Dra.)
export const getDoctorPrefix = (name: string): string => {
    const femaleNames = [
        'maría', 'maria', 'verónica', 'veronica', 'ana', 'laura', 'paula',
        'carolina', 'andrea', 'gabriela', 'patricia', 'claudia', 'silvia',
        'marta', 'elena', 'lucía', 'lucia', 'sofía', 'sofia', 'valentina',
        'camila', 'florencia', 'julieta', 'victoria', 'agustina', 'micaela',
        'daniela', 'romina', 'natalia', 'cecilia', 'mercedes', 'alejandra'
    ];
    const nameLower = name.toLowerCase();
    return femaleNames.some(fn => nameLower.includes(fn)) ? 'Dra.' : 'Dr.';
};
