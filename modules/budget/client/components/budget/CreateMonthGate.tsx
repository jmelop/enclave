import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from '@venator-ui/ui';
import { useBudgetStore, useCurrentMonth } from '@/store/budgetStore';

interface Props {
  children: ReactNode;
}

export function CreateMonthGate({ children }: Props) {
  const month = useCurrentMonth();
  const createMonth = useBudgetStore(s => s.createMonth);
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createMonth(month.key);
      toast({
        title: `${month.label} ${month.year} created`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Error creating month',
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ opacity: 0.28, pointerEvents: 'none', filter: 'grayscale(0.35)' }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: 48,
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg) 74%, transparent), transparent 60%)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            background: 'var(--bg-2)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.24)',
            pointerEvents: 'auto',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{month.label} {month.year}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 2 }}>
              Recurring costs will be applied
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => void handleCreate()} disabled={creating}>
            <Plus size={14} /> {creating ? 'Creating' : 'Create Month'}
          </button>
        </div>
      </div>
    </div>
  );
}
