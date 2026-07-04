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
    desc: 'Try demo memory, run an agent, inspect the receipt, then choose Local or Cloud memory.',
    guides: ['Try demo memory', 'Run your first agent', 'Inspect the receipt', 'Choose Local or Cloud'],
    tag: 'Start here',
  },
  {
    icon: Terminal,
    color: '#22d3ee',
    title: 'MCP integration',
    desc: 'Connect Cursor or any MCP-compatible agent through the MemoryMesh MCP server.',
    guides: ['Install @memorymsh/mcp-server', 'Configure Cursor or OpenCode', 'Choose memory backend', 'Test recall and receipt tools'],
    tag: null,
  },
  {
    icon: Code2,
    color: '#34d399',
    title: 'REST API',
    desc: 'Use the HTTP API for custom agents, internal services, and workflow automation.',
    guides: ['Authentication', 'Agent runs', 'Memory operations', 'Idempotent receipts'],
    tag: null,
  },
  {
    icon: Package,
    color: '#f59e0b',
    title: 'SDKs',
    desc: 'TypeScript and Python SDKs with first-class memory management.',
    guides: ['@memorymsh/sdk', 'memorymesh-sdk', 'Run receipts', 'Framework adapters'],
    tag: null,
  },
  {
    icon: Brain,
    color: '#c084fc',
    title: 'Memory concepts',
    desc: 'Understand Cognee memory, Context Maps, memory operations, and retention.',
    guides: ['Demo memory', 'Local Cognee', 'Cognee Cloud', 'Context Map model'],
    tag: null,
  },
  {
    icon: Shield,
    color: '#34d399',
    title: 'Privacy & security',
    desc: 'Data sovereignty, encryption, and access control documentation.',
    guides: ['Self-hosted memory', 'Cloud sessions', 'Access control', 'Retention and deletion'],
    tag: null,
  },
];

const QUICK_START_STEPS = [
  {
    step: '01',
    title: 'Try demo memory',
    desc: 'Open the demo workspace with no account. It uses temporary sample memory so you can see the product flow immediately.',
    code: null,
    time: '< 1 min',
  },
  {
    step: '02',
    title: 'Choose an agent and run',
    desc: 'Select Build, Research, or Support, enter a task, and run the session. A successful run returns a receipt instead of a disposable chat answer.',
    code: null,
    time: '< 1 min',
  },
  {
    step: '03',
    title: 'Inspect the receipt',
    desc: 'Confirm the run_id, receipt_ref, memory backend, evidence, tool traces, recovery state, and next action.',
    code: `Receipt fields: run_id, receipt_ref, backend, evidence, memory_ops, outcome`,
    time: '~30 sec',
  },
  {
    step: '04',
    title: 'Move to Local or Cloud',
    desc: 'Use Local memory for private self-hosted Cognee, or Cloud memory for managed Cognee Cloud and shared organisation workspaces.',
    code: null,
    time: '2 min',
  },
  {
    step: '05',
    title: 'Connect your own agent',
    desc: 'Use MCP, the TypeScript SDK, the Python SDK, or REST API so Cursor, OpenCode, Codex-style tools, or custom agents can keep memory across sessions.',
    code: `npm install @memorymsh/sdk
pip install memorymesh-sdk
npx -y @memorymsh/mcp-server`,
    time: '5 min',
  },
];

const MCP_SNIPPET = `// .cursor/mcp.json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "http://127.0.0.1:8000/api",
        "MM_API_KEY": "YOUR_SESSION_OR_API_KEY",
        "MM_AGENT_ID": "cursor-primary",
        "MM_PROJECT": "current-repo",
        "MM_MEMORY_BACKEND": "local_cognee"
      }
    }
  }
}`;

const API_SNIPPET = `// Recall project memory via REST API
const memory = await fetch('https://api-two-blue-75.vercel.app/api/memory/recall', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SESSION_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    backend: 'cognee_cloud',
    dataset: 'current-repo',
    query: 'What decisions, failures, files, and next actions matter?'
  }),
}).then(r => r.json());

// memory contains recalled context from MemoryMesh/Cognee
console.log(memory);`;

