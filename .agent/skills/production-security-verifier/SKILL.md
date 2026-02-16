---
name: production-security-verifier
description: "Audits code for Vercel deployment, security headers, and Firestore Rules compliance. Use this skill before deploying or when reviewing security configurations."
---

# Production Security Verifier

## When to Use

- Before deploying to production (Vercel)
- When modifying `firestore.rules`
- When modifying `next.config.mjs` or `next.config.js`
- When adding or changing environment variables
- When creating or modifying Cron Jobs
- During security audits or code reviews

## Instructions

### 1. Firestore Rules Audit

**Location**: `firestore.rules` at project root

#### Critical Checks

| Rule | Status | Action |
|---|---|---|
| `allow write: if true` | 🚫 DANGER | Never allow unrestricted writes |
| `allow read: if true` | ⚠️ WARNING | Only acceptable for public data (e.g., doctor profiles) |
| Role-based access | ✅ REQUIRED | Use helper functions: `isAdmin()`, `isDoctor()`, `isAuthenticated()` |
| Owner-only writes | ✅ REQUIRED | Patients can only modify their own data |

#### Required Helper Functions

```
function isAuthenticated() { return request.auth != null; }
function isAdmin() { return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; }
function isDoctor() { return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'doctor'; }
```

#### Collection-Specific Rules

- **appointments**: Doctors and admins can create/update/delete. Patients can only cancel their own (status change only)
- **users**: Users can read/update their own profile. Admins can read all
- **doctors**: Public read allowed (for booking). Only admins can write
- **settings**: Public read. Only admins can write
- **exceptions**: Public read (for calendar). Only admins/doctors can write

### 2. Security Headers (next.config.mjs)

Verify these headers are configured:

```javascript
async headers() {
    return [{
        source: '/:path*',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ]
    }];
}
```

> CSP (Content-Security-Policy) should be configured carefully to allow Firebase, Resend, and other required domains.

### 3. Environment Variables

#### Naming Convention

| Prefix | Visibility | Usage |
|---|---|---|
| `NEXT_PUBLIC_*` | Exposed to browser | Firebase config, public URLs only |
| No prefix | Server-only | API keys, secrets, Admin SDK credentials |

#### Required Variables Checklist

```
# Server-only (NEVER prefix with NEXT_PUBLIC_)
RESEND_API_KEY=re_...
EMAIL_FROM=Consultorio Delgado <no-reply@...>
CRON_SECRET=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Client-safe (NEXT_PUBLIC_ prefix OK)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

#### Critical Checks

- 🚫 `RESEND_API_KEY` must NEVER have `NEXT_PUBLIC_` prefix
- 🚫 `CRON_SECRET` must NEVER have `NEXT_PUBLIC_` prefix
- 🚫 `FIREBASE_PRIVATE_KEY` must NEVER have `NEXT_PUBLIC_` prefix
- 🚫 `FIREBASE_CLIENT_EMAIL` must NEVER have `NEXT_PUBLIC_` prefix
- ✅ Firebase client config CAN have `NEXT_PUBLIC_` prefix (it's designed to be public)

### 4. Vercel Cron Jobs

**Location**: `vercel.json` at project root

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 20 * * *"
    }
  ]
}
```

#### Cron Security

- Every cron endpoint MUST validate the `Authorization: Bearer $CRON_SECRET` header
- In production, reject requests without valid auth immediately
- In development, warn but allow (for testing)

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
```

### 5. Pre-Deployment Checklist

- [ ] `firestore.rules` has no `allow write: if true`
- [ ] All API keys are server-only (no `NEXT_PUBLIC_` prefix on secrets)
- [ ] Security headers configured in `next.config.mjs`
- [ ] Cron jobs protected with `CRON_SECRET`
- [ ] No Client SDK imports in API Routes or Server Components
- [ ] `npm run build` succeeds without errors
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Environment variables set in Vercel dashboard
