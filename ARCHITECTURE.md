# Arquitectura y Estrategia Técnica - Consultorio Delgado V2
**Estado:** APROBADO (Tech Lead Verified)
**Versión:** 1.2.0

Este documento detalla la estrategia técnica, patrones de diseño y decisiones de arquitectura adoptadas.

## 1. Stack Tecnológico ("The Modern Stack")

*   **Framework Core:** **Next.js 14 (App Router)**.
*   **Lenguaje:** **TypeScript**.
*   **Estilos:** **Tailwind CSS**.
*   **Componentes UI:** **Shadcn/UI & Radix UI**.
*   **Backend:** **Firebase (Firestore + Auth)**.
*   **Fechas:** **date-fns** (Estándar obligatorio).

## 2. Estrategia Híbrida de Firebase

Dado el entorno Next.js 14, utilizamos una estrategia híbrida para maximizar compatibilidad y velocidad:

1.  **Lecturas Públicas (SSR/Async Components):** Utilizan el Client SDK inicializado en el servidor. Esto permite renderizar `(public)/page.tsx` con datos pre-cargados para mejor SEO.
2.  **Lógica Interactiva (CSR):** El Booking Engine y el Admin Portal (Client Components) usan el Client SDK standard.
3.  **Authentication:** Manejada globalmente vía `AuthContext` que persiste la sesión y sincroniza con Cookies para el Middleware.

## 3. Estructura de Proyecto (Canonical Tree)

```text
/src
├── app                      # Next.js App Router
│   ├── (public)             # Rutas Públicas (Landing, Login) -> Navbar Público
│   ├── (portal)             # Rutas Paciente (Dashboard) -> Navbar Paciente/Shared
│   ├── (admin)              # Rutas Admin (Dashboard, Agenda) -> Sidebar Admin
│   ├── api/                 # Route Handlers
│   └── seed/                # Utilidades de DB (Dev only)
│
├── components               # UI Library
│   ├── ui/                  # Shadcn Components
│   ├── shared/              # Navbar, Footer
│   ├── booking/             # Wizard de Reservas
│   └── admin/               # Componentes Admin (WeeklyAgenda)
│
├── lib                      # Configuración Core
│   ├── firebase.ts          # Singleton de Firebase
│   └── utils.ts             # CN helper
│
├── services                 # Service Layer (Desacoplamiento)
│   ├── appointments.ts      # Turnos
│   ├── doctors.ts           # Doctores
│   ├── adminService.ts      # Lógica Administrativa (Agregaciones)
│   └── user.ts              # Usuarios
```

## 4. Patrones de Diseño

### 4.1. Service Layer Pattern
**Regla:** Ningún componente UI importa `firebase/firestore` directamente.
*   **Incorrecto:** `getDocs(collection(...))` dentro de un `useEffect`.
*   **Correcto:** `await doctorService.getAll()` dentro de un `useEffect` o Server Component.

### 4.2. Booking State Machine (FSM)
El `BookingWizard` actúa como una máquina de estados finita:
`[Paso 1: Doctor] -> [Paso 2: Fecha] -> [Paso 3: Hora] -> [Paso 4: Confirmación]`
No se permite saltar pasos sin validación previa del estado anterior.

### 4.3. Singleton Pattern
`src/lib/firebase.ts` exporta una instancia única de la App, Auth y DB para evitar reinicializaciones costosas o errores durante el Hot Module Replacement.

## 5. Estrategia de Seguridad

*   **Middleware:** Intercepción de rutas `/admin` y `/portal` a nivel Edge.
*   **RBAC (Role Based Access Control):** Validación de campo `role` en el documento del usuario (`users/{uid}`).
    *   `admin`: Acceso total.
    *   `doctor`: Acceso a su agenda (Futuro).
    *   `patient`: Acceso solo a `/portal`.

## 6. Diseño & UX

*   **Admin Interface:** Prioridad a la densidad de información y rapidez de acción. Sidebar de navegación fija. Dashboard con KPIs.
*   **Public Interface:** Prioridad a la estética, "Wow Factor" y conversión (reservar turno).

---
*Documento vivo. Actualizar ante cambios estructurales mayores.*
