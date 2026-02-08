# README_OPERATIONS.md

Guía de Operaciones para el equipo técnico de Consultorio Delgado.

---

## 1. Rotación de Claves de Firebase

### Cuándo rotar
- Cada 90 días (recomendado)
- Inmediatamente si hay sospecha de compromiso
- Cuando un miembro del equipo con acceso deja la organización

### Proceso de Rotación

#### 1.1 Claves del Admin SDK (Server-side)

```bash
# 1. Ve a Firebase Console > Project Settings > Service Accounts
# 2. Click en "Generate new private key"
# 3. Descarga el nuevo JSON

# 4. Actualiza las variables en Vercel:
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@consultorio-delgado.iam.gserviceaccount.com"

# 5. Elimina la clave antigua desde Firebase Console > Service Accounts
```

#### 1.2 API Keys (Client-side)

Las API keys del cliente (`NEXT_PUBLIC_FIREBASE_API_KEY`) no requieren rotación ya que están protegidas por:
- Firestore Security Rules
- Domain restrictions configuradas en Google Cloud Console

> **IMPORTANTE**: Después de rotar claves, hacer redeploy inmediato en Vercel.

---

## 2. Logs de Auditoría

### Ubicación
- **Colección Firestore**: `audit_logs`

### Estructura de un Log

```json
{
  "action": "APPOINTMENT_CREATED",
  "performedBy": "uid_del_usuario",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "appointmentId": "abc123",
    "patientName": "Juan Pérez",
    "doctorName": "Dr. García"
  }
}
```

### Tipos de Acciones Auditadas

| Acción | Descripción |
|--------|-------------|
| `APPOINTMENT_CREATED` | Turno creado |
| `APPOINTMENT_CANCELLED` | Turno cancelado |
| `APPOINTMENT_CONFIRMED` | Turno confirmado |
| `APPOINTMENT_COMPLETED` | Consulta finalizada |
| `APPOINTMENT_ARRIVED` | Paciente llegó |
| `MEDICAL_NOTE_ADDED` | Nota médica agregada |
| `PATIENT_FILE_UPLOADED` | Archivo subido |
| `PATIENT_PROFILE_UPDATED` | Perfil actualizado |
| `PATIENT_DELETED` | Paciente eliminado (soft) |
| `PATIENT_RESTORED` | Paciente restaurado |
| `DOCTOR_DELETED` | Doctor eliminado (soft) |
| `DOCTOR_RESTORED` | Doctor restaurado |

### Consultar Logs desde Firebase Console

```
Firebase Console > Firestore > audit_logs
```

Filtrar por:
- `action == "APPOINTMENT_CANCELLED"` (ver cancelaciones)
- `performedBy == "uid_específico"` (acciones de un usuario)
- `timestamp >= [fecha]` (rango de fechas)

---

## 3. Restaurar Elementos Eliminados (Soft Delete)

El sistema usa "Soft Delete" - los registros no se borran, se marcan como `isDeleted: true`.

### 3.1 Restaurar un Doctor

```typescript
import { doctorService } from "@/services/doctorService";

// Restaurar doctor por ID
await doctorService.restoreDoctor("doctor_id_aqui");
```

**Desde Firebase Console:**
1. Ve a `Firestore > doctors > [doctor_id]`
2. Cambia `isDeleted` a `false`
3. Elimina o pon `null` en `deletedAt`
4. Agrega `restoredAt: [fecha actual]`

### 3.2 Restaurar un Paciente

```typescript
import { adminService } from "@/services/adminService";

// Restaurar paciente por UID
await adminService.restorePatient("patient_uid_aqui");
```

**Desde Firebase Console:**
1. Ve a `Firestore > users > [patient_uid]`
2. Cambia `isDeleted` a `false`
3. Elimina o pon `null` en `deletedAt`
4. Agrega `restoredAt: [fecha actual]`

### 3.3 Ver Todos los Elementos Eliminados

```typescript
// Ver todos los doctores (incluyendo eliminados)
const allDoctors = await doctorService.getAllDoctorsIncludingDeleted();
const deletedDoctors = allDoctors.filter(d => d.isDeleted);
```

**Desde Firebase Console:**
- Filtrar: `isDeleted == true`

---

## 4. Transacciones Atómicas (Anti-Overbooking)

El sistema previene doble reservación usando transacciones de Firestore.

### Cómo Funciona

1. Cuando un paciente intenta reservar:
   - Se inicia una transacción atómica
   - Se verifica si el slot ya está ocupado
   - Si está libre → se crea la reserva
   - Si está ocupado → error `SLOT_TAKEN`

2. Esto previene race conditions donde dos pacientes intentan reservar el mismo slot simultáneamente.

### Errores Posibles

| Código | Significado |
|--------|-------------|
| `SLOT_TAKEN` | El turno ya fue reservado por otro paciente |
| `LIMIT_EXCEEDED` | El paciente ya tiene 2 turnos activos |

---

## 5. Backups y Recuperación

### Backup Automático
Firebase realiza backups automáticos (plan Blaze). Para configurar exports manuales:

```bash
# Exportar toda la base de datos
gcloud firestore export gs://consultorio-delgado-backups/backup-$(date +%Y%m%d)
```

### Recuperación
```bash
# Importar desde backup
gcloud firestore import gs://consultorio-delgado-backups/backup-YYYYMMDD
```

---

## 6. Monitoreo

### Métricas Importantes

1. **Firebase Console > Usage and Billing**
   - Lecturas/Escrituras por día
   - Storage utilizado

2. **Vercel Analytics**
   - Requests por hora
   - Errores de API

3. **Logs de Errores**
   - Vercel > Functions > Logs
   - Filtrar por `level:error`

### Alertas Recomendadas

Configurar en Google Cloud Monitoring:
- Firestore writes > 10,000/min (posible abuso)
- Error rate > 5% (problemas de servicio)
- Storage > 4GB (revisar archivos grandes)

---

## 7. Contactos de Emergencia

| Situación | Acción |
|-----------|--------|
| Acceso comprometido | Rotar claves inmediatamente, revisar audit_logs |
| Base de datos corrupta | Restaurar desde último backup |
| Servicio caído | Verificar status de Firebase y Vercel |
