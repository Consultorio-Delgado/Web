# 🚀 Guía de Despliegue a Producción (Vercel + Firebase)

Esta guía te llevará paso a paso para poner tu aplicación **Consultorio Delgado** en internet.

## 1. Selección de Plataforma: Vercel
**Recomendación:** [Vercel](https://vercel.com)
**¿Por qué?**
*   **Creadores de Next.js:** Vercel desarrolla Next.js, por lo que la compatibilidad es 100% nativa. No necesitas configurar nada (cero config).
*   **Rendimiento:** Optimiza automáticamente imágenes, fuentes y scripts.
*   **Gratuito:** Su capa gratuita (Hobby) es excelente para proyectos personales y demos.
*   **CI/CD Automático:** Cada vez que hagas `git push` a tu repositorio, Vercel actualizará tu web automáticamente.

---

## 2. Guía Paso a Paso

### Paso 1: Crear Cuenta en Vercel
1.  Ve a [vercel.com/signup](https://vercel.com/signup).
2.  Selecciona **"Continue with GitHub"**.
3.  Autoriza a Vercel para acceder a tu cuenta de GitHub (esto es necesario para leer tu repositorio).

### Paso 2: Importar el Proyecto
1.  Una vez logueado, verás tu **Dashboard**. Haz clic en el botón **"Add New..."** -> **"Project"**.
2.  En la lista "Import Git Repository", busca tu repositorio (`consultorio-delgado` o el nombre que le hayas puesto).
3.  Haz clic en **"Import"**.

### Paso 3: Configurar el Proyecto (Framework Preset)
Vercel detectará automáticamente que es un proyecto **Next.js**.
*   **Framework Preset:** Déjalo en `Next.js`.
*   **Root Directory:** Déjalo en `./` (a menos que tu código esté dentro de una subcarpeta, pero no es tu caso).

### Paso 4: Variables de Entorno (CRÍTICO ⚠️)
Aquí es donde conectamos Firebase. No le des a "Deploy" todavía.
1.  Busca la sección **"Environment Variables"** y despliégala.
2.  Abre tu archivo `.env.local` en tu editor de código (VS Code).
3.  Debes copiar **CADA UNA** de las variables y pegarlas en Vercel.
    *   **Name:** El nombre de la variable (Ej: `NEXT_PUBLIC_FIREBASE_API_KEY`)
    *   **Value:** El valor (Ej: `AIzaSyD...`)
    *   Haz clic en **"Add"** después de cada una.

**Lista de variables que debes tener (según tu configuración):**
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`

*(Asegúrate de no copiar comillas extra ni espacios en blanco).*

### Paso 5: Desplegar
1.  Una vez agregadas todas las variables, haz clic en **"Deploy"**.
2.  Espera unos minutos. Verás una pantalla de "Building...".
3.  ¡Listo! Verás una pantalla de felicitaciones con confeti 🎉.
4.  Haz clic en la imagen de vista previa o en el botón **"Visit"**. Esa es tu URL pública (ej: `consultorio-delgado.vercel.app`).

---

## 3. Verificación Post-Despliegue

Tu web ya está online, pero Firebase bloqueará el Login si no autorizas el nuevo dominio.

### Paso 1: Autorizar Dominio en Firebase (CRÍTICO ⚠️)
1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2.  Entra a tu proyecto.
3.  En el menú lateral izquierdo, ve a **Authentication** -> **Settings** (Configuración) -> Pestaña **Authorized domains** (Dominios autorizados).
4.  Haz clic en **"Add domain"**.
5.  Copia tu nuevo dominio de Vercel (ej: `consultorio-delgado.vercel.app`) y pégalo ahí.
6.  Haz clic en **"Add"**.

### Paso 2: Probar la Web
Entra a tu nueva URL y prueba lo siguiente:
1.  **Navegación:** ¿Carga la home? ¿Funcionan los links del Navbar?
2.  **Registro/Login:** Intenta registrar un usuario nuevo.
    *   *Si falla:* Revisa que hayas autorizado el dominio en Firebase (Paso 1).
    *   *Si falla:* Revisa que las Environment Variables en Vercel estén bien copiadas (puedes editarlas en Vercel -> Settings -> Environment Variables y luego necesitas re-desplegar o "Redeploy" para que surtan efecto).
3.  **Base de Datos:** Si tienes datos sembrados (doctores), verifica que aparezcan en la página de "Especialistas" o en el Wizard de reserva.

### Paso 3: Seed (Opcional pero Recomendado)
Como es una "nueva" instancia (aunque usa el mismo Firestore), verifica tener los datos necesarios. Si usas el mismo proyecto de Firebase que en local, los datos (doctores, usuarios) **YA ESTARÁN AHÍ** (porque Firestore es una base de datos en la nube, no local). ¡Esa es la magia! ✨

---

## Resumen de URLs
*   **Tu Web:** `https://tuproyecto.vercel.app`
*   **Panel Vercel:** `https://vercel.com/dashboard`
*   **Firebase Console:** `https://console.firebase.google.com`

¡Éxito con el lanzamiento! 🚀
