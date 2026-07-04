import { useState } from 'react';
import { ArrowRight, BookOpen, Brain, CheckCircle2, Clock, Code2, Copy, Package, Search, Shield, Terminal, Zap } from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

const QUICK_START_STEPS = [
  {
    step: '01',
    title: 'Choose a memory mode',
    desc: 'Demo is immediate, Local runs private self-hosted Cognee, and Cloud saves memory to a signed managed workspace.',
    time: '< 1 min',
  },
  {
    step: '02',
    title: 'Run an agent',
    desc: 'Choose Build, Research, or Support, enter a task, and run the session to generate a receipt.',
    time: '~30 sec',
  },
  {
    step: '03',
    title: 'Inspect the receipt',
    desc: 'Each run should show evidence, memory operations, tool traces, recovery state, outcome, run_id, and receipt_ref.',
    time: 'Live',
  },
  {
    step: '04',
    title: 'Connect your own agent',
    desc: 'Use MCP, the TypeScript SDK, Python SDK, or REST API so your existing agent can remember and recover work.',
    time: '5 min',
  },
];

const SDK_TS = `import { MemoryMeshClient } from "@memorymsh/sdk";

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

const SDK_PY = `from memorymesh import MemoryMeshClient

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

const MCP_CONFIG = `{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "http://127.0.0.1:8000/api",
        "MM_AGENT_ID": "cursor-primary",
        "MM_PROJECT": "current-repo",
        "MM_MEMORY_BACKEND": "local_cognee"
      }
    }
  }
}`;

const API_SNIPPET = `const memory = await fetch(
  "https://api-two-blue-75.vercel.app/api/memory/recall",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_SESSION_TOKEN",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      backend: "cognee_cloud",
      dataset: "current-repo",
      query: "What decisions, failures, files, and next actions matter?"
    }),
  }
).then((r) => r.json());`;

const MEMORY_MODES = [
  {
    title: 'Demo memory',
    desc: 'Temporary preview memory. No account required. Best for first-hand product evaluation.',
    action: 'Try demo',
    backend: 'offline_mirror',
    color: '#22d3ee',
  },
  {
    title: 'Local memory',
    desc: 'Private self-hosted Cognee. Best for developers, internal teams, and sensitive project memory.',
    action: 'Open local console',
    backend: 'local_cognee',
    color: '#34d399',
  },
  {
    title: 'Cloud memory',
    desc: 'Managed Cognee Cloud. Best for persistent organisation workspaces and multi-device use.',
    action: 'Create cloud workspace',
    backend: 'cognee_cloud',
    color: '#818cf8',
  },
];

const PACKAGES = [
  { name: '@memorymsh/sdk', registry: 'npm', install: 'npm install @memorymsh/sdk', purpose: 'TypeScript and JavaScript agents, web apps, and Node services.' },
  { name: 'memorymesh-sdk', registry: 'PyPI', install: 'pip install memorymesh-sdk', purpose: 'Python workers, notebooks, backend jobs, and framework adapters.' },
  { name: '@memorymsh/mcp-server', registry: 'npm', install: 'npx -y @memorymsh/mcp-server', purpose: 'MCP-compatible agents that need recall, remember, improve, forget, and run receipts.' },
];

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
        </div>
        <span className="text-xs font-mono-ui text-muted-foreground">{label}</span>
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <pre className="hide-scrollbar overflow-x-auto p-4 text-xs leading-relaxed text-muted-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function DocsPage({ onNavigate, onEnterWorkspace }: Props) {
  const [query, setQuery] = useState('');
  const openLocalConsole = () => window.location.assign('/?mode=local');

  return (
    <div className="pt-16">
      <section className="relative overflow-hidden border-b border-border px-6 py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(129,140,248,0.05) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-mono-ui uppercase tracking-widest text-primary">Documentation</p>
          <h1 className="mb-5 font-display text-5xl text-foreground">
            Start with memory that agents can actually use.
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Pick Demo, Local, or Cloud, run a receipt-backed agent, then connect your own tool through SDK, MCP, or API.
          </p>

          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search docs..."
              className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onEnterWorkspace} className="rounded-full border border-primary/30 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/10">
              Try demo
            </button>
            <button onClick={openLocalConsole} className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground">
              Local console
            </button>
            <button onClick={() => onNavigate('memory')} className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground">
              Memory modes
            </button>
            <button onClick={() => onNavigate('agents')} className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground">
              Agent setup
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Quick start</h2>
            <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-0.5 text-xs text-green-400">Start here</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {QUICK_START_STEPS.map((step) => (
              <div key={step.step} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-mono-ui text-xs text-primary/60">{step.step}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {step.time}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Entry points</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {MEMORY_MODES.map((mode) => (
              <div key={mode.title} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-mono-ui text-muted-foreground">{mode.backend}</span>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: mode.color }} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{mode.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{mode.desc}</p>
                <button
                  onClick={mode.backend === 'local_cognee' ? openLocalConsole : mode.backend === 'offline_mirror' ? onEnterWorkspace : () => onNavigate('pricing')}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
                >
                  {mode.action}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Install packages</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PACKAGES.map((pkg) => (
              <div key={pkg.name} className="rounded-xl border border-border bg-card p-5">
                <p className="mb-2 text-xs font-mono-ui text-primary">{pkg.registry}</p>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{pkg.name}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{pkg.purpose}</p>
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <code>{pkg.install}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold text-foreground">MCP setup</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              MCP is the fastest path for existing agent clients. Point it at local Cognee for private development or at your deployed API for managed cloud memory.
            </p>
            <CodeBlock label=".cursor/mcp.json">{MCP_CONFIG}</CodeBlock>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-green-400" />
              <h2 className="font-semibold text-foreground">REST API</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use the REST API for custom runtimes, internal workflow services, or direct memory lifecycle calls.
            </p>
            <CodeBlock label="recall.ts">{API_SNIPPET}</CodeBlock>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-400" />
              <h2 className="font-semibold text-foreground">TypeScript SDK</h2>
            </div>
            <CodeBlock label="agent.ts">{SDK_TS}</CodeBlock>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-400" />
              <h2 className="font-semibold text-foreground">Python SDK</h2>
            </div>
            <CodeBlock label="agent.py">{SDK_PY}</CodeBlock>
          </div>
        </section>

        <section className="mt-16 rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            <h2 className="font-semibold text-foreground">Production checklist</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Use Authorization for signed user sessions or X-MemoryMesh-API-Key for API-key deployments.',
              'Choose local_cognee, cognee_cloud, or offline_mirror intentionally.',
              'Use stable dataset and session ids for recallable project memory.',
              'Wrap important tools so receipts include evidence and tool traces.',
              'Use idempotency keys for write or external actions.',
              'Return receipt_ref to humans and downstream systems for audit.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
