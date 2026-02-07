import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Search,
  FileText,
  ArrowRight,
  Quote,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { doctorService } from "@/services/doctorService";
import { Card, CardContent } from "@/components/ui/card";

export default async function LandingPage() {
  const doctors = await doctorService.getAllDoctors();

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

      {/* Hero Section (Redesigned) */}
      <header className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/40 z-10 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/10 z-10"></div>
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/images/hero_bg.png')" }}></div>
        </div>

        <div className="container relative z-20 px-6 text-center text-white pb-32 md:pb-40">
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-1000">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight leading-tight">
              Cuidado Médico de Excelencia y <br className="hidden md:block" />
              <span className="italic">Calidez Humana</span>
            </h1>
            <p className="text-base md:text-lg font-light text-slate-100 max-w-2xl mx-auto opacity-90">
              Especialistas en Ginecología y Clínica Médica dedicados a su bienestar integral.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/portal/new-appointment">
                <Button size="lg" className="h-14 px-10 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-lg shadow-lg border-2 border-transparent transition-all hover:scale-105">
                  Reservar Turno
                </Button>
              </Link>
              <Link href="#staff">
                <Button size="lg" variant="outline" className="h-14 px-10 rounded-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-medium text-lg transition-all hover:scale-105">
                  Nuestros Servicios
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
          <svg className="relative block w-[calc(100%+1.3px)] h-[100px] md:h-[150px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-white"></path>
          </svg>
        </div>
      </header>

      {/* Specialties Section (Redesigned) */}
      <section className="w-full bg-white pb-32 pt-10">
        <div className="container px-6 md:px-12 mx-auto max-w-7xl">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-primary">Nuestras Especialidades</h2>
            <p className="text-lg text-slate-500 font-light max-w-2xl mx-auto">
              Brindamos atención médica de primer nivel con un enfoque humano y personalizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ginecología */}
            <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-10 w-10 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-3">Ginecología</h3>
              <p className="text-slate-500 leading-relaxed">
                Check-ups anuales, control de embarazo y salud reproductiva integral.
              </p>
            </div>

            {/* Clínica Médica */}
            <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserIcon className="h-10 w-10 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-3">Clínica Médica</h3>
              <p className="text-slate-500 leading-relaxed">
                Diagnóstico, tratamiento y prevención de enfermedades para adultos.
              </p>
            </div>

            {/* Recetas */}
            <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-10 w-10 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-3">Recetas Digitales</h3>
              <p className="text-slate-500 leading-relaxed">
                Solicitud y gestión ágil de tus prescripciones médicas.
              </p>
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
                    <Link href="/portal/new-appointment">
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

      {/* Medical Coverage Section (New) */}
      <section className="w-full bg-slate-900 py-24 border-t border-slate-800">
        <div className="container px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Coberturas Médicas</h2>
          <p className="text-lg text-slate-400 font-light mb-12 max-w-2xl mx-auto">
            Trabajamos con las principales obras sociales y prepagas para tu tranquilidad.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {/* Particular - Highlighted */}
            <div className="px-8 py-3 rounded-full border border-red-500/50 bg-red-500/10 text-red-400 font-medium tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              Particular
            </div>

            {/* Standard Providers */}
            <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
              OSDE (210-550)
            </div>
            <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
              Swiss Medical
            </div>
            <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
              Galeno**
            </div>
            <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
              Omint
            </div>
            <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
              Luis Pasteur*
            </div>
            <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
              OSA*
            </div>
          </div>

          <div className="text-sm text-slate-500 space-y-2 font-light">
            <p>* Solo Dr. Capparelli. Consultar por planes específicos.</p>
            <p>** No se atienden pacientes por primera vez.</p>
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
