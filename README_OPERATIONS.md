# README_OPERATIONS.md

Guía de Operaciones para Consultorio Delgado.

**Última actualización:** 8 Feb 2026

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

## 📊 Uso Real Medido (Semana Feb 15-22, 2026)

Basado en 7 días de operación real con tráfico moderado y testeos.

### Vercel (Hobby)
| Recurso | Usado (7d) | Proyección Mes | Límite | % |
|---------|------------|----------------|--------|---|
| Edge Requests | 61K | 261K | 1M | 26% |
| Data Transfer | 1.07 GB | 4.6 GB | 100 GB | 4.6% |
| Function Invocations | 7.5K | 32K | 1M | 3.2% |

### Firebase Firestore (Spark)
| Operación | Total (7d) | Proyección Mes | Límite | % |
|-----------|------------|----------------|--------|---|
| Lecturas | 34K | 145K | 1.5M | 10% |
| Escrituras | 491 | 2.1K | 600K | 0.3% |
| Usuarios Activos | 125 | ~150 | 50K | <1% |

### Resend (Emails)
| Recurso | Usado (7d) | Proyección Mes | Límite | % |
|---------|------------|----------------|--------|---|
| Emails Transaccionales| 209 | 895 | 3,000 | 30% |

---

## 📈 Análisis de Escalabilidad a 4x (400 turnos/mes)

### Proyección basada en datos reales recopilados

| Servicio | Uso proyectado 1x | Proyección 4x | Límite Free | ¿Alcanza? |
|----------|-------------------|---------------|-------------|-----------|
| **Vercel Requests** | 261K | 1.04M | 1M | ⚠️ **Límite** |
| **Vercel Bandwidth** | 4.6 GB | 18 GB | 100 GB | ✅ Súper OK |
| **Firestore Reads** | 145K | 580K | 1.5M | ✅ 38% |
| **Resend Emails** | 895 | 3,580 | 3,000 | ⚠️ **Límite** |

### Veredicto de Escalabilidad

**✅ El sistema actual soporta hasta ~300 turnos/mes ($0 costo).**

Para llegar a los **400 turnos/mes** (crecimiento 4x), debemos monitorear dos cuellos de botella:

1. **Vercel Edge Requests:** Estamos proyectando 1.04M (el límite es 1M). 
   - *Solución:* Si nos pasamos frecuente, pasar a Vercel Pro ($20/mo) o optimizar llamadas al API.
2. **Resend Emails:** Con 4x turnos, el volumen de emails (confirmación + recordatorios) llegaría a ~3,500.
   - *Solución:* Pasar al plan Pro de Resend o agrupar recordatorios diarios/optivos.

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
