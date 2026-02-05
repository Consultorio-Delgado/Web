import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Search,
  FileText,
  ArrowRight,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { doctorService } from "@/services/doctors";
import { Card, CardContent } from "@/components/ui/card";

export default async function LandingPage() {
  const doctors = await doctorService.getAll();

  const getInitials = (firstName: string, lastName: string) => {
    // Tomar primera letra de cada palabra del nombre + primera del apellido
    // Ej: "Maria Veronica" "Secondi" -> "MVS" (o "VS" si quieres solo Veronica)
    // Simplifiquemos: Primera del primer nombre + Primera del apellido
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Helper para asignar color de fondo según la propiedad 'color' (mapeo simple a clases tailwind)
  const getAvatarColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-700';
      case 'emerald': return 'bg-emerald-100 text-emerald-700';
      case 'pink': return 'bg-pink-100 text-pink-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'emerald': return 'text-emerald-600';
      case 'pink': return 'text-pink-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">

      {/* Hero Section (Hybrid: New Layout + Old Branding) */}
      <header className="relative w-full min-h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden border-b border-slate-200 bg-white">
        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-20 lg:py-0 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-8 w-fit">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Consultorio Delgado
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 leading-[1.1] mb-8">
              Cuidamos tu salud, <br />
              <span className="text-blue-600">cuidamos de vos.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 font-light leading-relaxed max-w-md mb-12">
              Profesionales de primer nivel y atención personalizada en el corazón de la ciudad.
              Reserva tu turno online en segundos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-md font-semibold bg-slate-900 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/10">
                  Reservar Turno
                  <CalendarDays className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#staff">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-md font-medium border-slate-300 text-slate-900 hover:bg-slate-50">
                  Ver Especialistas
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Image (New Style) */}
        <div className="flex-1 bg-slate-100 relative h-[50vh] lg:h-auto min-h-[400px]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')" }}>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent lg:bg-gradient-to-l"></div>
        </div>
      </header>

      {/* Feature Grid (Hybrid: New Grid + Functional Icons) */}
      <section className="w-full bg-white py-24 border-b border-slate-200">
        <div className="container px-6 md:px-12 mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200 shadow-sm">
            {/* Turnos */}
            <Link href="/login" className="bg-white p-12 flex flex-col h-80 justify-between group hover:bg-blue-50 transition-colors duration-300">
              <CalendarDays className="h-12 w-12 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <div>
                <p className="text-3xl font-light tracking-tight text-slate-900 mb-2">Turnos Online</p>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Gestiona tus citas las 24hs</p>
              </div>
            </Link>
            {/* Obras Sociales */}
            <div className="bg-white p-12 flex flex-col h-80 justify-between group hover:bg-blue-50 transition-colors duration-300">
              <ShieldCheck className="h-12 w-12 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <div>
                <p className="text-3xl font-light tracking-tight text-slate-900 mb-2">Obras Sociales</p>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Atendemos particulares y coberturas</p>
              </div>
            </div>
            {/* Historia Clínica */}
            <div className="bg-white p-12 flex flex-col h-80 justify-between group hover:bg-blue-50 transition-colors duration-300">
              <FileText className="h-12 w-12 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <div>
                <p className="text-3xl font-light tracking-tight text-slate-900 mb-2">Resultados</p>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Acceso a tus informes médicos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staff / Specialties (Hybrid: List Layout but with Doctors info) */}
      <section id="staff" className="w-full bg-slate-50 py-32">
        <div className="container px-6 md:px-12 mx-auto max-w-[1440px] flex flex-col lg:flex-row gap-20">
          <div className="lg:w-1/3 sticky top-32 h-fit">
            <h2 className="text-4xl md:text-5xl font-light tracking-tighter text-slate-900 mb-6">Nuestro Staff</h2>
            <p className="text-lg text-slate-600 font-light leading-relaxed mb-8">
              Un equipo multidisciplinario dedicado a tu bienestar. Conoce a los profesionales que lideran Consultorio Delgado.
            </p>
            <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Quote className="h-8 w-8 text-blue-200 mb-4" />
              <p className="text-slate-600 italic mb-4">"La excelencia médica no es solo curar, es acompañar al paciente en cada etapa."</p>
              <p className="text-sm font-bold text-slate-900 uppercase">Dirección Médica</p>
            </div>
          </div>

          <div className="lg:w-2/3 flex flex-col">

            {/* Dynamic Doctor List */}
            {doctors.map((doctor) => (
              <div key={doctor.id} className="group border-t border-slate-300 py-12 cursor-pointer hover:bg-white/50 transition-colors px-4 -mx-4 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 ${getAvatarColor(doctor.color)}`}>
                      {getInitials(doctor.firstName, doctor.lastName)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {(doctor.specialty === 'Ginecología' || doctor.specialty.includes('Mujer')) ? 'Dra.' : 'Dr.'} {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className={`font-medium mb-1 ${getTextColor(doctor.color)}`}>{doctor.specialty}</p>
                      <p className="text-slate-500 max-w-md">{doctor.bio || 'Especialista en Consultorio Delgado.'}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex">
                    <Link href="/login">
                      <Button variant="ghost" className="group-hover:translate-x-2 transition-transform">
                        Ver Horarios <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {doctors.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                Cargando especialistas... (Asegúrate de haber ejecutado el Seed)
              </div>
            )}

            {/* More */}
            <div className="group border-t border-slate-300 py-12 cursor-pointer hover:bg-white/50 transition-colors px-4 -mx-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-500 shrink-0">
                    +
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-slate-900 group-hover:text-blue-600 transition-colors">Más Especialidades</h3>
                    <p className="text-slate-600 font-medium mb-1">Dermatología, Nutrición, Psicología</p>
                    <p className="text-slate-500 max-w-md">Consultanos por otros profesionales de nuestra cartilla.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-300"></div>
          </div>
        </div>
      </section>

      {/* CTA Section (Hybrid) */}
      <section className="w-full bg-slate-900 py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
            Prioriza tu Bienestar Hoy
          </h2>
          <p className="text-xl text-slate-300 font-light mb-10 max-w-2xl mx-auto">
            Únete a una nueva experiencia en salud. Rápido, simple y pensado para vos.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-transform hover:scale-105 shadow-xl shadow-blue-900/50">
                Crear Cuenta Gratis
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            ¿Ya tienes cuenta? <Link href="/login" className="text-blue-400 hover:underline">Ingresa aquí</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
