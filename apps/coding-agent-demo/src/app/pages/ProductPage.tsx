import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Code2,
  Database,
  FileCheck2,
  GitBranch,
  Globe,
  Lock,
  Network,
  RefreshCw,
  Shield,
  Users,
  Workflow,
} from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

const USERS = [
  {
    icon: Code2,
    title: 'Developers',
    body: 'Use MemoryMesh with Codex, Cursor, Claude Code, OpenClaw, or custom agents so project context survives across sessions and tools.',
  },
  {
    icon: Users,
    title: 'Engineering teams',
    body: 'Share useful agent memory across people: decisions, source trails, tests, failed attempts, recovery notes, and approved next actions.',
  },
  {
    icon: Shield,
    title: 'Private builders',
    body: 'Run local/self-hosted Cognee when code, tickets, customer data, or research cannot leave the network.',
  },
  {
    icon: Network,
    title: 'Cognee ecosystem',
    body: 'Expose Cognee memory as a polished workflow layer with receipts, Context Maps, SDKs, MCP, and visible memory operations.',
  },
];

const MODES = [
  {
    icon: Globe,
    label: 'Demo memory',
    title: 'Evaluate without setup',
    body: 'A public, no-login path that shows the full memory workflow with labelled temporary data and clear proof of what was remembered.',
    points: ['No account required', 'Temporary preview memory', 'Best for first evaluation'],
  },
  {
    icon: Lock,
    label: 'Local memory',
    title: 'Keep memory private',
    body: 'A self-hosted console on top of open-source Cognee for private codebases, internal support queues, and sensitive research.',
    points: ['Runs on your infrastructure', 'Uses open-source Cognee', 'No data leaves your network'],
  },
  {
    icon: Database,
    label: 'Cloud memory',
    title: 'Share memory with a team',
    body: 'A managed Cognee Cloud path for persistent team memory, multi-device access, shared receipts, and production API usage.',
    points: ['Managed Cognee Cloud', 'Team-wide memory', 'API keys and tenant controls'],
  },
];

const USE_CASES = [
  {
    title: 'Coding agents that stop losing repo context',
    body: 'Remember architecture decisions, source files, test failures, fixes attempted, and next safe actions so a later agent run can continue without re-reading everything.',
  },
  {
    title: 'Research copilots with source trails',
    body: 'Ingest documents, URLs, and notes, then recall the answer with supporting evidence instead of a loose summary that nobody can verify.',
  },
  {
    title: 'Support agents with customer memory',
    body: 'Carry prior tickets, escalation notes, root causes, and resolution patterns across future support runs without asking the customer to repeat context.',
  },
  {
    title: 'Operations workflows that remember incidents',
    body: 'Store incident timelines, commands run, failed remediations, and final recovery steps so future on-call work starts from known history.',
  },
  {
    title: 'Team handoffs with proof',
    body: 'Produce run receipts that show what the agent did, what it used as evidence, what it changed, and what should happen next.',
  },
  {
    title: 'Cognee adoption demos',
    body: 'Show both open-source Cognee and Cognee Cloud through a product experience that makes remember, recall, improve, and forget understandable.',
  },
];

const COGNEE_VALUE = [
  'Turns Cognee memory into a visible product workflow instead of a hidden backend call.',
  'Demonstrates both open-source Cognee and Cognee Cloud with the same agent lifecycle.',
  'Adds user-facing receipts, Context Maps, SDKs, MCP, local console, and demo mode.',
  'Gives developers a practical reason to adopt Cognee inside real agent tools.',
];

const PROOF_FLOW = [
  { label: 'Capture', body: 'Store task brief, repo or source context, decisions, checkpoints, evidence, and tool traces.' },
  { label: 'Recall', body: 'Load the right context at the start of a new run, new tool, or recovery session.' },
  { label: 'Improve', body: 'Save verified lessons after the work succeeds so future runs become sharper.' },
  { label: 'Forget', body: 'Remove stale, sensitive, contradicted, or session-only memory with an explicit action.' },
  { label: 'Prove', body: 'Return a receipt with run id, memory operations, backend, evidence, and final output.' },
];