const TS_SDK_SNIPPET = `import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: "https://api-two-blue-75.vercel.app",
  apiKey: process.env.MEMORYMESH_SESSION_TOKEN,
  apiKeyHeader: "Authorization",
  defaultMemoryBackend: "cognee_cloud",
});

const receipt = await client.runAgent({
  agentId: "research",
  task: "Compare durable memory options for coding agents.",
});

console.log(receipt.run_id, receipt.receipt_ref);`;

const PY_SDK_SNIPPET = `from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url="https://api-two-blue-75.vercel.app",
    api_key=os.environ["MEMORYMESH_SESSION_TOKEN"],
    api_key_header="Authorization",
    default_memory_backend="cognee_cloud",
)

receipt = client.run_agent(
    agent_id="support",
    task="Investigate high-priority unresolved tickets.",
)

print(receipt["run_id"], receipt["receipt_ref"])`;

const CHANGELOG = [
  { date: '2026-07-04', tag: 'new',      text: 'Published TypeScript SDK, Python SDK, and MCP server packages' },
  { date: '2026-07-04', tag: 'improved', text: 'Documented Demo, Local Cognee, and Cognee Cloud memory modes' },
  { date: '2026-07-04', tag: 'new',      text: 'Added receipt-first examples for REST, SDK, and MCP usage' },
  { date: '2026-07-04', tag: 'fix',      text: 'Clarified authentication and backend selection for developers' },
];

const TAG_COLORS: Record<string, string> = {
  new:      '#818cf8',
  improved: '#34d399',
  fix:      '#f87171',
};

export function DocsPage({ onNavigate, onEnterWorkspace }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const openLocalConsole = () => window.location.assign('/?mode=local');

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
                  Try demo <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={openLocalConsole}
                  className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/30 transition-all">
                  Local console
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
                {['Use @memorymsh/mcp-server from npm', 'Use local_cognee for private local memory or cognee_cloud for managed cloud', 'Set MM_AGENT_ID to a stable identifier for your agent', 'Restart your editor and run memorymesh_status to test the connection'].map((tip, i) => (
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

            {/* SDKs */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h2 className="font-semibold text-foreground">SDKs</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Use the published packages when you want MemoryMesh inside your own app, worker, notebook, or agent runtime.
              </p>
              <div className="grid gap-4">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                    </div>
                    <span className="text-xs font-mono-ui text-muted-foreground">@memorymsh/sdk</span>
                    <span className="text-xs text-muted-foreground">TypeScript</span>
                  </div>
                  <pre className="p-4 text-xs font-mono-ui text-muted-foreground overflow-x-auto hide-scrollbar leading-relaxed">
                    <code>{TS_SDK_SNIPPET}</code>
                  </pre>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                    </div>
                    <span className="text-xs font-mono-ui text-muted-foreground">memorymesh-sdk</span>
                    <span className="text-xs text-muted-foreground">Python</span>
                  </div>
                  <pre className="p-4 text-xs font-mono-ui text-muted-foreground overflow-x-auto hide-scrollbar leading-relaxed">
                    <code>{PY_SDK_SNIPPET}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Production checklist */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                </div>
                <h2 className="font-semibold text-foreground">Production checklist</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Use Authorization for signed user sessions or X-MemoryMesh-API-Key for API-key deployments.',
                    'Choose offline_mirror, local_cognee, or cognee_cloud intentionally.',
                    'Use stable project, dataset, and agent ids so memory can be recalled later.',
                    'Send idempotency keys for write operations and external actions.',
                    'Store receipt_ref with your job, ticket, pull request, or workflow run.',
                    'Verify memorymesh_status before depending on a backend in production.',
                  ].map((tip) => (
                    <div key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />{tip}
                    </div>
                  ))}
                </div>
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
