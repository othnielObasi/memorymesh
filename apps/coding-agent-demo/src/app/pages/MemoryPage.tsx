import { useEffect, useState } from 'react';
import { ArrowRight, Lock, Cloud, Zap, CheckCircle2, Shield, Eye, Trash2, RefreshCw, GitBranch, AlertCircle, Server } from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

const OPS = [
  {
    op: 'remember',
    color: '#818cf8',
    icon: '→',
    title: 'Store context',
    desc: 'Captures and persists relevant information from the current session. MemoryMesh automatically classifies what is worth keeping — task goals, decisions, patterns, and file structures.',
    triggers: ['Session start', 'Key decision made', 'File structure changes', 'Pattern established', 'Task completed'],
    example: {
      input: 'Agent decides to use Postgres instead of SQLite for the project database.',
      output: 'Stored: { type: "architecture_decision", content: "Using Postgres for persistence layer", rationale: "Need horizontal scale", tags: ["database", "architecture"] }',
    },
  },
  {
    op: 'recall',
    color: '#22d3ee',
    icon: '←',
    title: 'Restore context',
    desc: 'Retrieves relevant memories to reconstruct full session context. At session start, recall loads everything the agent needs to continue without re-explanation.',
    triggers: ['New session starts', 'Context window limit reached', 'Agent requests prior context', 'Task resumes after pause'],
    example: {
      input: 'New session begins. Agent needs context from last time.',
      output: 'Recalled: 14 memories — project structure, 3 architecture decisions, 2 in-progress tasks, known patterns, dependency graph.',
    },
  },
  {
    op: 'improve',
    color: '#34d399',
    icon: '↑',
    title: 'Refine memory',
    desc: 'Updates existing memories based on new information. When a decision changes, a pattern evolves, or a better approach is found, improve replaces stale memory with accurate context.',
    triggers: ['Decision reversed', 'Better pattern found', 'Bug fixed and root cause understood', 'Architecture evolved', 'Session end cleanup'],
    example: {
      input: 'Auth approach changed from JWT to session cookies after security review.',
      output: 'Updated: auth_pattern memory — replaced "JWT tokens" with "session cookies (HttpOnly)", added security rationale tag.',
    },
  },
  {
    op: 'forget',
    color: '#f87171',
    icon: '✕',
    title: 'Remove stale data',
    desc: 'Expires or removes memories that are no longer accurate. Keeps the memory graph clean so recall is precise — not polluted with outdated or contradictory information.',
    triggers: ['Retention period expires', 'Memory contradicted by newer fact', 'Task fully completed and archived', 'Explicit agent request'],
    example: {
      input: 'Deprecated API endpoint /v1/users removed from codebase.',
      output: 'Forgotten: 3 memories referencing /v1/users endpoint — removed from graph to prevent stale recall.',
    },
  },
];

const LOCATIONS = [
  {
    backend: 'local_cognee',
    icon: Lock,
    color: '#34d399',
    label: 'Private',
    title: 'Local memory',
    sub: 'Self-hosted Cognee',
    desc: 'Run Cognee on your own servers. Memory never leaves your infrastructure. Full control over retention, access, and deletion.',
    pros: ['Complete data sovereignty', 'No third-party data access', 'Custom retention policies', 'Offline capable', 'Open-source engine'],
    cons: ['Requires infrastructure setup', 'You manage backups', 'Local network dependency'],
    best: 'Teams with strict data residency requirements or handling sensitive IP.',
  },
  {
    backend: 'cognee_cloud',
    icon: Cloud,
    color: '#818cf8',
    label: 'Recommended',
    title: 'Cloud memory',
    sub: 'Managed Cognee Cloud',
    desc: 'We manage Cognee for you. Zero infrastructure, automatic failover, and global edge availability.',
    pros: ['Zero ops burden', 'Automatic backups', 'Global availability', 'Instant setup', '99.9% uptime SLA'],
    cons: ['Data stored on our servers', 'Requires internet connection', 'Usage-based pricing'],
    best: 'Individuals and teams who want reliability without infrastructure management.',
  },
  {
    backend: 'offline_mirror',
    icon: Zap,
    color: '#22d3ee',
    label: 'Try it now',
    title: 'Demo memory',
    sub: 'Temporary preview',
    desc: 'Ephemeral in-browser memory for exploring the workspace. No setup, no account, no persistence between sessions.',
    pros: ['Works immediately', 'No account needed', 'Pre-seeded sample data', 'Safe to experiment'],
    cons: ['Cleared on session end', 'Not for real work', 'No cross-device access'],
    best: 'First-time users evaluating MemoryMesh before committing to a memory location.',
  },
];

