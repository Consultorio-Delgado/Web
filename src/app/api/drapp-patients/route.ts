import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// API route to serve DRAPP patient CSV data (doctor-only via layout protection)
export async function GET() {
    try {
        const csvPath = join(process.cwd(), 'pacientes_dni.csv');
        const csvContent = readFileSync(csvPath, 'utf-8');

        const lines = csvContent.split('\n').filter(l => l.trim());
        // Skip header line: DNI;ID_PACIENTE;NOMBRE
        const patients = lines.slice(1).map(line => {
            const [dni, id, nombre] = line.split(';').map(s => s.trim());
            return { dni, id, nombre };
        }).filter(p => p.dni && p.nombre); // filter out empty rows

        return NextResponse.json({ patients });
    } catch (error) {
        console.error('Error reading DRAPP patients CSV:', error);
        return NextResponse.json({ error: 'Error reading patient data' }, { status: 500 });
    }
}
