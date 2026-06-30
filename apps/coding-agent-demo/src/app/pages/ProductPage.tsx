import { ArrowRight, Brain, RefreshCw, Database, Zap, Lock, Globe, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

const OPS = [
  { op: 'remember', color: '#818cf8', desc: 'Captures context, decisions, and state from the current session into long-term memory.', example: 'Stored: component structure, routing decisions, dependency choices' },
  { op: 'recall',   color: '#22d3ee', desc: 'Retrieves relevant memories at session start or on demand to restore full context.', example: 'Loaded: previous task state, known patterns, file map' },
  { op: 'improve',  color: '#34d399', desc: 'Refines existing memories based on new information — so memory gets smarter over time.', example: 'Updated: auth pattern now uses JWT instead of session cookies' },
  { op: 'forget',   color: '#f87171', desc: 'Expires or removes stale memories to keep the graph clean and recall precise.', example: 'Removed: deprecated API endpoints, resolved bugs' },
];

const ARCH_STEPS = [
  { label: 'Your agent', sub: 'Cursor / Claude Code / Codex / custom', color: '#818cf8' },
  { label: 'MemoryMesh', sub: 'MCP server / REST API / SDK', color: '#22d3ee' },
  { label: 'Cognee graph', sub: 'Knowledge graph · structured memory', color: '#34d399' },
];

export function ProductPage({ onNavigate, onEnterWorkspace }: Props) {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="px-6 py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 30%, rgba(129,140,248,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Product</p>
          <h1 className="font-display text-5xl md:text-7xl text-foreground leading-tight mb-6">
            The complete memory layer<br />
            <span className="italic" style={{ color: '#818cf8' }}>for AI agents.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            AI agents are powerful but stateless. Every session starts from scratch — no memory of what happened, what was decided, or what was built. MemoryMesh fixes that.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={onEnterWorkspace}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm">
              Try the workspace <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('pricing')}
              className="text-sm text-muted-foreground border border-border px-6 py-3 rounded-lg hover:text-foreground hover:border-foreground/15 transition-all">
              See pricing
            </button>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Without MemoryMesh</span>
              </div>
              <ul className="space-y-4">
                {[
                  'Agent starts every session with zero context',
                  'You re-explain the codebase each time',
                  'Decisions made last week are unknown today',
                  'Work is duplicated across sessions',
                  'Context window fills with re-orientation prompts',
                  'Agent makes the same mistakes repeatedly',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400/50 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* With */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">With MemoryMesh</span>
              </div>
              <ul className="space-y-4">
                {[
                  'Agent recalls full project context on startup',
                  'Previous decisions, patterns, and files are loaded',
                  'Work resumes exactly where it left off',
                  'Each session builds on the last',
                  'Context window used for actual work',
                  'Agent learns from past sessions and improves',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Memory operations */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Memory operations</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">Four operations. Infinite memory.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              MemoryMesh exposes four core operations that run automatically during every agent session.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {OPS.map(op => (
              <div key={op.op} className="rounded-xl border border-border bg-card p-6 group hover:border-border/80 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="font-mono-ui text-sm font-medium px-3 py-1 rounded-full"
                    style={{ color: op.color, background: `${op.color}15`, border: `1px solid ${op.color}30` }}
                  >
                    {op.op}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{op.desc}</p>
                <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 font-mono-ui text-xs text-muted-foreground/70">
                  {op.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Architecture</p>
              <h2 className="font-display text-4xl text-foreground mb-5">
                A thin, transparent layer<br />
                <span className="italic">between agent and memory.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                MemoryMesh sits between your agent and a Cognee knowledge graph. It intercepts session events, classifies them, and manages memory operations automatically — no prompt changes needed.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Zero changes to your existing agent prompts',
                  'Memory operations happen in the background',
                  'Cognee graph provides structured, queryable memory',
                  'Full observability — every memory event is logged',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => onNavigate('memory')}
                className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 px-5 py-2.5 rounded-lg hover:bg-primary/8 transition-all">
                Deep-dive into memory <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Architecture diagram */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-8 text-center">System architecture</p>
              <div className="space-y-3">
                {ARCH_STEPS.map((step, i) => (
                  <div key={step.label}>
                    <div
                      className="rounded-xl border p-4 flex items-center gap-4"
                      style={{ borderColor: `${step.color}25`, background: `${step.color}08` }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono-ui text-xs font-bold"
                        style={{ background: `${step.color}20`, color: step.color }}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.sub}</p>
                      </div>
                    </div>
                    {i < ARCH_STEPS.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-px h-5 bg-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">Memory flows automatically at session start, during work, and at session end</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Capabilities</p>
            <h2 className="font-display text-4xl text-foreground">Everything you need. Nothing you don't.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: RefreshCw, title: 'Instant context recovery', body: 'Recover full session context in under 1 second after any interruption.' },
              { icon: Brain,     title: 'Knowledge graph storage', body: 'Structured graph memory — not flat logs. Queryable, precise, and fast.' },
              { icon: GitBranch, title: 'Multi-session continuity', body: 'Work across unlimited sessions with no re-orientation prompts needed.' },
              { icon: Lock,      title: 'Self-hosted option',       body: 'Run Cognee locally. No data ever leaves your infrastructure.' },
              { icon: Globe,     title: 'Universal compatibility',  body: 'MCP, REST API, and SDK integrations for any agent or workflow.' },
              { icon: Zap,       title: 'Automatic classification', body: 'Memory type (remember/recall/improve/forget) is inferred automatically.' },
              { icon: Database,  title: 'Memory versioning',        body: 'Track how memory evolves over time. Roll back to any prior state.' },
              { icon: CheckCircle2, title: 'Outcome evidence',      body: 'Every session generates verifiable evidence of what was accomplished.' },
              { icon: AlertCircle,  title: 'Conflict detection',    body: 'Flags contradictory memories so your agent always has accurate context.' },
            ].map(cap => (
              <div key={cap.title} className="rounded-xl border border-border bg-card p-5 hover:border-primary/15 transition-colors">
                <cap.icon className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold text-foreground text-sm mb-1.5">{cap.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{cap.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-5">
            Ready to give your agents<br />
            <span className="italic" style={{ color: '#818cf8' }}>a real memory?</span>
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Start with demo memory in the workspace — no setup required. Upgrade to cloud or local when you're ready.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={onEnterWorkspace}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm">
              Open workspace <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('docs')}
              className="text-sm text-muted-foreground border border-border px-6 py-3 rounded-lg hover:text-foreground hover:border-foreground/15 transition-all">
              Read the docs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
