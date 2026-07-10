import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Card } from '@venator-ui/ui';
import { Download, List, Zap, Plus, Upload } from 'lucide-react';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';
import { useToast } from '@venator-ui/ui';
import { fmt, fmt2 } from '@/lib/utils';
import { CATEGORIES } from '@/lib/seed';
import { CategoryGlyph } from '@/components/budget/CategoryGlyph';
import { ConfirmDeleteModal } from '@/components/budget/ConfirmDeleteModal';
import { CreateMonthGate } from '@/components/budget/CreateMonthGate';
import type { CategoryId, Transaction } from '@/types/budget';

interface ExpenseCsvImport {
  name: string
  vendor: string
  amount: number
  cat: CategoryId
  day: number
  rowNumber: number
}

const EXPORT_HEADERS = ['id', 'date', 'day', 'name', 'vendor', 'amount', 'cat', 'source'];

function csvCell(value: string | number | undefined): string {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function dateFromMonthDay(monthKey: string, day: number): string {
  return `${monthKey}-${String(day).padStart(2, '0')}`
}

function exportExpenseCsv(transactions: Transaction[], monthKey: string): string {
  const rows = transactions.map((tx) => [
    tx.id,
    dateFromMonthDay(monthKey, tx.day),
    tx.day,
    tx.name,
    tx.vendor,
    tx.amount.toFixed(2),
    tx.cat,
    tx.recurring ? 'recurring' : 'manual',
  ])

  return [
    EXPORT_HEADERS.join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
  ].join('\n')
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (quoted) throw new Error('Invalid CSV: unclosed quote')
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((value) => value.trim()))
}

function getCsvValue(row: Record<string, string>, names: string[]): string | undefined {
  for (const name of names) {
    const value = row[name]
    if (value?.trim()) return value.trim()
  }
  return undefined
}

