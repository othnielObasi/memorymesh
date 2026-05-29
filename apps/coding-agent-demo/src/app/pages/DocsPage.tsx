import { useState } from 'react';
import { ArrowRight, Search, Terminal, Brain, Code2, Package, BookOpen, GitBranch, Shield, Zap, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

const SECTIONS = [
  {
    icon: Zap,
    color: '#818cf8',
    title: 'Quick start',
    desc: 'Get MemoryMesh running in 5 minutes. Demo memory, no setup required.',
    guides: ['Open the workspace', 'Run your first session', 'See memory in action', 'Explore recovery'],
    tag: 'Start here',
  },
  {
    icon: Terminal,
    color: '#22d3ee',
    title: 'MCP integration',
    desc: 'Connect Cursor, Claude Code, or any MCP-compatible agent.',
    guides: ['MCP server setup', 'Cursor configuration', 'Claude Code setup', 'Testing your connection'],
    tag: null,
  },
  {
    icon: Code2,
    color: '#34d399',
    title: 'REST API',
    desc: 'Full HTTP API for custom agents and workflow automation.',
    guides: ['Authentication', 'Session lifecycle', 'Memory operations', 'Webhooks & events'],
    tag: null,
  },
  {
    icon: Package,
    color: '#f59e0b',
    title: 'SDKs',
    desc: 'TypeScript and Python SDKs with first-class memory management.',
    guides: ['TypeScript SDK', 'Python SDK', 'LangChain integration', 'CrewAI integration'],
    tag: null,
  },
  {
    icon: Brain,
    color: '#c084fc',
    title: 'Memory concepts',
    desc: 'Understand Cognee memory, Context Maps, memory operations, and retention.',
    guides: ['How memory works', 'Memory operations', 'Context Map model', 'Retention & pruning'],
    tag: null,
  },
  {
    icon: Shield,
    color: '#34d399',
    title: 'Privacy & security',
    desc: 'Data sovereignty, encryption, and access control documentation.',
    guides: ['Data residency', 'Encryption at rest', 'Access control', 'Memory deletion'],
    tag: null,
  },
];

const QUICK_START_STEPS = [
  {
    step: '01',
    title: 'Open the workspace',
    desc: 'No account needed for demo memory. Click "Open workspace" to launch.',
    code: null,
    time: '< 1 min',
  },
  {
    step: '02',
    title: 'Select demo memory',
    desc: 'Choose "Demo memory" as your memory location. Session data is pre-seeded so you can see memory recall immediately.',
    code: null,
    time: '< 1 min',
  },
  {
    step: '03',
    title: 'Run the Build Assistant',
    desc: 'Enter a task — like "Add a user authentication system" — and start the session.',
    code: `Task: "Add a user authentication system with email/password login"`,
    time: '~30 sec',
  },
  {
    step: '04',
    title: 'Watch memory activity',
    desc: 'As the agent works, the session panel shows live memory operations — remember, recall, improve, forget.',
    code: null,
    time: 'Live',
  },
  {
    step: '05',
    title: 'See recovery in action',
    desc: 'After the session, the recovery summary shows everything that was preserved and how it would be recalled in a new session.',
    code: null,
    time: 'Automatic',
  },
];

const MCP_SNIPPET = `// .cursor/mcp.json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymesh/mcp-server"],
      "env": {
        "MM_API_KEY": "mm_live_xxxxxxxxxxxxxxxxxxxx",
        "MM_AGENT_ID": "cursor-primary",
        "MM_MEMORY": "cloud"
      }
    }
  }
}`;

const API_SNIPPET = `// Session lifecycle via REST API
// POST /v1/sessions/start
const session = await fetch('https://api.memorymesh.dev/v1/sessions/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer mm_live_xxx',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ agent_id: 'my-agent', memory: 'cloud' }),
}).then(r => r.json());

// session.context contains full recalled memory
console.log(session.context.summary);
// → "3 active tasks, 12 architecture decisions, project: e-commerce platform"`;

const CHANGELOG = [
  { date: '2025-07-01', tag: 'new',      text: 'Python SDK v0.4 — LangChain and CrewAI integrations' },
  { date: '2025-06-22', tag: 'improved', text: 'Memory recall latency reduced to <200ms for cloud' },
  { date: '2025-06-15', tag: 'new',      text: 'Forget operation now supports bulk deletion by tag' },
  { date: '2025-06-08', tag: 'fix',      text: 'Fixed context loss during rapid session restarts' },
];

const TAG_COLORS: Record<string, string> = {
  new:      '#818cf8',
  improved: '#34d399',
  fix:      '#f87171',
};

export function DocsPage({ onNavigate, onEnterWorkspace }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="pt-16">
      {/* Hero with search */}
      <section className="px-6 py-20 relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(129,140,248,0.05) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Documentation</p>
          <h1 className="font-display text-5xl text-foreground mb-5">
            Everything you need<br />
            <span className="italic" style={{ color: '#818cf8' }}>to get started.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Guides, API reference, and integration docs for MemoryMesh.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search docs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono-ui">
              <span className="px-1.5 py-0.5 border border-border rounded bg-muted/30">⌘</span>
              <span className="px-1.5 py-0.5 border border-border rounded bg-muted/30">K</span>
            </kbd>
          </div>

          {/* Quick links */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {['Quick start', 'MCP setup', 'API reference', 'SDKs'].map(link => (
              <button key={link}
                className="text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-full hover:text-foreground hover:border-foreground/15 transition-all">
                {link}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12 py-16">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-16">

            {/* Quick start guide */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Quick start — 5 minutes</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Start here</span>
              </div>

              <div className="space-y-3">
                {QUICK_START_STEPS.map((s, i) => (
                  <div key={s.step} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex items-start gap-4 px-5 py-4">
                      <span className="font-mono-ui text-xs text-primary/50 mt-0.5 w-6 shrink-0">{s.step}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <span className="font-medium text-sm text-foreground">{s.title}</span>
                          <span className="text-xs font-mono-ui text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{s.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                        {s.code && (
                          <pre className="mt-3 text-xs font-mono-ui text-muted-foreground/80 bg-muted/30 rounded-lg p-3 border border-border overflow-x-auto">
                            {s.code}
                          </pre>
                        )}
                      </div>
                    </div>
                    {i < QUICK_START_STEPS.length - 1 && (
                      <div className="h-px bg-border/50 mx-5" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button onClick={onEnterWorkspace}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
                  Open workspace <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground">No account required for demo</span>
              </div>
            </div>

            {/* MCP integration */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h2 className="font-semibold text-foreground">MCP integration</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The MemoryMesh MCP server exposes memory operations as tools your agent can call. Add it to any MCP-compatible agent's configuration file.
              </p>
              <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <span className="text-xs font-mono-ui text-muted-foreground">.cursor/mcp.json</span>
                  <span className="text-xs text-muted-foreground">JSON</span>
                </div>
                <pre className="p-4 text-xs font-mono-ui text-muted-foreground overflow-x-auto hide-scrollbar leading-relaxed">
                  <code>{MCP_SNIPPET}</code>
                </pre>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {['Get your API key from the workspace settings', 'Replace mm_live_xxx with your actual key', 'Set MM_AGENT_ID to a unique identifier for your agent', 'Restart your editor to load the MCP server'].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />{tip}
                  </div>
                ))}
              </div>
            </div>

            {/* REST API */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                  <Code2 className="w-3.5 h-3.5 text-green-400" />
                </div>
                <h2 className="font-semibold text-foreground">REST API</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The REST API gives you direct control over the session lifecycle and memory operations. Available on Pro and Enterprise plans.
              </p>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <span className="text-xs font-mono-ui text-muted-foreground">session.ts</span>
                  <span className="text-xs text-muted-foreground">TypeScript</span>
                </div>
                <pre className="p-4 text-xs font-mono-ui text-muted-foreground overflow-x-auto hide-scrollbar leading-relaxed">
                  <code>{API_SNIPPET}</code>
                </pre>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Section navigation */}
            <div>
              <h3 className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-4">Documentation</h3>
              <div className="space-y-1">
                {SECTIONS.map(section => (
                  <button
                    key={section.title}
                    onClick={() => setActiveSection(activeSection === section.title ? null : section.title)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeSection === section.title ? 'bg-primary/8 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <section.icon className="w-3.5 h-3.5 shrink-0" style={{ color: section.color }} />
                      <span className="text-sm">{section.title}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSection === section.title ? 'rotate-90' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Changelog */}
            <div>
              <h3 className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-4">Recent changes</h3>
              <div className="space-y-3">
                {CHANGELOG.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="text-xs font-mono-ui px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ color: TAG_COLORS[item.tag], background: `${TAG_COLORS[item.tag]}15` }}
                    >
                      {item.tag}
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                      <p className="text-xs text-muted-foreground/40 mt-0.5 font-mono-ui">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <BookOpen className="w-5 h-5 text-primary mb-3" />
              <h4 className="text-sm font-semibold text-foreground mb-1.5">Need help?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Join the community Discord, open a GitHub issue, or reach out directly.
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Discord community', href: '#' },
                  { label: 'GitHub issues',     href: '#' },
                  { label: 'Email support',     href: '#' },
                ].map(l => (
                  <a key={l.label} href={l.href}
                    className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group">
                    <span>{l.label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