type MemoryStatus = {
  backend: string;
  provider: string;
  ready: boolean;
  mode: string;
  service_url_configured: boolean;
  api_key_configured: boolean;
  fallback_allowed: boolean;
  import_error?: string | null;
  notes?: string[];
};

type MemoryEvent = {
  id: string;
  operation: string;
  provider: string;
  backend: string;
  dataset: string;
  session_id?: string | null;
  status: string;
  fallback_used: boolean;
  error?: string | null;
  text_preview: string;
  created_at?: string;
};

const resolveApiBase = () => {
  if (import.meta.env.VITE_MEMORYMESH_API_BASE_URL) {
    return import.meta.env.VITE_MEMORYMESH_API_BASE_URL;
  }
  if (window.location.protocol === 'file:') {
    return 'http://127.0.0.1:8000';
  }
  if (['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '8000') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return window.location.origin;
};

const API_BASE =
  resolveApiBase();

export function MemoryPage({ onNavigate, onEnterWorkspace }: Props) {
  const [activeOp, setActiveOp] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, MemoryStatus>>({});
  const [events, setEvents] = useState<MemoryEvent[]>([]);
  const [loadingConsole, setLoadingConsole] = useState(false);
  const [consoleError, setConsoleError] = useState<string | null>(null);

  const refreshMemoryConsole = async () => {
    setLoadingConsole(true);
    setConsoleError(null);
    try {
      const [local, cloud, demo, eventResponse] = await Promise.all([
        fetch(`${API_BASE}/api/memory/status?backend=local_cognee&probe=true`).then(r => r.json()),
        fetch(`${API_BASE}/api/memory/status?backend=cognee_cloud&probe=true`).then(r => r.json()),
        fetch(`${API_BASE}/api/memory/status?backend=offline_mirror&probe=true`).then(r => r.json()),
        fetch(`${API_BASE}/api/memory/events?backend=local_cognee&limit=8`).then(r => r.json()),
      ]);
      setStatuses({ local_cognee: local, cognee_cloud: cloud, offline_mirror: demo });
      setEvents(eventResponse.events || []);
    } catch (error) {
      setConsoleError(error instanceof Error ? error.message : 'Could not reach the MemoryMesh API.');
    } finally {
      setLoadingConsole(false);
    }
  };

  useEffect(() => {
    refreshMemoryConsole();
  }, []);

  const statusLabel = (status?: MemoryStatus) => {
    if (!status) return { text: 'checking', cls: 'text-muted-foreground border-border bg-muted/20' };
    if (status.ready) return { text: 'available', cls: 'text-green-400 border-green-400/25 bg-green-400/10' };
    return { text: 'needs setup', cls: 'text-amber-300 border-amber-300/25 bg-amber-300/10' };
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 30%, rgba(52,211,153,0.05) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Memory</p>
          <h1 className="font-display text-5xl md:text-6xl text-foreground leading-tight mb-6">
            How memory works<br />
            <span className="italic" style={{ color: '#34d399' }}>under the hood.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            MemoryMesh uses Cognee to build a structured knowledge graph of your agent's work — not a flat conversation log. Here's exactly how it works.
          </p>
        </div>
      </section>

      {/* Knowledge graph concept */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Memory model</p>
              <h2 className="font-display text-4xl text-foreground mb-5">
                A knowledge graph,<br />
                <span className="italic">not a conversation log.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Most memory systems store raw conversation history and search it with embeddings. This is slow, imprecise, and scales poorly.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                MemoryMesh uses Cognee to build a <strong className="text-foreground">structured knowledge graph</strong> — entities, relationships, and typed facts that can be queried precisely, merged intelligently, and pruned cleanly.
              </p>
              <div className="space-y-3">
                {[
                  { icon: RefreshCw, text: 'Recall is precise — graph traversal, not fuzzy embedding search' },
                  { icon: GitBranch, text: 'Relationships between memories are explicit and queryable' },
                  { icon: Shield,    text: 'Contradictions are detected — not silently overwritten' },
                  { icon: Trash2,    text: 'Pruning is surgical — remove one node, not a blob of text' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Graph visualization */}
            <div className="rounded-2xl border border-border bg-card p-8 font-mono-ui">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6 text-center">Memory graph — example</p>
              <div className="space-y-2 text-xs">
                {[
                  { indent: 0, color: '#818cf8', text: '◉ Project: MemoryMesh workspace', type: 'entity' },
                  { indent: 1, color: '#22d3ee', text: '├─ uses: Cognee (knowledge graph engine)', type: 'relation' },
                  { indent: 1, color: '#22d3ee', text: '├─ stack: React + TypeScript + Tailwind', type: 'fact' },
                  { indent: 1, color: '#34d399', text: '├─ decision: "Indigo primary over blue"', type: 'decision' },
                  { indent: 2, color: '#5a6a8a', text: '│   rationale: "More distinctive for AI infra"', type: 'meta' },
                  { indent: 1, color: '#22d3ee', text: '├─ in-progress: "Landing page redesign"', type: 'task' },
                  { indent: 2, color: '#5a6a8a', text: '│   status: active · session: 4', type: 'meta' },
                  { indent: 1, color: '#34d399', text: '├─ pattern: "font-display for headings"', type: 'pattern' },
                  { indent: 1, color: '#f87171', text: '└─ expired: old gray-50 background token', type: 'forgotten' },
                ].map((node, i) => (
                  <div key={i} className="flex items-baseline gap-0" style={{ paddingLeft: `${node.indent * 16}px` }}>
                    <span style={{ color: node.color }}>{node.text}</span>
                    <span className="ml-auto text-muted-foreground/40 text-xs shrink-0 pl-3">{node.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Memory operations — interactive */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Four operations</p>
            <h2 className="font-display text-4xl text-foreground">Every memory action, explained.</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Op selector */}
            <div className="space-y-2">
              {OPS.map((op, i) => (
                <button
                  key={op.op}
                  onClick={() => setActiveOp(i)}
                  className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
                    activeOp === i
                      ? 'border-primary/25 bg-primary/5'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono-ui text-base"
                      style={{ color: op.color }}
                    >
                      {op.icon}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-foreground">{op.op}</p>
                      <p className="text-xs text-muted-foreground">{op.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Op detail */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-7">
              {(() => {
                const op = OPS[activeOp];
                return (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <span
                        className="font-mono-ui text-sm font-medium px-3 py-1 rounded-full"
                        style={{ color: op.color, background: `${op.color}15`, border: `1px solid ${op.color}30` }}
                      >
                        {op.op}
                      </span>
                      <span className="text-foreground font-semibold">{op.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">{op.desc}</p>

                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-2">Triggers</p>
                        <ul className="space-y-1.5">
                          {op.triggers.map(t => (
                            <li key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: op.color }} />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-2">Example input</p>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border">
                          {op.example.input}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-2">Memory output</p>
                      <pre className="text-xs font-mono-ui text-muted-foreground/80 bg-muted/30 rounded-lg p-3 border border-border overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {op.example.output}
                      </pre>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Local/self-hosted console */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
            <div>
              <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Local console</p>
              <h2 className="font-display text-4xl text-foreground mb-3">Self-hosted memory, visible.</h2>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                MemoryMesh turns local Cognee into a work-memory console: status, fallback state, recent operations, and recovery proof.
              </p>
            </div>
            <button
              onClick={refreshMemoryConsole}
              className="inline-flex items-center gap-2 text-sm text-foreground border border-border px-4 py-2.5 rounded-lg hover:bg-muted/30 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConsole ? 'animate-spin' : ''}`} />
              Refresh status
            </button>
          </div>

          {consoleError && (
            <div className="mb-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{consoleError}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl border border-green-400/25 bg-green-400/10 flex items-center justify-center">
                  <Server className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Runtime readiness</h3>
                  <p className="text-xs text-muted-foreground">Live probe from the MemoryMesh API</p>
                </div>
              </div>

              <div className="space-y-3">
                {LOCATIONS.map((loc) => {
                  const status = statuses[loc.backend];
                  const label = statusLabel(status);
                  return (
                    <div key={loc.backend} className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{loc.title}</p>
                          <p className="text-xs text-muted-foreground">{status?.provider || loc.sub}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${label.cls}`}>{label.text}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                        {status?.notes?.[0] || 'Waiting for backend status.'}
                      </p>
                      {status?.import_error && (
                        <p className="text-xs text-amber-200 mt-2 leading-relaxed">{status.import_error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-semibold text-foreground">Recent local memory activity</h3>
                  <p className="text-xs text-muted-foreground">Operations recorded from local_cognee runs</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono-ui">{events.length} events</span>
              </div>

              <div className="space-y-2.5 max-h-[430px] overflow-auto hide-scrollbar">
                {events.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <p className="text-sm text-foreground mb-1">No local memory events yet.</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Run an agent with Private local memory selected. The console will show remember, recall, improve, and forget events here.
                    </p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono-ui text-primary">{event.operation}</span>
                          <span className="text-xs text-muted-foreground">{event.status}</span>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          event.fallback_used
                            ? 'text-amber-300 border-amber-300/25 bg-amber-300/10'
                            : 'text-green-400 border-green-400/25 bg-green-400/10'
                        }`}>
                          {event.fallback_used ? 'fallback' : 'local Cognee'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{event.text_preview}</p>
                      <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-muted-foreground font-mono-ui">
                        <span>{event.dataset}</span>
                        {event.session_id && <span>session:{event.session_id}</span>}
                        {event.error && <span className="text-amber-200">error:{event.error}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Memory locations — deep comparison */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Memory location</p>
            <h2 className="font-display text-4xl text-foreground mb-3">Where does memory live?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Choose the memory backend that matches your privacy requirements and operational preferences.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {LOCATIONS.map(loc => (
              <div key={loc.title} className="rounded-2xl border border-border bg-card p-7 flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl border flex items-center justify-center"
                    style={{ background: `${loc.color}15`, borderColor: `${loc.color}30` }}>
                    <loc.icon className="w-5 h-5" style={{ color: loc.color }} />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ color: loc.color, background: `${loc.color}15`, border: `1px solid ${loc.color}25` }}>
                    {loc.label}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-0.5">{loc.title}</h3>
                <p className="text-xs font-mono-ui text-muted-foreground mb-3">{loc.sub}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{loc.desc}</p>

                <div className="mb-5 flex-1">
                  <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-2">Pros</p>
                  <ul className="space-y-1.5 mb-4">
                    {loc.pros.map(p => (
                      <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: loc.color }} />{p}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-2">Cons</p>
                  <ul className="space-y-1.5 mb-4">
                    {loc.cons.map(c => (
                      <li key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-3 h-3 shrink-0 flex items-center justify-center">
                          <div className="w-1.5 h-px bg-muted-foreground/40" />
                        </div>{c}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg bg-muted/30 border border-border p-3">
                    <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-1">Best for</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{loc.best}</p>
                  </div>
                </div>

                <button onClick={onEnterWorkspace}
                  className="w-full py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-all">
                  Try with {loc.title.split(' ')[0].toLowerCase()} memory
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Privacy & control</p>
                <h2 className="font-display text-3xl text-foreground mb-4">Your memory, your rules.</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We designed MemoryMesh with privacy as a first-class requirement — not an afterthought. You always have full control over what is stored, where it lives, and how long it persists.
                </p>
                <button onClick={() => onNavigate('docs')}
                  className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/8 transition-all">
                  Privacy documentation <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Shield, text: 'Self-host option gives total data sovereignty', color: '#34d399' },
                  { icon: Eye,    text: 'Full audit log of every memory operation', color: '#818cf8' },
                  { icon: Trash2, text: 'Delete any memory or your entire history instantly', color: '#f87171' },
                  { icon: Lock,   text: 'Cloud memory encrypted at rest and in transit', color: '#22d3ee' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
