import { ArrowRight, Brain, RefreshCw, Database, Zap, Lock, Globe, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

const OPS = [
  { op: 'remember', color: '#818cf8', desc: 'Uses Cognee to store the task brief, evidence, decisions, checkpoints, and tool traces from the current run.', example: 'Stored: task contract, failing test, repo map, next safe action' },
  { op: 'recall',   color: '#22d3ee', desc: 'Restores the right recovery brief when an agent starts again, switches tools, or loses context.', example: 'Loaded: prior decision, source trail, checkpoint, unresolved step' },
  { op: 'improve',  color: '#34d399', desc: 'Turns verified outcomes and feedback into better future memory instead of another static transcript.', example: 'Improved: support pattern after ticket was resolved and validated' },
  { op: 'forget',   color: '#f87171', desc: 'Removes stale, sensitive, contradicted, or session-scoped memory through an explicit user action.', example: 'Forgotten: expired endpoint decision and temporary demo notes' },
];

const ARCH_STEPS = [
  { label: 'Your agent', sub: 'Cursor / Claude Code / Codex / custom', color: '#818cf8' },
  { label: 'MemoryMesh', sub: 'Session receipts / Context Map / SDK', color: '#22d3ee' },
  { label: 'Cognee', sub: 'Hybrid graph-vector memory, local or cloud', color: '#34d399' },
];

const PROOF_STEPS = [
  { label: 'Choose agent', body: 'Run a built-in assistant or connect an existing tool.' },
  { label: 'Choose memory', body: 'Use private local Cognee, Cognee Cloud, or labelled demo memory.' },
  { label: 'Run work', body: 'Capture task, evidence, decisions, tool traces, and checkpoints.' },
  { label: 'Recover context', body: 'Recall a brief after context loss so the agent continues safely.' },
  { label: 'Improve or forget', body: 'Save verified lessons or remove stale and sensitive memory.' },
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
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Cognee-powered workflows</p>
          <h1 className="font-display text-5xl md:text-7xl text-foreground leading-tight mb-6">
            AI agents that can<br />
            <span className="italic" style={{ color: '#818cf8' }}>recover the work.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            MemoryMesh is not a replacement for Cognee. It is the product layer that turns Cognee memory into recoverable work sessions, receipts, and Context Maps.
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
                <span className="text-sm font-medium text-red-400">Without persistent work memory</span>
              </div>
              <ul className="space-y-4">
                {[
                  'Agent starts each session with weak context',
                  'You re-explain the codebase each time',
                  'Decisions made last week are unknown today',
                  'Work is repeated across sessions',
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
                <span className="text-sm font-medium text-green-400">With MemoryMesh and Cognee</span>
              </div>
              <ul className="space-y-4">
                {[
                  'Agent recalls the right recovery brief on startup',
                  'Previous decisions, evidence, checkpoints, and files are loaded',
                  'Work resumes exactly where it left off',
                  'Each session builds on the last',
                  'Context window used for actual work',
                  'Agent improves from verified outcomes and feedback',
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
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Cognee lifecycle</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">Four operations. One recoverable run.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              MemoryMesh makes Cognee's memory lifecycle visible as work activity users can inspect and trust.
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
                Cognee is the memory engine. MemoryMesh wraps agent work around it: session start, memory activity, recovery brief, Context Map, run receipt, and explicit forget controls.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Use built-in agents or connect existing tools',
                  'Choose local/self-hosted Cognee or Cognee Cloud',
                  'Show what was remembered, recalled, improved, and forgotten',
                  'Produce a run receipt instead of another hidden transcript',
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
              <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-8 text-center">Built on Cognee</p>
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
                <p className="text-xs text-muted-foreground text-center">Memory remains powered by Cognee; MemoryMesh makes the workflow usable.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof flow */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Never-forget proof</p>
            <h2 className="font-display text-4xl text-foreground mb-4">The demo must prove recovery, not just storage.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The production flow is designed around one judged outcome: can an agent continue useful work after context is lost?
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden">
            {PROOF_STEPS.map((step, index) => (
              <div key={step.label} className="bg-card p-5">
                <p className="font-mono-ui text-xs text-primary/60 mb-4">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-sm font-semibold text-foreground mb-2">{step.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
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
              { icon: Brain,     title: 'Context Map', body: 'A readable map of task, evidence, decisions, checkpoint, outcome, and improved lesson.' },
              { icon: GitBranch, title: 'Multi-session continuity', body: 'Work across unlimited sessions with no re-orientation prompts needed.' },
              { icon: Lock,      title: 'Self-hosted option',       body: 'Run Cognee locally. No data ever leaves your infrastructure.' },
              { icon: Globe,     title: 'Universal compatibility',  body: 'MCP, REST API, and SDK integrations for any agent or workflow.' },
              { icon: Zap,       title: 'Automatic classification', body: 'Memory type (remember/recall/improve/forget) is inferred automatically.' },
              { icon: Database,  title: 'Memory versioning',        body: 'Track how memory evolves over time. Roll back to any prior state.' },
              { icon: CheckCircle2, title: 'Outcome evidence',      body: 'Every session generates verifiable evidence of what was accomplished.' },
              { icon: AlertCircle,  title: 'Honest fallback state', body: 'Clearly marks demo or offline mirror mode when local Cognee or Cognee Cloud is not serving memory.' },
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