export function ProductPage({ onNavigate, onEnterWorkspace }: Props) {
  return (
    <div className="pt-16">
      <section className="px-6 py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 30%, rgba(129,140,248,0.07) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Solution</p>
            <h1 className="font-display text-5xl md:text-7xl text-foreground leading-tight mb-6">
              Durable work memory for AI agents.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-10">
              MemoryMesh helps agents remember the work that matters: decisions, evidence,
              failures, checkpoints, source trails, and outcomes. Cognee powers the memory.
              MemoryMesh makes that memory useful, visible, and adoptable.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={onEnterWorkspace}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm"
              >
                Try the workflow <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('docs')}
                className="text-sm text-muted-foreground border border-border px-6 py-3 rounded-lg hover:text-foreground hover:border-foreground/15 transition-all"
              >
                Read docs
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-xs font-mono-ui text-red-400 uppercase tracking-widest mb-4">The pain</p>
            <h2 className="font-display text-3xl text-foreground mb-4">Agents forget the work, not just the chat.</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Most AI tools produce useful output, then lose the surrounding context: why a decision was made,
              which source proved it, which test failed, what was tried, and what the next run must know.
              The result is repeated work, weaker handoffs, and fragile automation.
            </p>
            <ul className="space-y-3">
              {['Repeated repo re-orientation', 'Lost source trails', 'No recoverable checkpoint', 'No proof of what memory changed'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">The answer</p>
            <h2 className="font-display text-3xl text-foreground mb-4">A memory layer around agent work.</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              MemoryMesh wraps Cognee around real work sessions. Every run can remember context,
              recall what matters, improve from verified outcomes, forget stale data, and produce a
              receipt users can inspect.
            </p>
            <ul className="space-y-3">
              {['Context recovery across tools', 'Local or cloud Cognee memory', 'Inspectable Context Map', 'Run receipt with memory operations'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Who it helps</p>
            <h2 className="font-display text-4xl text-foreground mb-4">Built for people who need agent work to continue.</h2>
            <p className="text-muted-foreground leading-relaxed">
              MemoryMesh is not generic chat history. It is structured work memory for agent workflows that need continuity, privacy, proof, and reuse.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {USERS.map(user => (
              <div key={user.title} className="rounded-xl border border-border bg-card p-5">
                <user.icon className="w-5 h-5 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{user.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{user.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Memory modes</p>
            <h2 className="font-display text-4xl text-foreground mb-4">One workflow. Three adoption paths.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start with demo memory, move private work to local Cognee, and use Cognee Cloud when teams need shared managed memory.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {MODES.map(mode => (
              <div key={mode.label} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <mode.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-mono-ui text-primary uppercase tracking-widest">{mode.label}</p>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{mode.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{mode.body}</p>
                <div className="space-y-2">
                  {mode.points.map(point => (
                    <p key={point} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-12 items-start">
          <div>
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Cognee fit</p>
            <h2 className="font-display text-4xl text-foreground mb-5">
              Cognee is the engine. MemoryMesh is the adoption layer.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              MemoryMesh does not compete with Cognee. It gives Cognee a product surface that developers
              and teams can understand in minutes: choose a memory backend, run an agent, inspect the
              Context Map, verify the receipt, and keep or forget the memory.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="space-y-4">
              {COGNEE_VALUE.map((item, index) => (
                <div key={item} className="flex gap-4">
                  <span className="font-mono-ui text-xs text-primary/70 mt-1">{String(index + 1).padStart(2, '0')}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Use cases</p>
            <h2 className="font-display text-4xl text-foreground mb-4">Where MemoryMesh becomes useful in real life.</h2>
            <p className="text-muted-foreground leading-relaxed">
              The value is not storing more text. The value is helping the next agent run start from the truth the previous run earned.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map(useCase => (
              <div key={useCase.title} className="rounded-xl border border-border bg-card p-5">
                <FileCheck2 className="w-5 h-5 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{useCase.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Proof loop</p>
            <h2 className="font-display text-4xl text-foreground mb-4">Every useful run should leave evidence.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The product is judged by whether it can recover useful work, not by whether it can save a transcript.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden">
            {PROOF_FLOW.map((step, index) => (
              <div key={step.label} className="bg-card p-5">
                <p className="font-mono-ui text-xs text-primary/60 mb-4">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-sm font-semibold text-foreground mb-2">{step.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center gap-4 mb-8 text-primary">
            <Brain className="w-5 h-5" />
            <Workflow className="w-5 h-5" />
            <GitBranch className="w-5 h-5" />
            <RefreshCw className="w-5 h-5" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-5">
            Make agent memory visible enough to trust.
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Try the demo, run local Cognee for private work, or connect Cognee Cloud for team memory.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onEnterWorkspace}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm"
            >
              Open workspace <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('memory')}
              className="text-sm text-muted-foreground border border-border px-6 py-3 rounded-lg hover:text-foreground hover:border-foreground/15 transition-all"
            >
              Compare memory modes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
