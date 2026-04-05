# README_OPERATIONS.md

Guía de Operaciones para Consultorio Delgado.

**Última actualización:** 5 Abr 2026

---

## � Costo Actual: $0/mes

Todo el stack corre en planes gratuitos:

| Servicio | Plan | Costo | Estado |
|----------|------|-------|--------|
| **Vercel** | Hobby (Free) | $0 | ✅ Usando <10% |
| **Firebase** | Spark (Free) | $0 | ✅ Usando <4% |
| **Cloudflare** | Free | $0 | ✅ Ilimitado |
| **GoDaddy** | Dominio | ~$15/año | Solo renovación |
| **Resend** | Free | $0 | ✅ 3K emails/mes |

---

## 📅 Ciclos de Facturación y Reset de Cuotas

Para monitorear los límites, es clave entender cuándo se "limpian" los contadores:

| Servicio | Tipo de Ciclo | Cuándo Reinicia |
|----------|---------------|-----------------|
| **Vercel** | Ventana Progresiva | **Rolling 30 days.** No hay un día fijo; se cuenta lo usado en los últimos 30 días exactos. |
| **Firebase** | Diario | **Cada 24hs** (00:00 Pacific Time / ~04:00 AM Argentina). |
| **Resend** | Mensual (Suscripción) | El **día 7 de cada mes** (aniversario de creación de cuenta). |

> [!TIP]
> **Resend** tiene un límite adicional de **100 emails por día** en el plan gratuito, independientemente de los 3,000 mensuales.

---

## 📊 Uso Real Medido (Estado al 5 Abr 2026)

Datos actualizados al ciclo de Abril (1-5 Abr). 

> [!NOTE]
> El pico de **37K lecturas** de hoy (5 Abr) se debe a actividad intensa de desarrollo y pruebas del usuario. Se espera que el promedio diario se estabilice en la próxima semana.

### Vercel (Hobby)
| Recurso | Usado (7d) | Proyección Mes | Límite | % |
|---------|------------|----------------|--------|---|
| Edge Requests | 196K | 196K | 1M | 19.6% |
| Data Transfer | 3.75 GB | 3.75 GB | 100 GB | 3.75% |
| Function Invocations | 30K | 30K | 1M | 3% |
| Speed Insights | 22K | 22K | 10K | 🛑 **220%** |

### Firebase Firestore (Spark)
| Operación | Total (7d) | Proyección Mes | Límite | % |
|-----------|------------|----------------|--------|---|
| Lecturas | 14.2K avg | 426K (Abril) | 1.5M (50K/día) | ⚠️ **Creciendo** |
| Escrituras | 34 avg | 1K | 600K (20K/día) | <1% |
| Usuarios Activos | 125 | ~150 | 50K | <1% |

### Resend (Emails)
| Recurso | Usado (7d) | Proyección Mes | Límite | % |
|---------|------------|----------------|--------|---|
| Emails Transaccionales| 702 | ~730 | 3,000 | 24% |

---

## 📈 Análisis de Escalabilidad a 4x (400 turnos/mes)

### Proyección basada en datos reales recopilados

| Servicio | Uso proyectado 1x | Proyección 4x | Límite Free | ¿Alcanza? |
|----------|-------------------|---------------|-------------|-----------|
| **Vercel Requests** | 196K | 784K | 1M | ✅ OK |
| **Vercel Bandwidth** | 4 GB | 16 GB | 100 GB | ✅ Súper OK |
| **Firestore Reads** | 14.2K avg | 1.7M (Peak 148K) | 50K/día | 🛑 **Límite (x4)** |
| **Resend Emails** | 730 | 2,920 | 3,000 | ✅ Ajustado |

### Veredicto de Escalabilidad

**✅ El sistema actual soporta hasta ~300 turnos/mes ($0 costo).**

Para llegar a los **400 turnos/mes** (crecimiento 4x), debemos monitorear dos cuellos de botella:

1. **Vercel Edge Requests:** Confirmado por reporte mensual: **784K** proyectados a 4x. Entra perfectamente en el plan Free (límite 1M).
2. **Resend Emails:** Con 4x turnos, el volumen llegaría a ~2,920. Está al límite (3k).
3. **Firestore Daily Reads:** En los primeros 5 días de abril promedias **14.2K lecturas/día**. 
   - *Riesgo x4:* La proyección subió a **1.7M/mes**, lo que supera el límite Spark (1.5M). Además, los días pico (como hoy de 37K) bloquearían el sitio a las pocas horas.
   - *Solución:* Revisar si hay "lecturas infinitas" (useEffect sin dependencias, etc.) o activar el Plan Blaze para evitar caídas por picos.
4. **Speed Insights:** Te pasaste del límite (22K de 10K). No corta el sitio, pero deja de medir.

### Cuándo empezar a pagar

| Escenario | Acción |
|-----------|--------|
| < 300 turnos/mes | 🆓 100% Gratis. |
| 300 - 450 turnos/mes | ⚠️ Monitorear Resend y Vercel. Considerar Vercel Pro ($20). |
| > 500 turnos/mes | 💳 Pasar a Vercel Pro + Resend Pro. Registro como negocio real. |

---

## 🔧 Configuración de Servicios

### Variables de Entorno (Vercel)

```env
# Firebase
FIREBASE_PROJECT_ID=consultorio-delgado
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client (públicas)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=consultorio-delgado
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Consultorio Delgado <noreply@consultoriodelgado.com>

# App
NEXT_PUBLIC_APP_URL=https://consultoriodelgado.com
```

### Cloudflare DNS

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| CNAME | @ | cname.vercel-dns.com | ✅ |
| CNAME | www | cname.vercel-dns.com | ✅ |

---

## 🔐 Seguridad

### Rotación de Claves (cada 90 días o si hay compromiso)

**Firebase:**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Actualizar en Vercel
4. Redeploy
5. Eliminar clave antigua

**Resend:**
1. Resend → API Keys → Create
2. Actualizar en Vercel
3. Redeploy
4. Eliminar key antigua

---

## 🚨 Emergencias

### Servicio caído
1. Verificar status pages:
   - vercel-status.com
   - status.firebase.google.com
2. Revisar últimos deploys en Vercel
3. Revertir si es necesario

### Emails no llegan
1. Verificar Resend → Logs
2. Buscar `bounced` o `complained`
3. Verificar dominio sigue verificado

---

## 📞 Links Útiles

| Servicio | Dashboard |
|----------|-----------|
| Vercel | vercel.com/dashboard |
| Firebase | console.firebase.google.com |
| Cloudflare | dash.cloudflare.com |
| Resend | resend.com/overview | 
