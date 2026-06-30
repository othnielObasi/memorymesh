import { Brain, ArrowRight } from 'lucide-react';

const SUGGESTED: Record<string, string[]> = {
  build: [
    'Add user authentication with email and password',
    'Build a REST API for a product catalogue',
    'Refactor the payment module to support Stripe',
  ],
  research: [
    'Compare durable memory approaches for AI agents',
    'Research enterprise adoption risks for autonomous agents',
    'Create a source-backed brief on Cognee and agent memory',
  ],
  support: [
    'Investigate unresolved billing-delay support tickets',
    'Find recurring login failures across open tickets',
    'Resume a ticket investigation from the last checkpoint',
  ],
  ops: [
    'Investigate a failed deployment using prior incident memory',
    'Summarize recent alerts and proposed runbook updates',
    'Recover an interrupted incident response workflow',
  ],
};

const PREVIEW = [
  { op: 'recall',   color: '#22d3ee', text: 'Loaded prior project context — 12 memories' },
  { op: 'remember', color: '#818cf8', text: 'Stored task breakdown and implementation plan' },
  { op: 'improve',  color: '#34d399', text: 'Applied known patterns from previous sessions' },
  { op: 'remember', color: '#818cf8', text: 'Persisted all changes — ready for next session' },
];

interface Props {
  onSuggest: (task: string) => void;
  selectedAgent?: string | null;
}

export function WorkspaceEmptyState({ onSuggest, selectedAgent }: Props) {
  const suggested = SUGGESTED[selectedAgent || 'build'] ?? SUGGESTED.build;

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] px-6 text-center">
      {/* Animated brain icon */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary" style={{ animation: 'np 3s ease-in-out infinite' }} />
        </div>
        {/* Orbiting dot */}
        <div className="absolute inset-0" style={{ animation: 'spin 4s linear infinite' }}>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/60" />
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes np   { 0%,100%{ opacity:.6 } 50%{ opacity:1 } }
        `}</style>
      </div>

      {/* Headline */}
      <h2 className="font-display text-3xl text-foreground mb-2">Ready when you are.</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-10 leading-relaxed">
        Select an agent, describe your task, and click <strong className="text-foreground">Start session</strong> — memory handles the rest.
      </p>

      {/* Suggested tasks */}
      <div className="w-full max-w-md mb-10">
        <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">Try one of these</p>
        <div className="space-y-2">
          {suggested.map(task => (
            <button
              key={task}
              onClick={() => onSuggest(task)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/25 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{task}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* What a session looks like */}
      <div className="w-full max-w-md">
        <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">What happens during a session</p>
        <div className="rounded-xl border border-border bg-card/60 px-5 py-4 space-y-2.5 text-left">
          {PREVIEW.map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-xs" style={{ opacity: 0.5 + i * 0.12 }}>
              <span className="font-mono-ui w-16 shrink-0" style={{ color: p.color }}>{p.op}</span>
              <span className="text-muted-foreground">{p.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
