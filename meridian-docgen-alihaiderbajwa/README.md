# Meridian DocGen web application

The Next.js 16 application for Meridian DocGen. Project architecture,
Supabase rebuild instructions, demo accounts, and environment-variable setup
are documented in the [repository README](../README.md).

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

After adding the Supabase project URL and publishable key to `.env.local`, open
http://localhost:3000.

## Verification

```bash
npm test
npm run lint
npm run build
```