function parseCsvAmount(value: string, rowNumber: number): number {
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
  const parsed = Math.abs(Number(normalized))
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Row ${rowNumber}: amount must be greater than 0`)
  }
  return parsed
}

function parseCsvDay(value: string | undefined, selectedMonthKey: string, rowNumber: number): number {
  if (!value) throw new Error(`Row ${rowNumber}: date or day is required`)

  const directDay = Number(value)
  if (Number.isInteger(directDay) && directDay >= 1 && directDay <= 31) return directDay

  const iso = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  const european = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  const year = iso?.[1] ?? european?.[3]
  const month = iso?.[2] ?? european?.[2]
  const day = iso?.[3] ?? european?.[1]

  if (!year || !month || !day) {
    throw new Error(`Row ${rowNumber}: date must be YYYY-MM-DD, DD-MM-YYYY, or day number`)
  }

  const monthKey = `${year}-${month.padStart(2, '0')}`
  if (monthKey !== selectedMonthKey) {
    throw new Error(`Row ${rowNumber}: date must belong to ${selectedMonthKey}`)
  }

  const parsedDay = Number(day)
  if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 31) {
    throw new Error(`Row ${rowNumber}: invalid day`)
  }
  return parsedDay
}

function parseExpenseCsv(text: string, selectedMonthKey: string): ExpenseCsvImport[] {
  const rows = parseCsvRows(text.replace(/^\ufeff/, ''))
  if (rows.length < 2) return []

  const headers = rows[0].map((header) => header.trim().toLowerCase())
  return rows.slice(1).map((cells, index) => {
    const rowNumber = index + 2
    const row = headers.reduce((acc, header, cellIndex) => {
      acc[header] = cells[cellIndex] ?? ''
      return acc
    }, {} as Record<string, string>)

    const name = getCsvValue(row, ['name', 'concept', 'concepto', 'description', 'descripcion', 'merchant'])
    const amount = getCsvValue(row, ['amount', 'importe', 'value', 'valor', 'eur'])
    const day = getCsvValue(row, ['day', 'dia']) ?? getCsvValue(row, ['date', 'fecha', 'operation_date', 'fecha_operacion'])
    const category = getCsvValue(row, ['cat', 'category', 'categoria']) ?? 'other'

    if (!name) throw new Error(`Row ${rowNumber}: name or concept is required`)
    if (!amount) throw new Error(`Row ${rowNumber}: amount is required`)
    if (!CATEGORIES.some((cat) => cat.id === category)) {
      throw new Error(`Row ${rowNumber}: invalid category "${category}"`)
    }

    return {
      name,
      vendor: getCsvValue(row, ['vendor', 'merchant', 'comercio', 'payee']) ?? name,
      amount: parseCsvAmount(amount, rowNumber),
      cat: category as CategoryId,
      day: parseCsvDay(day, selectedMonthKey, rowNumber),
      rowNumber,
    }
  })
}

// ── ExpenseRow ────────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  t: Transaction
  monthLabel: string
  onEdit: (tx: Transaction) => void
  onDelete: (id: string) => Promise<void>
}

function ExpenseRow({ t, monthLabel, onEdit, onDelete }: ExpenseRowProps) {
  const cat = CATEGORIES.find(c => c.id === t.cat)!;
  const [dropOpen, setDropOpen]       = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(t.id);
      setConfirmOpen(false);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error deleting expense',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="expense-row">
      <CategoryGlyph cat={cat} size={28} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t.name}
          {t.recurring && <span className="tag tag-rec">AUTO</span>}
          {t.manual && <span className="tag tag-new">NEW</span>}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 1 }}>{t.vendor || cat.name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <span style={{ width: 7, height: 7, borderRadius: 2, background: cat.color, display: 'inline-block' }} />{cat.name}
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{monthLabel.slice(0, 3)} {t.day}</div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>−{fmt2(t.amount)}</div>

      {/* Actions — dropdown only for manual transactions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {t.manual ? (
          <div ref={dropRef} style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              title="More options"
              onClick={() => setDropOpen(o => !o)}
              style={{ width: 28, padding: 0, fontWeight: 700, fontSize: 15, letterSpacing: 1 }}
            >
              ···
            </button>

            {dropOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                minWidth: 110, zIndex: 10,
                background: 'var(--bg-2)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                padding: '4px 0',
              }}>
                <button
                  onClick={() => { setDropOpen(false); onEdit(t); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 14px', textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--fg-1)', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Edit
                </button>
                <button
                  onClick={() => { setDropOpen(false); setConfirmOpen(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 14px', textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--danger)', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Delete
                </button>
              </div>
            )}

            <ConfirmDeleteModal
              open={confirmOpen}
              itemName={t.name}
              title="Delete expense"
              loading={deleting}
              onConfirm={() => void handleConfirmDelete()}
              onCancel={() => setConfirmOpen(false)}
            />
          </div>
        ) : (
          <span style={{ width: 30 }} />
        )}
      </div>
    </div>
  );
}

// ── ExpensesPage ──────────────────────────────────────────────────────────────

interface Props {
  onAddExpense: () => void;
  onEditExpense: (tx: Transaction) => void;
}

export function ExpensesPage({ onAddExpense, onEditExpense }: Props) {
  const transactions  = useBudgetStore(s => s.transactions);
  const deleteExpense = useBudgetStore(s => s.deleteExpense);
  const addExpense    = useBudgetStore(s => s.addExpense);
  const loading       = useBudgetStore(s => s.loading);
  const error         = useBudgetStore(s => s.error);
  const hydrated      = useBudgetStore(s => s.hydrated);
  const refetch       = useBudgetStore(s => s.refetch);
  const month         = useCurrentMonth();
  const importInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [catFilter, setCatFilter] = useState<CategoryId | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExportCsv = () => {
    if (transactions.length === 0) return;

    const csv = exportExpenseCsv(transactions, month.key);
    const blob = new Blob([`\ufeff${csv}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-expenses-${month.key}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast({
      title: `Exported ${transactions.length} expense${transactions.length === 1 ? '' : 's'}`,
      variant: 'success',
    });
  };

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const imported = parseExpenseCsv(await file.text(), month.key);
      if (imported.length === 0) throw new Error('CSV has no expenses to import');

      let created = 0;
      let skipped = 0;
      const seen = new Set(transactions.map((t) => `${t.day}|${t.name.trim().toLowerCase()}|${t.amount.toFixed(2)}`));

      for (const expense of imported) {
        const duplicateKey = `${expense.day}|${expense.name.trim().toLowerCase()}|${expense.amount.toFixed(2)}`;
        if (seen.has(duplicateKey)) {
          skipped += 1;
          continue;
        }

        try {
          await addExpense({
            name: expense.name,
            vendor: expense.vendor,
            amount: expense.amount,
            cat: expense.cat,
            day: expense.day,
          });
          seen.add(duplicateKey);
          created += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error importing expense';
          throw new Error(`Row ${expense.rowNumber}: ${message}`);
        }
      }

      toast({
        title: `CSV processed: ${created} created, ${skipped} skipped`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error importing CSV',
        variant: 'error',
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  // ── 4 UI states ────────────────────────────────────────────────────────────

  if (loading && !hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--fg-3)' }}>Loading expenses…</div>;
  }

  if (error && !hydrated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh' }}>
        <span style={{ color: 'var(--danger)' }}>Failed to load: {error}</span>
        <button className="btn btn-primary" onClick={() => void refetch()}>Retry</button>
      </div>
    );
  }

  if (hydrated && transactions.length === 0) {
    const emptyState = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '40vh', color: 'var(--fg-3)' }}>
        <span>No expenses this month.</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={onAddExpense}>+ Add your first expense</button>
          <button className="btn btn-secondary" onClick={handleExportCsv} disabled>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={() => importInputRef.current?.click()} disabled={importing}>
            <Upload size={14} /> {importing ? 'Importing' : 'Import CSV'}
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportCsv}
          style={{ display: 'none' }}
        />
      </div>
    );

    return month.created === false ? <CreateMonthGate>{emptyState}</CreateMonthGate> : emptyState;
  }

  // ── Normal state ───────────────────────────────────────────────────────────

  const shown         = catFilter ? transactions.filter(t => t.cat === catFilter) : transactions;
  const manual        = month.extra;
  const variableTotal = transactions.filter(t => !t.recurring).reduce((s, t) => s + t.amount, 0);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-secondary" onClick={handleExportCsv} disabled={transactions.length === 0}>
          <Download size={14} /> Export CSV
        </button>
        <button className="btn btn-secondary" onClick={() => importInputRef.current?.click()} disabled={importing}>
          <Upload size={14} /> {importing ? 'Importing' : 'Import CSV'}
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportCsv}
          style={{ display: 'none' }}
        />
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><List size={14} /></div><span className="stat-label">LOGGED THIS MONTH</span></div>
          <div className="stat-value mono">{transactions.length}</div>
          <div className="stat-sub">{fmt(transactions.reduce((s, t) => s + t.amount, 0))} across all entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Zap size={14} /></div><span className="stat-label">VARIABLE SPENDING</span></div>
          <div className="stat-value mono">{fmt(variableTotal)}</div>
          <div className="stat-sub">Excludes fixed recurring bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-head"><div className="stat-icon"><Plus size={14} /></div><span className="stat-label">ADDED BY YOU</span></div>
          <div className="stat-value mono">{manual.length}</div>
          <div className="stat-sub">
            {manual.length > 0
              ? `${fmt(manual.reduce((s, t) => s + t.amount, 0))} in manual entries`
              : 'Log a purchase to get started'}
          </div>
        </div>
      </div>

      <Card padding="none">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px' }}>All expenses</h3>
            <p className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', margin: 0 }}>{shown.length} shown · {fmt(shown.reduce((s, t) => s + t.amount, 0))}</p>
          </div>
        </div>

        <div style={{ padding: '12px 18px 0' }}>
          <div className="chip-row">
            <button className={`filter-chip ${!catFilter ? 'active' : ''}`} style={!catFilter ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--fg)' } : undefined} onClick={() => setCatFilter(null)}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`filter-chip ${catFilter === c.id ? 'active' : ''}`} style={catFilter === c.id ? { borderColor: c.color, background: c.color + '18', color: 'var(--fg)' } : undefined} onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}>
                <span className="filter-dot" style={{ background: c.color }} />{c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 18px 16px' }}>
          <div className="expense-table" style={{ marginTop: 12 }}>
            <div className="expense-head mono"><span /><span>EXPENSE</span><span>CATEGORY</span><span>DATE</span><span style={{ textAlign: 'right' }}>AMOUNT</span><span /></div>
            <div style={{ maxHeight: 'calc(100vh - 420px)', overflow: 'auto' }}>
              {shown.map(t => (
                <ExpenseRow
                  key={t.id}
                  t={t}
                  monthLabel={month.label}
                  onEdit={onEditExpense}
                  onDelete={deleteExpense}
                />
              ))}
              {shown.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>No expenses in this category yet.</div>}
            </div>
          </div>
        </div>
      </Card>

      <footer className="page-foot mono">
        <span>END · {shown.length} / {transactions.length} entries</span>
        <span className="dim">enclave/budget · build 2026.05</span>
      </footer>
    </div>
  );

  return month.created === false ? <CreateMonthGate>{content}</CreateMonthGate> : content;
}
