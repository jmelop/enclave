# Enclave

A self-hosted personal ops dashboard — a modular app launcher built with Vite + React, TypeScript, Tailwind v4, and [Venator UI](https://venatorui.com).

Centralizes tools, services, and automations from a single interface with an amber CRT terminal aesthetic.

## Stack

- **Vite + React + React Router** + TypeScript
- **Tailwind v4**
- **Venator UI** — `@venator-ui/ui`, `@venator-ui/patterns`, `@venator-ui/tokens`
- **Lucide React** — icons

## Getting started

```bash
npm install
npm run dev
```

## Configuration

App URLs are not hardcoded. Copy `.env.example` to `.env.local` and fill in your addresses:

```bash
cp .env.example .env.local
```

```bash
# Example
VITE_PORTFOLIO_URL=http://192.168.1.x:8082
VITE_CALENDAR_URL=https://www.icloud.com/calendar
```

Then update the `url` fields in `lib/apps-data.ts` accordingly.

## Adding an app

**Enclave modules** appear in the portal automatically: every module registered
in `enclave.modules.client.ts` gets a card. Card metadata (codename, description,
category, icon…) is declared in the module's `client.config` via the optional
`portal` field — missing fields fall back to sensible defaults.

```ts
// modules/my-module/module/client.config.tsx
export const myModuleClient: ModuleClientConfig = {
  // ...
  portal: {
    codename: "CODENAME",
    description: "What this module does.",
    category: "utilities",
    icon: "Wrench",
  },
};
```

**External apps** (not served by the shell, opened in a new tab) are added
manually to the `EXTERNAL_APPS` array in `lib/apps-data.ts`:

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
  url: import.meta.env.VITE_MY_APP_URL,
}
```