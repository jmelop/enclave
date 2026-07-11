// Content-only component: topbar + hero + routing.
// No AppShell/EnclaveNav — used by both:
//   • standalone:  App.tsx wraps this with AppShell
//   • dashboard:   client.config.tsx routes expose this directly
import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { OverviewPage } from '@/pages/OverviewPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { IncomePage } from '@/pages/IncomePage';
import { RecurringPage } from '@/pages/RecurringPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { AddExpenseModal } from '@/components/budget/AddExpenseModal';
import { AddIncomeModal } from '@/components/budget/AddIncomeModal';
import { RecurringModal } from '@/components/budget/RecurringModal';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import type { CategoryId, IncomeEntry, Transaction, RecurringBill } from '@/types/budget';

const SECTION_LABELS: Record<string, string> = {
  '': 'overview',
  'expenses': 'expenses',
  'income': 'income',
  'recurring': 'recurring',
  'history': 'history',
  'categories': 'categories',
};

type HeroAction = 'expense' | 'income' | 'recurring'

const HERO_BTN: Record<string, { label: string; action: HeroAction }> = {
  'overview':   { label: 'Add expense',   action: 'expense'   },
  'expenses':   { label: 'Add expense',   action: 'expense'   },
  'income':     { label: 'Add income',    action: 'income'    },
  'recurring':  { label: 'Add recurring', action: 'recurring' },
  'history':    { label: 'Add expense',   action: 'expense'   },
  'categories': { label: 'Add expense',   action: 'expense'   },
}

// Discriminated state for add vs edit modal — edit carries the source transaction.
type ExpenseModalState =
  | { mode: 'add' }
  | { mode: 'edit'; tx: Transaction }
  | null

type IncomeModalState =
  | { mode: 'add' }
  | { mode: 'edit'; entry: IncomeEntry }
  | null

