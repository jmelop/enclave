// Standalone-dev registry stub.
// vite.config.ts redirects `enclave.modules.client` here so the dev server
// doesn't import every other module's source (inventory, portfolio, workout),
// which would make their `@/` imports resolve against budget's client dir.
export const clientModules = [
  {
    id: 'budget',
    navLabel: 'Budget',
    basePath: '/budget',
    nav: [
      { label: 'Overview',   path: '',           icon: 'layout-dashboard' },
      { label: 'Expenses',   path: 'expenses',   icon: 'receipt'          },
      { label: 'Recurring',  path: 'recurring',  icon: 'calendar-days'    },
      { label: 'History',    path: 'history',    icon: 'bar-chart-2'      },
      { label: 'Categories', path: 'categories', icon: 'pie-chart'        },
    ],
    accent: 'linear-gradient(135deg, #f59e0b, #fb923c)',
    routes: [],
  },
]
