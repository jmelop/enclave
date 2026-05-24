# Enclave

A self-hosted personal ops dashboard — a modular app launcher built with Next.js, TypeScript, Tailwind v4, and [Venator UI](https://venatorui.com).

Centralizes tools, services, and automations from a single interface with an amber CRT terminal aesthetic.

## Stack

- **Next.js 16** + TypeScript
- **Tailwind v4**
- **Venator UI** — `@venator-ui/ui`, `@venator-ui/patterns`, `@venator-ui/tokens`
- **Lucide React** — icons

## Getting started

```bash
npm install
npm run dev
```

## Configuration

App URLs are not hardcoded. Configure them in `.env.local`:

```bash
# Example
NEXT_PUBLIC_PORTFOLIO_URL=http://192.168.1.x:8082
NEXT_PUBLIC_CALENDAR_URL=https://www.icloud.com/calendar
```

Then update the `url` fields in `lib/apps-data.ts` accordingly.

## Adding an app

Edit `lib/apps-data.ts` and add an entry to the `APPS` array. No UI changes needed.

```ts
{
  id: "my-app",
  name: "My App",
  codename: "CODENAME",
  description: "What this app does.",
  category: "utilities",
  status: "online",
  port: 3000,
  version: "1.0.0",
  lastAccess: "2026-01-01 00:00:00",
  clearanceLevel: 1,
  icon: "Wrench",
  url: process.env.NEXT_PUBLIC_MY_APP_URL,
}
```