export default function BudgetApp() {
  const [theme, setTheme] = useState<string>(
    () => document.documentElement.getAttribute('data-theme') ?? 'dark',
  );
  const [expenseModal, setExpenseModal]         = useState<ExpenseModalState>(null);
  const [incomeModal, setIncomeModal]           = useState<IncomeModalState>(null);
  const [addRecurringOpen, setAddRecurringOpen] = useState(false);

  const hydrate       = useBudgetStore(s => s.hydrate);
  const addExpense    = useBudgetStore(s => s.addExpense);
  const updateExpense = useBudgetStore(s => s.updateExpense);
  const addIncome     = useBudgetStore(s => s.addIncome);
  const updateIncome  = useBudgetStore(s => s.updateIncome);
  const addRecurring  = useBudgetStore(s => s.addRecurring);
  const months        = useBudgetStore(s => s.months);
  const monthIndex    = useBudgetStore(s => s.monthIndex);
  const setMonthIndex = useBudgetStore(s => s.setMonthIndex);
  const month         = useCurrentMonth();
  const location      = useLocation();

  useEffect(() => { void hydrate() }, [hydrate]);

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('enclave-theme', next);
      return next;
    });
  }, []);

  const sectionLabel = (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === 'budget') return 'overview';
    return SECTION_LABELS[last] ?? last;
  })();

  const heroBtnDef = HERO_BTN[sectionLabel] ?? { label: 'Add expense', action: 'expense' as HeroAction };
  const expenseActionsLocked = heroBtnDef.action !== 'recurring' && month.created === false;

  const handleHeroBtn = () => {
    if (expenseActionsLocked) return;
    if (heroBtnDef.action === 'recurring') setAddRecurringOpen(true);
    else if (heroBtnDef.action === 'income') setIncomeModal({ mode: 'add' });
    else setExpenseModal({ mode: 'add' });
  };

  const handleExpenseModalSave = (
    name: string,
    amount: number,
    cat: CategoryId,
    day: number,
  ) => {
    if (expenseModal?.mode === 'edit') {
      void updateExpense(expenseModal.tx.id, {
        name, vendor: expenseModal.tx.vendor || name, amount, cat, day,
      });
    } else {
      void addExpense({ name, vendor: name, amount, cat, day, recurring: false });
    }
    setExpenseModal(null);
  };

  const handleIncomeModalSave = (
    name: string,
    source: string,
    amount: number,
    day: number,
  ) => {
    if (incomeModal?.mode === 'edit') {
      void updateIncome(incomeModal.entry.id, { name, source, amount, day });
    } else {
      void addIncome({ name, source, amount, day });
    }
    setIncomeModal(null);
  };

  return (
    <>
      <div className="canvas with-grid">
        {/* v-topbar */}
        <div className="v-topbar">
          <span className="crumb">enclave</span>
          <span className="sep">/</span>
          <span className="crumb">budget</span>
          <span className="sep">/</span>
          <span className="crumb active">{sectionLabel}</span>
          <span className="v-cursor">▊</span>
          <span className="spacer" />
          <button
            className="icon-btn"
            style={{ border: 'none' }}
            disabled={monthIndex === 0}
            onClick={() => void setMonthIndex(Math.max(0, monthIndex - 1))}
            title="Previous month"
          >
            ‹
          </button>
          <span className="pill" style={{ minWidth: 112, justifyContent: 'center', display: 'inline-flex', gap: 4 }}>
            <span style={{ color: 'var(--fg-3)' }}>📅</span>
            <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{month.label} {month.year}</span>
          </span>
          <button
            className="icon-btn"
            style={{ border: 'none' }}
            disabled={monthIndex === months.length - 1}
            onClick={() => void setMonthIndex(Math.min(months.length - 1, monthIndex + 1))}
            title="Next month"
          >
            ›
          </button>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <span className="pill"><span className="dot" />synced</span>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
          <span style={{ color: 'var(--fg-5)' }}>·</span>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            style={{ appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="3.5" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z" />
              </svg>
            )}
          </button>
        </div>

        {/* page hero */}
        <header className="hero">
          <div className="hero-tag mono">// MODULE · enclave-budget</div>
          <div className="hero-row">
            <h1 className="hero-title">Budget<span className="hero-dot">.</span></h1>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={handleHeroBtn}
                disabled={expenseActionsLocked}
                title={expenseActionsLocked ? 'Create this month first' : undefined}
              >
                + {heroBtnDef.label}
              </button>
            </div>
          </div>
          <div className="hero-sub">
            Track spending, manage recurring bills, and stay on budget month over month.
          </div>
        </header>

        <Routes>
          <Route index element={<OverviewPage onAddExpense={() => setExpenseModal({ mode: 'add' })} />} />
          <Route
            path="expenses"
            element={
              <ExpensesPage
                onAddExpense={() => setExpenseModal({ mode: 'add' })}
                onEditExpense={tx => setExpenseModal({ mode: 'edit', tx })}
              />
            }
          />
          <Route
            path="income"
            element={
              <IncomePage
                onAddIncome={() => setIncomeModal({ mode: 'add' })}
                onEditIncome={entry => setIncomeModal({ mode: 'edit', entry })}
              />
            }
          />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="categories" element={<CategoriesPage />} />
        </Routes>
      </div>

      {expenseModal && (
        <AddExpenseModal
          month={month}
          initial={expenseModal.mode === 'edit' ? expenseModal.tx : undefined}
          onClose={() => setExpenseModal(null)}
          onSave={handleExpenseModalSave}
        />
      )}

      {incomeModal && (
        <AddIncomeModal
          month={month}
          initial={incomeModal.mode === 'edit' ? incomeModal.entry : undefined}
          onClose={() => setIncomeModal(null)}
          onSave={handleIncomeModalSave}
        />
      )}

      {addRecurringOpen && (
        <RecurringModal
          onClose={() => setAddRecurringOpen(false)}
          onSave={(r: Omit<RecurringBill, 'id'> & { id?: string }) => {
            const { id: _id, ...rest } = r;
            void addRecurring(rest);
            setAddRecurringOpen(false);
          }}
        />
      )}
    </>
  );
}
