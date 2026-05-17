# Community Safety Tip and Missing Persons App

Production-minded hackathon build for the Lumbini Province Police "Hack for Safety" theme.

## Apps

- `backend`: Express + TypeScript API with Prisma, JWT auth, anonymous token hashing, RBAC, validation, audit logging, rate limiting, and media upload pipeline scaffolding.
- `apps/dashboard`: React + Vite police dashboard for officers, supervisors, and admins.
- `apps/mobile`: Expo citizen app for anonymous reporting, tracking, and missing persons.
- `infra`: Docker Compose, Nginx, and environment examples.

## Quick Start

```bash
npm install
cp infra/.env.example .env
docker compose -f infra/docker-compose.yml --env-file .env up -d postgres redis minio
npm run prisma:migrate -w backend
npm run seed -w backend
npm run dev:backend
```

In another terminal:

```bash
npm run dev:dashboard
```

Demo admin credentials after seeding:

- Badge: `ADMIN-001`
- Password: `ChangeMe123!`

## Security Rules

1. Citizen reports never store names, phone numbers, device IDs, or IP addresses.
2. Anonymous tokens are stored as SHA-256 hashes only.
3. Every API input is validated with Zod before reaching service logic.
4. Every officer read/write action is written to `AuditLog`.
5. Media uploads are stripped of image metadata before object storage.
