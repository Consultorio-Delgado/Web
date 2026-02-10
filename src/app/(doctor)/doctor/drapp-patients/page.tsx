"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Users, Hash, User, FileText } from "lucide-react";

interface DrappPatient {
    dni: string;
    id: string;
    nombre: string;
}

export default function DrappPatientsPage() {
    const [patients, setPatients] = useState<DrappPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchDni, setSearchDni] = useState("");
    const [searchNombre, setSearchNombre] = useState("");

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await fetch("/api/drapp-patients");
                const data = await res.json();
                setPatients(data.patients || []);
            } catch (error) {
                console.error("Error fetching DRAPP patients:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const filtered = useMemo(() => {
        return patients.filter(p => {
            const matchDni = !searchDni || p.dni.toLowerCase().includes(searchDni.toLowerCase());
            const matchNombre = !searchNombre || p.nombre.toLowerCase().includes(searchNombre.toLowerCase());
            return matchDni && matchNombre;
        });
    }, [patients, searchDni, searchNombre]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Pacientes DRAPP</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Base de datos de pacientes importados desde DRAPP ({patients.length.toLocaleString()} registros)
                </p>
            </div>

            {/* Search Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Buscar Paciente
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="searchDni" className="flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-slate-500" />
                                Buscar por DNI
                            </Label>
                            <Input
                                id="searchDni"
                                placeholder="Ingrese DNI..."
                                value={searchDni}
                                onChange={(e) => setSearchDni(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="searchNombre" className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-500" />
                                Buscar por Nombre
                            </Label>
                            <Input
                                id="searchNombre"
                                placeholder="Ingrese nombre o apellido..."
                                value={searchNombre}
                                onChange={(e) => setSearchNombre(e.target.value)}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                        Mostrando {filtered.length.toLocaleString()} de {patients.length.toLocaleString()} registros
                    </p>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-auto max-h-[600px]">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700">DNI</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Nombre</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-700">ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-12 text-slate-400">
                                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            No se encontraron pacientes con esos criterios.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((p, idx) => (
                                        <tr key={`${p.dni}-${p.id}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-2.5 px-4 font-mono text-slate-800">{p.dni}</td>
                                            <td className="py-2.5 px-4 text-slate-700">{p.nombre}</td>
                                            <td className="py-2.5 px-4 font-mono text-xs text-slate-400">{p.id}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
