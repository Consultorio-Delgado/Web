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

## � Uso Real Medido (Feb 1-8, 2026)

### Vercel (25% del mes)

| Recurso | Usado | Límite | % |
|---------|-------|--------|---|
| Edge Requests | 22K | 1M | 2.2% |
| Data Transfer | 379 MB | 100 GB | 0.4% |
| Function Invocations | 2.4K | 1M | 0.2% |

### Firebase Firestore (8 días)

| Operación | Total | Proyección mes | Límite Spark | % |
|-----------|-------|----------------|--------------|---|
| Lecturas | 13K | ~52K | 1.5M | 3.5% |
| Escrituras | 384 | ~1.5K | 600K | 0.25% |
| Eliminaciones | 144 | ~576 | 600K | 0.01% |

---

## 🧪 Plan de Testing: Semana de Producción Real

### Objetivo
Validar que el sistema funciona correctamente con carga real durante 1 semana completa y proyectar si podemos escalar a 4x (400 turnos/mes) sin pagar.

### Período de Prueba
**Fecha inicio:** ___/___/2026  
**Fecha fin:** ___/___/2026

### Checklist Diario

```
[ ] Verificar que emails de confirmación llegaron
[ ] Verificar que recordatorios se enviaron (9am)
[ ] Revisar logs de Vercel por errores
[ ] Anotar cantidad de turnos del día
```

### Métricas a Registrar

| Día | Turnos | Emails OK | Errores | Notas |
|-----|--------|-----------|---------|-------|
| Lun | | | | |
| Mar | | | | |
| Mié | | | | |
| Jue | | | | |
| Vie | | | | |
| Sáb | | | | |

### Al Finalizar la Semana

1. **Captura de pantalla** de uso en:
   - Vercel → Usage
   - Firebase → Usage and billing
   - Resend → Logs (count de emails)

2. **Calcular proyección 4x:**
   - Si la semana usó X% → mes completo = X × 4
   - Si mes completo × 4 < 80% del límite → ✅ Escalable gratis

---

## 📈 Análisis de Escalabilidad a 4x (400 turnos/mes)

### Proyección basada en datos reales

| Servicio | Uso actual/mes | Proyección 4x | Límite Free | ¿Alcanza? |
|----------|---------------|---------------|-------------|-----------|
| **Vercel Requests** | ~88K | ~352K | 1M | ✅ 35% |
| **Vercel Bandwidth** | ~1.5 GB | ~6 GB | 100 GB | ✅ 6% |
| **Firestore Reads** | ~52K | ~208K | 1.5M | ✅ 14% |
| **Firestore Writes** | ~1.5K | ~6K | 600K | ✅ 1% |
| **Emails** | ~300 | ~1,200 | 3K | ✅ 40% |

### Veredicto Preliminar

**✅ Podemos escalar a 4x sin pagar nada.**

El recurso más ajustado sería:
- **Emails Resend:** 40% del límite free (1,200 de 3,000)
- **Firestore Reads:** 14% del límite (si hay picos, monitorear)

### Cuándo empezar a pagar

| Escenario | Acción |
|-----------|--------|
| < 500 turnos/mes | Seguir gratis |
| 500-1000 turnos/mes | Considerar Blaze ($2-5/mes) |
| > 1000 turnos/mes | Vercel Pro + Blaze (~$25/mes) |

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
