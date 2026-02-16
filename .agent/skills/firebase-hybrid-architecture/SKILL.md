---
name: firebase-hybrid-architecture
description: "Handles Firestore & Auth logic enforcing the Hybrid Strategy (Client SDK for UI, Admin SDK for API/Cron). Use this skill whenever creating or modifying Firebase-related code."
---

# Firebase Hybrid Architecture

## When to Use

- Creating or modifying API Routes (`src/app/api/**`)
- Creating or modifying Cron Jobs (`src/app/api/cron/**`)
- Working with Firestore reads/writes in Server Components
- Working with Firestore reads/writes in Client Components (`"use client"`)
- Debugging authentication or permission issues
- Creating new Firebase services in `src/services/`

## Instructions

### Golden Rule: Client vs Admin SDK

| Context | SDK to Use | Import From |
|---|---|---|
| Client Components (`"use client"`) | Client SDK | `@/lib/firebase` |
| Services called from Client Components | Client SDK | `@/lib/firebase` |
| API Routes (`route.ts`) | **Admin SDK** | `@/lib/firebaseAdmin` |
| Cron Jobs (`src/app/api/cron/**`) | **Admin SDK** | `@/lib/firebaseAdmin` |
| Server Components | **Admin SDK** | `@/lib/firebaseAdmin` |
| Middleware | Neither — use JWT verification only | — |

> **NEVER** import `firebase/firestore`, `firebase/auth`, or `@/lib/firebase` in API Routes or Server Components. This will cause build errors or runtime issues on Vercel.

### Singleton Pattern

- `src/lib/firebase.ts` — Client SDK singleton (exports `db`, `auth`, `app`)
- `src/lib/firebaseAdmin.ts` — Admin SDK singleton (exports `db`, `auth`)
- Both files use a check-before-init pattern to avoid duplicate app initialization

### Service Layer Pattern

All Firestore logic lives in `src/services/*.ts`:

```
src/services/
├── appointments.ts    # CRUD for appointments (Client SDK)
├── doctorService.ts   # Doctor profiles (Client SDK)
├── user.ts            # User/patient profiles (Client SDK)
├── availabilityService.ts  # Slot generation (pure logic, no SDK)
├── adminService.ts    # Admin operations (Client SDK)
├── exceptionService.ts    # Holiday/exception management
└── settingsService.ts     # App-wide settings
```

- Services use the **Client SDK** because they are called from `"use client"` components
- API Routes that need Firestore access should use the Admin SDK **directly**, not through these services

### Date Handling

- **Always** use `date-fns` for date manipulation (`format`, `addDays`, `startOfDay`, etc.)
- **Always** use `date-fns/locale/es` for Spanish formatting
- Convert Firestore `Timestamp` to `Date` with `.toDate()` before processing
- Convert `Date` to Firestore `Timestamp` with `Timestamp.fromDate(date)` before saving
- Argentina timezone is UTC-3 — account for this in Cron jobs

### Firestore Data Patterns

- Appointments store dates as `Timestamp` type in Firestore
- Time strings are stored as `HH:MM` format (e.g., `"14:30"`)
- Patient IDs prefixed with `manual_` indicate non-registered patients (sobreturnos)
- Patient IDs equal to `blocked` indicate blocked time slots
- Doctor IDs are their Firebase Auth UIDs

### Common Mistakes to Avoid

1. **Never** use `new Date()` for business logic comparisons without zeroing hours first
2. **Never** import Client SDK in API routes — it will fail on Vercel
3. **Always** handle `Timestamp` → `Date` conversion when reading from Firestore
4. **Always** add `updatedAt: Timestamp.now()` when updating documents
5. **Never** trust client-side data — validate in Firestore Rules
