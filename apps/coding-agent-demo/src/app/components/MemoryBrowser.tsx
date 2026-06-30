import { Brain, Eye, TrendingUp, Trash2, Database } from 'lucide-react';
import type { MemoryActivity } from '../App';

interface Props {
  activity: MemoryActivity[];
  memoryLocation: 'local' | 'cloud' | 'demo';
  isActive: boolean;
}

const OP_ICON = { remember: Brain, recall: Eye, improve: TrendingUp, forget: Trash2 };
const OP_COLOR: Record<string, string> = {
  remember: '#818cf8',
  recall:   '#22d3ee',
  improve:  '#34d399',
  forget:   '#5a6a8a',
};
const OP_BG: Record<string, string> = {
  remember: 'bg-primary/10',
  recall:   'bg-cyan-400/10',
  improve:  'bg-green-400/10',
  forget:   'bg-muted/40',
};

// Derive a short label from the description
function shortLabel(description: string): string {
  return description.replace(/^(Stored|Loaded|Retrieved|Recalled|Applied|Refined|Updated|Removed|Persisted|Expired):\s*/i, '').split('—')[0].split('.')[0].trim().slice(0, 52);
}

// Group by operation type
const GROUPS: { type: MemoryActivity['type']; label: string }[] = [
  { type: 'remember', label: 'Stored'   },
  { type: 'recall',   label: 'Recalled' },
  { type: 'improve',  label: 'Refined'  },
  { type: 'forget',   label: 'Removed'  },
];

const LOCATION_LABEL: Record<string, string> = {
  local: 'Local · private',
  cloud: 'Cloud · managed',
  demo:  'Demo · temporary',
};
const LOCATION_DOT: Record<string, string> = {
  local: 'bg-green-400',
  cloud: 'bg-primary',
  demo:  'bg-cyan-400',
};

export function MemoryBrowser({ activity, memoryLocation, isActive }: Props) {
  const counts = GROUPS.reduce<Record<string, number>>((acc, g) => {
    acc[g.type] = activity.filter(a => a.type === g.type).length;
    return acc;
  }, {});
  const total = activity.length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Memory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${LOCATION_DOT[memoryLocation]} ${isActive ? 'animate-pulse' : ''}`} />
          <span className="text-xs text-muted-foreground">{LOCATION_LABEL[memoryLocation]}</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 border-b border-border">
        {GROUPS.map(g => {
          const Icon = OP_ICON[g.type];
          return (
            <div key={g.type} className="flex flex-col items-center py-3 border-r border-border last:border-0">
              <Icon className="w-3.5 h-3.5 mb-1" style={{ color: OP_COLOR[g.type] }} />
              <span className="text-base font-semibold text-foreground tabular-nums">{counts[g.type]}</span>
              <span className="text-xs text-muted-foreground">{g.label}</span>
            </div>
          );
        })}
      </div>

      {/* Memory nodes */}
      <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
        {total === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">No memory yet.</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Start a session to see what gets stored.</p>
          </div>
        ) : (
          activity
            .filter(a => a.type !== 'forget')
            .slice()
            .reverse()
            .map((a, i) => {
              const Icon = OP_ICON[a.type];
              return (
                <div key={a.id}
                  className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/20 transition-colors group"
                  style={{ animation: i === 0 ? 'fadeInUp .2s ease-out' : 'none' }}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${OP_BG[a.type]}`}>
                    <Icon className="w-3 h-3" style={{ color: OP_COLOR[a.type] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 leading-tight truncate">{shortLabel(a.description)}</p>
                    <p className="text-xs text-muted-foreground/50 font-mono-ui mt-0.5">{a.timestamp}</p>
                  </div>
                </div>
              );
            })
        )}

        {/* Forgotten items */}
        {activity.filter(a => a.type === 'forget').map(a => (
          <div key={a.id} className="flex items-start gap-2.5 px-2.5 py-2 opacity-40">
            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 bg-muted/40">
              <Trash2 className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground line-through leading-tight truncate">{shortLabel(a.description)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {total > 0 && (
        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{total} memory operations</span>
          {isActive && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary">Writing</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
