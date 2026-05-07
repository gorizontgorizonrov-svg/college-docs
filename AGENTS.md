# AGENTS.md

## Stack
- Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- Prisma ORM v5 + PostgreSQL
- Auth.js v5 (NextAuth) with RBAC (APPLICANT, MODERATOR, ADMIN)
- React Hook Form + Zod for form validation
- Zod for environment validation

## Database
- Schema: `prisma/schema.prisma`
- Models: User, Applicant, Specialty, Document, Application, Review, Moderator
- Key enums: Role, CertType (GRADE_9/GRADE_11), DocType, DocStatus, AppStatus, ReviewDecision
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to sync database (requires PostgreSQL running)

## Project Structure
- `app/` — Next.js App Router pages
- `components/` — UI components
- `lib/` — utils (prisma.ts, env.ts)
- `prisma/` — database schema
- `actions/` — server actions (future phases)
- `auth.ts` — Auth.js v5 configuration

## Authentication (Auth.js v5)
- Login: email or phone + password via CredentialsProvider
- Session strategy: JWT
- Custom session includes: id, role, email, phone
- Protected routes: use `auth()` server-side or `useSession()` client-side
- Sign-in page: `/login`

## Mobile-First UI
All pages must work on mobile. Use minimum touch target 44px.

## Commands
- `npm run dev` — development server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — linting
- `npx prisma generate` — generate Prisma client
- `npx prisma db push` — push schema to DB

## Phase 1 Status
✅ Complete: Next.js + TypeScript + Tailwind + Prisma + Auth.js + base layout + navigation

## Kyrgyz Context
- Phone format: +996...
- Interface: Russian
- СЭД КР compliance required