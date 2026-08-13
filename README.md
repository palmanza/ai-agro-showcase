# Agro IA Connect

Catálogo comunitario de herramientas, servicios y casos de uso de inteligencia artificial aplicados al agro. Pensado como link fijo para un grupo de WhatsApp de productores, asesores y gente del agro que usa (o quiere empezar a usar) IA y automatización.

Cualquiera puede sumar una entrada al catálogo con nombre, empresa, sitio web y una descripción de qué hace. Las entradas nuevas quedan en cola hasta que un administrador las aprueba.

## Stack

- [TanStack Start](https://tanstack.com/start) + React + TypeScript
- [Supabase](https://supabase.com) para datos, auth y RLS
- Construido y mantenido con [Lovable](https://lovable.dev)

## Desarrollo local

Requiere Node.js y [Bun](https://bun.sh).

```sh
git clone git@github.com:palmanza/ai-agro-showcase.git
cd ai-agro-showcase
bun install
bun run dev
```

Variables de entorno necesarias (ver `.env.example` o el proyecto en Supabase): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
