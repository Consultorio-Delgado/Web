import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Search,
  FileText,
  ArrowRight,
  Quote,
  ShieldCheck,
  Trash2, // Removed unused
  Stethoscope, // Added
  User as UserIcon,
} from "lucide-react";
// ...
{/* Ginecología */ }
<div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group">
  <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
    <Stethoscope className="h-10 w-10 text-accent-foreground" />
  </div>
  <h3 className="text-2xl font-serif text-slate-900 mb-3">Ginecología</h3>
  <p className="text-slate-500 leading-relaxed">
    Control ginecológico, Anticoncepción, Climaterio, Patología Cervical, ETS, Test de HPV. Una mirada integral hacia una Longevidad saludable.
  </p>
</div>

{/* Clínica Médica */ }
<div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group">
  <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
    <Stethoscope className="h-10 w-10 text-accent-foreground" />
  </div>
  <h3 className="text-2xl font-serif text-slate-900 mb-3">Clínica Médica</h3>
  <p className="text-slate-500 leading-relaxed">
    Diagnóstico, tratamiento y prevención de enfermedades para adultos.
  </p>
</div>

{/* Recetas */ }
<div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group">
  <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
    <FileText className="h-10 w-10 text-accent-foreground" />
  </div>
  <h3 className="text-2xl font-serif text-slate-900 mb-3">Recetas Digitales</h3>
  <p className="text-slate-500 leading-relaxed">
    Solicitud y gestión ágil de tus prescripciones médicas.
  </p>
</div>
          </div >
        </div >
      </section >

  {/* Staff / Specialties (Hybrid: List Layout but with Doctors info) */ }
  < section id = "staff" className = "w-full bg-slate-50 py-32" >
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
                    {doctor.id === 'secondi' ? 'Dra. María Verónica Secondi' :
                      doctor.id === 'capparelli' ? 'Dr. Germán Capparelli' :
                        `${(doctor.specialty === 'Ginecología' || doctor.specialty.includes('Mujer')) ? 'Dra.' : 'Dr.'} ${doctor.firstName} ${doctor.lastName}`}
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

        <div className="border-t border-slate-300"></div>
      </div>
    </div>
      </section >

  {/* Medical Coverage Section (New) */ }
  < section className = "w-full bg-slate-900 py-24 border-t border-slate-800" >
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

        {/* OSDE with tooltip */}
        <div className="group relative">
          <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light cursor-default hover:border-slate-500 transition-colors">
            OSDE
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
            <p className="text-slate-800 font-medium text-sm">Planes: 210, 310, 410, 450, 510, 550</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
          </div>
        </div>

        {/* Swiss Medical with tooltip */}
        <div className="group relative">
          <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light cursor-default hover:border-slate-500 transition-colors">
            Swiss Medical
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
            <p className="text-slate-800 font-medium text-sm">Todos los planes</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
          </div>
        </div>

        {/* Galeno */}
        <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
          Galeno**
        </div>

        {/* Omint with tooltip */}
        <div className="group relative">
          <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light cursor-default hover:border-slate-500 transition-colors">
            Omint
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[200px]">
            <p className="text-slate-800 font-medium text-sm whitespace-nowrap">Planes: Skill, O y F, Global,</p>
            <p className="text-slate-800 font-medium text-sm whitespace-nowrap">3000, 4500, 6500, 8500, Cartilla 4</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
          </div>
        </div>

        {/* Luis Pasteur with tooltip */}
        <div className="group relative">
          <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light cursor-default hover:border-slate-500 transition-colors">
            Luis Pasteur*
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <p className="text-slate-800 font-medium text-sm whitespace-nowrap">Planes: E, J, L, M, N, P, S, V, Novo</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
          </div>
        </div>

        {/* OSA */}
        <div className="px-8 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-200 font-light">
          OSA*
        </div>
      </div>

      <div className="text-sm text-slate-500 space-y-2 font-light">
        <p>* Solo Dr. Capparelli. Consultar por planes específicos.</p>
        <p>** No se atienden pacientes por primera vez.</p>
      </div>
    </div>
      </section >

  {/* CTA Section (Hybrid) */ }
  < section className = "w-full bg-slate-900 py-32 px-6 relative overflow-hidden" >
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
      </section >
    </div >
  );
}
