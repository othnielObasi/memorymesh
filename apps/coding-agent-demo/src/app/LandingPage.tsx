import { useState, useEffect, type ReactNode } from 'react';
import {
  ArrowRight, ChevronRight, Shield, Cloud, Zap,
  RefreshCw, Globe, Lock, Terminal, GitBranch,
  Brain, Database, CheckCircle2, Circle
} from 'lucide-react';
import { ProductPage } from './pages/ProductPage';
import { AgentsPage } from './pages/AgentsPage';
import { MemoryPage } from './pages/MemoryPage';
import { PricingPage } from './pages/PricingPage';
import { DocsPage } from './pages/DocsPage';

interface LandingPageProps {
  onEnterWorkspace: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
}

export type PageType = 'home' | 'product' | 'agents' | 'memory' | 'pricing' | 'docs';

const PAGE_LINKS: Array<{ label: string; page: PageType }> = [
  { label: 'Product', page: 'product' },
  { label: 'Agents', page: 'agents' },
  { label: 'Memory', page: 'memory' },
  { label: 'Pricing', page: 'pricing' },
  { label: 'Docs', page: 'docs' },
];

// --- Memory graph background ---
function MemoryGraph() {
  const nodes = [
    { cx: 8,  cy: 22 }, { cx: 92, cy: 15 }, { cx: 88, cy: 72 },
    { cx: 12, cy: 80 }, { cx: 48, cy: 8  }, { cx: 96, cy: 44 },
    { cx: 4,  cy: 52 }, { cx: 55, cy: 90 }, { cx: 30, cy: 38 },
    { cx: 70, cy: 30 }, { cx: 75, cy: 62 }, { cx: 22, cy: 60 },
  ];
  const edges = [
    [0,8],[8,4],[4,1],[1,9],[9,10],[10,2],[2,7],[7,3],[3,11],[11,0],
    [8,9],[9,5],[10,7],[11,6],[0,4],[1,10],[3,7],
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.18 }}
      >
        <defs>
          <style>{`
            @keyframes edgePulse {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.6; }
            }
            @keyframes nodePulse {
              0%, 100% { r: 0.6; opacity: 0.5; }
              50% { r: 1; opacity: 0.9; }
            }
            @keyframes dotFlow {
              0% { offset-distance: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { offset-distance: 100%; opacity: 0; }
            }
          `}</style>
        </defs>
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].cx} y1={nodes[a].cy}
            x2={nodes[b].cx} y2={nodes[b].cy}
            stroke="#818cf8"
            strokeWidth="0.2"
            style={{
              animation: `edgePulse ${3 + (i % 4) * 0.7}s ease-in-out ${(i * 0.3) % 2}s infinite`
            }}
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.cx} cy={n.cy}
            r="0.7"
            fill="#818cf8"
            style={{
              animation: `nodePulse ${2 + (i % 3) * 0.8}s ease-in-out ${(i * 0.4) % 2}s infinite`,
              transformOrigin: `${n.cx}px ${n.cy}px`
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// --- Animated activity feed (hero visual) ---
const ACTIVITY_ITEMS = [
  { type: 'remember', label: 'remember', text: 'Stored task context and project structure', color: '#818cf8' },
  { type: 'recall',   label: 'recall',   text: 'Retrieved previous build patterns from memory', color: '#22d3ee' },
  { type: 'improve',  label: 'improve',  text: 'Refined code patterns based on past sessions', color: '#34d399' },
  { type: 'remember', label: 'remember', text: 'Saved component architecture decisions', color: '#818cf8' },
  { type: 'recall',   label: 'recall',   text: 'Loaded authentication flow from prior session', color: '#22d3ee' },
  { type: 'improve',  label: 'improve',  text: 'Updated dependency map with new packages', color: '#34d399' },
];

function ActivityFeed() {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(v => v < ACTIVITY_ITEMS.length ? v + 1 : 3);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
      style={{ fontFamily: "'Geist Mono', monospace" }}
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">memory activity — live</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">active</span>
        </div>
      </div>
      {/* Feed lines */}
      <div className="px-4 py-3 space-y-2 min-h-[152px]">
        {ACTIVITY_ITEMS.slice(0, visible).map((item, i) => (
          <div
            key={`${i}-${visible}`}
            className="flex items-start gap-3 text-xs"
            style={{
              animation: i === visible - 1 ? 'fadeInUp 0.3s ease-out' : 'none',
            }}
          >
            <span
              className="shrink-0 w-16 text-right font-medium"
              style={{ color: item.color }}
            >
              {item.label}
            </span>
            <span className="text-muted-foreground leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PageShellProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onEnterWorkspace: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  onOpenLocal: () => void;
  children: ReactNode;
}

function PageShell({ currentPage, onNavigate, onEnterWorkspace, onSignIn, onGetStarted, onOpenLocal, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .font-display { font-family: 'Instrument Serif', serif; }
        .font-mono-ui { font-family: 'Geist Mono', monospace; }
        .hide-scrollbar { scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <header className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5"
            aria-label="Open MemoryMesh home"
          >
            <span className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary" />
            </span>
            <span className="font-semibold text-foreground tracking-tight text-sm">MemoryMesh</span>
          </button>

          <nav className="hidden md:flex items-center gap-7">
            {PAGE_LINKS.map(({ label, page }) => (
              <button
                key={page}
                type="button"
                onClick={() => onNavigate(page)}
                className={`text-sm transition-colors ${
                  currentPage === page ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEnterWorkspace}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Try demo
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {children}

      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2"
          >
            <span className="w-5 h-5 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Brain className="w-3 h-3 text-primary" />
            </span>
            <span className="text-sm font-medium text-foreground">MemoryMesh</span>
          </button>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <button type="button" onClick={onEnterWorkspace} className="hover:text-foreground transition-colors">
              Demo
            </button>
            <button type="button" onClick={onOpenLocal} className="hover:text-foreground transition-colors">
              Local
            </button>
            {PAGE_LINKS.map(({ label, page }) => (
              <button
                key={page}
                type="button"
                onClick={() => onNavigate(page)}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            2026 MemoryMesh. Built on Cognee.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Main landing page ---
export function LandingPage({ onEnterWorkspace, onSignIn, onGetStarted }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigate = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const openLocalConsole = () => {
    window.location.assign('/?mode=local');
  };

  if (currentPage !== 'home') {
    const pageProps = { onNavigate: navigate, onEnterWorkspace };
    const page = currentPage === 'product'
      ? <ProductPage {...pageProps} />
      : currentPage === 'agents'
        ? <AgentsPage {...pageProps} />
        : currentPage === 'memory'
          ? <MemoryPage {...pageProps} />
          : currentPage === 'pricing'
            ? <PricingPage {...pageProps} />
            : <DocsPage {...pageProps} />;

    return (
      <PageShell
        currentPage={currentPage}
        onNavigate={navigate}
        onEnterWorkspace={onEnterWorkspace}
        onSignIn={onSignIn}
        onGetStarted={onGetStarted}
        onOpenLocal={openLocalConsole}
      >
        {page}
      </PageShell>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .font-display { font-family: 'Instrument Serif', serif; }
        .font-mono-ui { font-family: 'Geist Mono', monospace; }
        .section-in {
          animation: fadeInUp 0.5s ease-out both;
        }
        .hide-scrollbar { scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-md border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold text-foreground tracking-tight text-sm">
              MemoryMesh
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7">
            {PAGE_LINKS.map(({ label, page }) => (
              <button
                key={page}
                type="button"
                onClick={() => navigate(page)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEnterWorkspace}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Try demo
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 px-6 overflow-hidden">
        <MemoryGraph />

        {/* Radial bloom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(129,140,248,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/8 text-xs font-medium mb-8"
                style={{ color: '#818cf8' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Memory infrastructure for AI agents
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-[64px] leading-[1.08] tracking-tight mb-6">
                <span className="text-foreground">Agents that </span>
                <span className="italic" style={{ color: '#818cf8' }}>remember</span>
                <br />
                <span className="text-foreground">everything.</span>
              </h1>

              {/* Sub */}
              <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
                MemoryMesh persists context across sessions, context windows, and tool switches.
                Your agents always know where they left off — automatically.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3 flex-wrap mb-10">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 px-6 py-3 rounded-lg font-medium hover:bg-primary/8 transition-all"
                >
                  Try demo
                </button>
                <button
                  type="button"
                  onClick={openLocalConsole}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground border border-border px-6 py-3 rounded-lg font-medium hover:text-foreground hover:border-foreground/15 transition-all"
                >
                  Local console
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust */}
              <p className="text-xs text-muted-foreground">
                Works with{' '}
                {['Cursor', 'Claude Code', 'Codex', 'OpenClaw', 'any MCP agent'].map((name, i, arr) => (
                  <span key={name}>
                    <span className="text-foreground/60">{name}</span>
                    {i < arr.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </p>
            </div>

            {/* Right: live activity preview */}
            <div className="hidden lg:block">
              <div className="mb-3">
                <p className="text-xs font-mono-ui text-muted-foreground mb-2 uppercase tracking-widest">
                  Live memory activity
                </p>
                <ActivityFeed />
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { value: '100%', label: 'Context retained' },
                  { value: '<1s',  label: 'Recovery time' },
                  { value: '∞',    label: 'Session continuity' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-card/60 px-4 py-3 text-center">
                    <div className="font-display text-2xl text-foreground mb-0.5">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              Three steps to permanent memory.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
            {[
              {
                step: '01',
                icon: Terminal,
                title: 'Connect your agent',
                body: 'Add MemoryMesh to your agent\'s MCP config, drop in an API key, or use the SDK. Takes about 30 seconds.',
                detail: 'Works with any MCP-compatible agent, REST API, or our native SDK.',
              },
              {
                step: '02',
                icon: Brain,
                title: 'Work as normal',
                body: 'Your agent reads from memory at the start of each session and writes back throughout — silently, automatically.',
                detail: 'No new prompts. No extra instructions. Memory happens in the background.',
              },
              {
                step: '03',
                icon: RefreshCw,
                title: 'Context always continues',
                body: 'Lose context, switch tools, start a new session — your agent picks up exactly where it left off.',
                detail: 'Work survives any interruption. Every decision, pattern, and file is remembered.',
              },
            ].map(item => (
              <div key={item.step} className="bg-card px-8 py-10">
                <div className="flex items-start gap-5 mb-6">
                  <span className="font-mono-ui text-xs text-primary/50 mt-1">{item.step}</span>
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.body}</p>
                <p className="text-xs text-muted-foreground/60 border-t border-border pt-4">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: label + heading */}
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Features</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground leading-tight mb-6">
                Built for agents<br />
                <span className="italic">that get things done.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Every feature is designed for the reality of how AI agents actually work — not the ideal case where context never runs out.
              </p>
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 px-5 py-2.5 rounded-lg hover:bg-primary/8 transition-all"
                >
                Explore the workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: feature grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: RefreshCw,
                  title: 'Instant recovery',
                  body: 'If a session crashes or context is lost, the agent recovers in under a second with full context intact.',
                },
                {
                  icon: GitBranch,
                  title: 'Multi-session continuity',
                  body: 'Work spans multiple sessions and tool switches without ever re-explaining the codebase or task.',
                },
                {
                  icon: Globe,
                  title: 'Agent-agnostic',
                  body: 'Works with Cursor, Claude Code, Codex, OpenClaw, or any custom agent via MCP, REST, or SDK.',
                },
                {
                  icon: Lock,
                  title: 'Privacy-first',
                  body: 'Choose self-hosted Cognee for total privacy, or use our managed cloud. Your memory, your rules.',
                },
                {
                  icon: Zap,
                  title: 'Zero-config memory',
                  body: 'Memory operations — remember, recall, improve, forget — happen without any prompt engineering.',
                },
                {
                  icon: Database,
                  title: 'Structured memory graph',
                  body: 'Cognee stores hybrid graph-vector memory; MemoryMesh renders it as a Context Map users can inspect.',
                },
              ].map(f => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Memory locations ─────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Memory location</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              You choose where memory lives.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From fully private self-hosted to zero-setup demo — pick the memory location that fits your workflow and privacy requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Lock,
                badge: 'Private',
                badgeColor: '#34d399',
                title: 'Local memory',
                subtitle: 'Self-hosted Cognee',
                body: 'Run Cognee on your own infrastructure. Memory never leaves your machine. Full privacy, full control.',
                features: [
                  'Runs on your hardware',
                  'No data leaves your network',
                  'Open-source Cognee engine',
                  'Custom retention policies',
                ],
                cta: 'Set up local memory',
                highlight: false,
              },
              {
                icon: Cloud,
                badge: 'Recommended',
                badgeColor: '#818cf8',
                title: 'Cloud memory',
                subtitle: 'Managed Cognee Cloud',
                body: 'We run Cognee for you. Zero infrastructure, automatic backups, available from anywhere.',
                features: [
                  'Zero ops — fully managed',
                  'Instant setup, no config',
                  'Automatic backups',
                  'Multi-device access',
                ],
                cta: 'Start with cloud memory',
                highlight: true,
              },
              {
                icon: Zap,
                badge: 'Try it now',
                badgeColor: '#22d3ee',
                title: 'Demo memory',
                subtitle: 'Temporary preview',
                body: 'No setup required. See how memory works in the workspace before choosing a permanent location.',
                features: [
                  'Works immediately',
                  'No account needed',
                  'Pre-loaded sample data',
                  'Expires after session',
                ],
                cta: 'Try the demo',
                highlight: false,
              },
            ].map(loc => {
              const isCloud = loc.title === 'Cloud memory';
              return (
              <div
                key={loc.title}
                className={`rounded-xl border p-6 flex flex-col ${
                  loc.highlight
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-10 h-10 rounded-lg border flex items-center justify-center"
                    style={{
                      background: `${loc.badgeColor}15`,
                      borderColor: `${loc.badgeColor}30`,
                    }}
                  >
                    <loc.icon className="w-5 h-5" style={{ color: loc.badgeColor }} />
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      color: loc.badgeColor,
                      background: `${loc.badgeColor}15`,
                      border: `1px solid ${loc.badgeColor}25`,
                    }}
                  >
                    {loc.badge}
                  </span>
                </div>

                <h3 className="font-semibold text-foreground mb-0.5">{loc.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 font-mono-ui">{loc.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{loc.body}</p>

                <ul className="space-y-2 mb-8 flex-1">
                  {loc.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: loc.badgeColor }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={isCloud ? onGetStarted : loc.title === 'Local memory' ? openLocalConsole : onEnterWorkspace}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    loc.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border text-foreground hover:bg-muted/40'
                  }`}
                >
                  {loc.cta}
                </button>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Agents compatibility ──────────────────────────────── */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">Compatibility</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mb-6">
                Bring your agent.<br />
                <span className="italic">Or use ours.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Connect the agents you already use, or run a built-in agent directly from the workspace.
                Either way, memory is handled — you just focus on the work.
              </p>
              <button
                onClick={onEnterWorkspace}
                className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all font-medium"
              >
                Open workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Built-in agents */}
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-4">Built-in agents</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Build Assistant', status: 'available', desc: 'Code generation & refactoring' },
                    { name: 'Research Agent', status: 'available', desc: 'Deep research & synthesis' },
                    { name: 'Support Agent', status: 'available', desc: 'Customer ticket handling' },
                    { name: 'Ops Agent', status: 'coming', desc: 'Infrastructure & deployments' },
                  ].map(agent => (
                    <div key={agent.name} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        {agent.status === 'available' ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                        )}
                        <span className="text-xs font-medium text-foreground">{agent.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{agent.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* External agents */}
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-4">Connect your agent</p>
                <div className="flex flex-wrap gap-2">
                  {['Cursor', 'Claude Code', 'Codex', 'OpenClaw', 'Custom via MCP', 'Custom via API', 'Custom via SDK'].map(name => (
                    <span
                      key={name}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/15 transition-colors cursor-default"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="px-6 py-32 border-t border-border relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(129,140,248,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Get started</p>
          <h2 className="font-display text-5xl md:text-6xl text-foreground mb-6 leading-tight">
            Your agents deserve<br />
            <span className="italic">a memory.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Start free with demo memory and see how MemoryMesh transforms the way your agents work — no setup, no infrastructure, no re-explaining.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onEnterWorkspace}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium hover:bg-primary/90 transition-all text-base"
            >
              Try demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={openLocalConsole}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground border border-border px-6 py-4 rounded-xl hover:text-foreground hover:border-foreground/15 transition-all"
            >
              Open local console
            </button>
            <button
              onClick={() => navigate('docs')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground border border-border px-6 py-4 rounded-xl hover:text-foreground hover:border-foreground/15 transition-all"
            >
              Read the docs
            </button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Free forever for demo memory · No credit card required
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Brain className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">MemoryMesh</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <button type="button" onClick={onEnterWorkspace} className="hover:text-foreground transition-colors">
              Demo
            </button>
            <button type="button" onClick={openLocalConsole} className="hover:text-foreground transition-colors">
              Local
            </button>
            {PAGE_LINKS.map(({ label, page }) => (
              <button
                key={page}
                type="button"
                onClick={() => navigate(page)}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            2026 MemoryMesh. Built on Cognee.
          </p>
        </div>
      </footer>
    </div>
  );
}
