import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  KeyRound,
  Package,
  Search,
  Shield,
  Terminal,
  Zap,
} from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

type SectionKey = 'quick' | 'mcp' | 'api' | 'sdk' | 'memory' | 'security';

const SECTION_ORDER: SectionKey[] = ['quick', 'mcp', 'api', 'sdk', 'memory', 'security'];

const SECTIONS: Record<
  SectionKey,
  {
    icon: typeof Zap;
    color: string;
    title: string;
    shortTitle: string;
    summary: string;
    outcome: string;
    details: string[];
    verify: string;
    id: string;
  }
> = {
  quick: {
    icon: Zap,
    color: '#818cf8',
    title: 'Quick start',
    shortTitle: 'Quick start',
    summary: 'Run a real demo, inspect the receipt, then choose Demo, Local, or Cloud memory.',
    outcome: 'In five minutes, a developer should know what MemoryMesh does, how memory is stored, and how a run can be verified.',
    details: [
      'Use demo memory first. It requires no login and proves the workflow without setup.',
      'Run Build, Research, or Support so the output is a receipt, not a disposable chat answer.',
      'Inspect run_id, receipt_ref, memory_operations, evidence, checkpoints, and final_output.',
      'Move to local_cognee for private self-hosting or cognee_cloud for managed shared memory.',
    ],
    verify: 'A useful first run returns final_output plus memory_operations and receipt_ref.',
    id: 'docs-quick-start',
  },
  mcp: {
    icon: Terminal,
    color: '#22d3ee',
    title: 'MCP integration',
    shortTitle: 'MCP setup',
    summary: 'Connect Cursor, OpenCode, or any MCP-compatible client through the MemoryMesh MCP server.',
    outcome: 'Existing agents can call MemoryMesh tools without replacing their runtime.',
    details: [
      'Run @memorymsh/mcp-server through npx from the host agent.',
      'Point MM_API_URL at your MemoryMesh API and include /api.',
      'Use MM_API_KEY_HEADER=X-MemoryMesh-API-Key for service keys or Authorization for bearer sessions.',
      'Call memorymesh_status before relying on recall, remember, improve, forget, or run_agent.',
    ],
    verify: 'The MCP client should list memorymesh_status, memorymesh_recall, memorymesh_remember, and memorymesh_run_agent.',
    id: 'docs-mcp',
  },
  api: {
    icon: Code2,
    color: '#34d399',
    title: 'REST API',
    shortTitle: 'API reference',
    summary: 'Use HTTP endpoints for custom agents, internal services, tenants, API keys, and receipts.',
    outcome: 'A backend team should be able to create a tenant, issue a scoped key, call MemoryMesh, and audit the result.',
    details: [
      'POST /api/enterprise/bootstrap creates the first organisation, workspace, project, and owner API key.',
      'POST /api/enterprise/api-keys creates additional hashed keys with role-based scopes.',
      'Use X-MemoryMesh-API-Key by default. Bearer session tokens are accepted through Authorization.',
      'Store receipt_ref with the external job, ticket, PR, or workflow that triggered the agent.',
    ],
    verify: 'GET /api/enterprise/context should return the resolved tenant, role, scopes, and auth mode.',
    id: 'docs-api',
  },
  sdk: {
    icon: Package,
    color: '#f59e0b',
    title: 'SDKs',
    shortTitle: 'SDKs',
    summary: 'Use TypeScript, Python, or MCP packages instead of hand-writing integration code.',
    outcome: 'Developers should know which package to install, how it authenticates, and how to record memory operations.',
    details: [
      '@memorymsh/sdk is for TypeScript, JavaScript, Node services, and web apps.',
      'memorymesh-sdk is for Python workers, notebooks, backend services, and agent frameworks.',
      '@memorymsh/mcp-server is for host tools that already support MCP.',
      'Both SDKs default to X-MemoryMesh-API-Key and can switch to Authorization when needed.',
    ],
    verify: 'A working SDK call should pass health(), memoryStatus(), runAgent(), remember(), and recall().',
    id: 'docs-sdks',
  },
  memory: {
    icon: Brain,
    color: '#c084fc',
    title: 'Memory concepts',
    shortTitle: 'Memory concepts',
    summary: 'Understand backends, datasets, sessions, operations, and Cognee-backed recall.',
    outcome: 'A developer should understand where memory lives and how an agent uses it across sessions.',
    details: [
      'local_cognee keeps memory on self-hosted infrastructure.',
      'cognee_cloud uses managed Cognee Cloud for persistent organisation memory.',
      'offline_mirror is for demos, tests, and fallback when Cognee is unavailable.',
      'Datasets and session_id keep memory scoped to a repo, customer, workflow, or investigation.',
    ],
    verify: 'memory_status(backend, probe=true) should report readiness before production use.',
    id: 'docs-memory',
  },
  security: {
    icon: Shield,
    color: '#34d399',
    title: 'Privacy & security',
    shortTitle: 'Privacy',
    summary: 'Know how MemoryMesh handles tenant context, keys, roles, scopes, and private memory modes.',
    outcome: 'Security teams should see how access is controlled and how sensitive work can stay private.',
    details: [
      'API keys are never stored raw; the backend stores an HMAC hash using the signing secret.',
      'Roles map to scopes such as runs:write, memory:read, tools:execute, gateways:read, and admin:manage.',
      'Signed user sessions use mms_ tokens and can be sent through Authorization.',
      'Local memory lets sensitive project context stay inside your network.',
    ],
    verify: 'Invalid keys return 401, missing scopes return 403, and audit logs record key and tenant actions.',
    id: 'docs-security',
  },
};

const QUICK_START_STEPS = [
  {
    step: '01',
    title: 'Run demo memory',
    desc: 'Open the demo workspace without login. It should create a real run receipt using temporary sample memory.',
    time: '< 1 min',
  },
  {
    step: '02',
    title: 'Choose an agent',
    desc: 'Use Build for code work, Research for source-backed findings, or Support for ticket-style investigation.',
    time: '< 1 min',
  },
  {
    step: '03',
    title: 'Inspect the receipt',
    desc: 'Check final_output, evidence, memory_operations, checkpoints, run_id, and receipt_ref.',
    time: '~30 sec',
  },
  {
    step: '04',
    title: 'Pick a memory backend',
    desc: 'Use local_cognee for private self-hosting, cognee_cloud for managed memory, or offline_mirror for demos.',
    time: '2 min',
  },
  {
    step: '05',
    title: 'Connect your own agent',
    desc: 'Install the SDK or MCP server so your existing agent can recall, remember, improve, forget, and produce receipts.',
    time: '5 min',
  },
];

const MCP_SNIPPET = `{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "https://api-two-blue-75.vercel.app/api",
        "MM_API_KEY": "your-memorymesh-api-key",
        "MM_API_KEY_HEADER": "X-MemoryMesh-API-Key",
        "MM_AGENT_ID": "cursor-primary",
        "MM_PROJECT": "current-repo",
        "MM_MEMORY_BACKEND": "cognee_cloud"
      }
    }
  }
}`;

const API_KEY_SNIPPET = `// 1. Bootstrap the first tenant and owner key.
await fetch("https://api-two-blue-75.vercel.app/api/enterprise/bootstrap", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Bootstrap-Token": process.env.BOOTSTRAP_ADMIN_TOKEN
  },
  body: JSON.stringify({ name: "Acme", slug: "acme" })
});

// 2. Use the returned owner key to create scoped service keys.
await fetch("https://api-two-blue-75.vercel.app/api/enterprise/api-keys", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-MemoryMesh-API-Key": process.env.MEMORYMESH_API_KEY
  },
  body: JSON.stringify({ name: "ci-agent", role: "developer" })
});`;

const REST_SNIPPET = `const result = await fetch("https://api-two-blue-75.vercel.app/api/memory/recall", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-MemoryMesh-API-Key": process.env.MEMORYMESH_API_KEY
  },
  body: JSON.stringify({
    backend: "cognee_cloud",
    dataset: "current-repo",
    query: "What decisions, failures, files, and next actions matter?",
    top_k: 3
  })
}).then((response) => response.json());`;

const TS_SDK_SNIPPET = `import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: process.env.MEMORYMESH_API_URL ?? "https://api-two-blue-75.vercel.app",
  apiKey: process.env.MEMORYMESH_API_KEY,
  defaultMemoryBackend: "cognee_cloud"
});

const receipt = await client.runAgent({
  agentId: "research",
  task: "Compare durable memory options for coding agents.",
  backend: "cognee_cloud"
});

console.log(receipt.final_output);
console.log(receipt.memory_operations);`;

const PY_SDK_SNIPPET = `from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url="https://api-two-blue-75.vercel.app",
    api_key=os.environ["MEMORYMESH_API_KEY"],
    default_memory_backend="cognee_cloud",
)

receipt = client.run_agent(
    agent_id="support",
    task="Investigate unresolved support tickets.",
    backend="cognee_cloud",
)

print(receipt["final_output"])
print(receipt["memory_operations"])`;

const MEMORY_SNIPPET = `await client.remember({
  text: "The build agent should preserve project constraints before editing.",
  dataset: "agent-lessons",
  sessionId: "auth-refactor-2026-07",
  metadata: { source: "human-review" }
});

const matches = await client.recall({
  query: "What should the build agent remember before editing?",
  dataset: "agent-lessons",
  sessionId: "auth-refactor-2026-07",
  topK: 3
});`;

const TOOL_TRACE_SNIPPET = `import { MemoryMeshClient, wrapTool } from "@memorymsh/sdk";

const client = new MemoryMeshClient("http://localhost:8000");
const run = await client.startRun({
  agentId: "support-agent",
  task: "Investigate payment failures."
});

const fetchTickets = wrapTool(
  client,
  run.task_id,
  async (status: string) => [{ id: "ticket_1", status }],
  {
    toolName: "fetch_tickets",
    validation: (_args, result) => ({ records: result.length }),
    checkpointAfter: true
  }
);

await fetchTickets("open");`;

const ERROR_SNIPPET = `import { MemoryMeshError } from "@memorymsh/sdk";

try {
  await client.memoryStatus("cognee_cloud", true);
} catch (error) {
  if (error instanceof MemoryMeshError) {
    console.error(error.status, error.detail ?? error.body);
  }
}`;

const CHANGELOG = [
  { date: '2026-07-04', tag: 'new', text: 'Published TypeScript SDK, Python SDK, and MCP server packages.' },
  { date: '2026-07-04', tag: 'improved', text: 'Documented API-key, bearer-session, and memory-backend usage.' },
  { date: '2026-07-04', tag: 'new', text: 'Added receipt-first examples for REST, SDK, MCP, and tool tracing.' },
];

const TAG_COLORS: Record<string, string> = {
  new: '#818cf8',
  improved: '#34d399',
  fix: '#f87171',
};

function CodeBlock({ label, language, children }: { label: string; language: string; children: string }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>
        <span className="text-xs font-mono-ui text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{language}</span>
      </div>
      <pre className="p-4 text-xs font-mono-ui text-muted-foreground overflow-x-auto hide-scrollbar leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function SectionDetail({ section }: { section: (typeof SECTIONS)[SectionKey] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <section.icon className="w-4 h-4" style={{ color: section.color }} />
        <p className="text-sm font-semibold text-foreground">{section.title}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{section.outcome}</p>
      <div className="space-y-2">
        {section.details.map((detail) => (
          <div key={detail} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: section.color }} />
            <span>{detail}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground/80 leading-relaxed">
        Verify: {section.verify}
      </p>
    </div>
  );
}

export function DocsPage({ onNavigate, onEnterWorkspace }: Props) {
  const [activeSection, setActiveSection] = useState<SectionKey>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const openLocalConsole = () => window.location.assign('/?mode=local');

  const visibleSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return SECTION_ORDER;
    return SECTION_ORDER.filter((key) => {
      const section = SECTIONS[key];
      return [section.title, section.shortTitle, section.summary, section.outcome, ...section.details]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [searchQuery]);

  const openSection = (section: SectionKey) => {
    setActiveSection(section);
    window.setTimeout(() => {
      document.getElementById(SECTIONS[section].id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const activeDetail = SECTIONS[activeSection];

  return (
    <div className="pt-16">
      <section className="px-6 py-20 relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(129,140,248,0.05) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Documentation</p>
          <h1 className="font-display text-5xl text-foreground mb-5">
            Everything needed to integrate MemoryMesh.
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Start with a demo, choose a memory backend, connect through MCP, API, or SDK, then verify every run with a receipt.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono-ui">
              <span className="px-1.5 py-0.5 border border-border rounded bg-muted/30">Ctrl</span>
              <span className="px-1.5 py-0.5 border border-border rounded bg-muted/30">K</span>
            </kbd>
          </div>

          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {(['quick', 'mcp', 'api', 'sdk'] as SectionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => openSection(key)}
                className={`text-xs border px-3 py-1.5 rounded-full transition-all ${
                  activeSection === key
                    ? 'text-foreground border-primary/40 bg-primary/8'
                    : 'text-muted-foreground border-border hover:text-foreground hover:border-foreground/15'
                }`}
              >
                {SECTIONS[key].shortTitle}
              </button>
            ))}
          </div>

          <div className="mt-5 text-left">
            <SectionDetail section={activeDetail} />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12 py-16">
          <div className="lg:col-span-2 space-y-16">
            <div id={SECTIONS.quick.id} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Quick start - 5 minutes</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Start here</span>
              </div>

              <div className="space-y-3">
                {QUICK_START_STEPS.map((step) => (
                  <div key={step.step} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex items-start gap-4 px-5 py-4">
                      <span className="font-mono-ui text-xs text-primary/50 mt-0.5 w-6 shrink-0">{step.step}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <span className="font-medium text-sm text-foreground">{step.title}</span>
                          <span className="text-xs font-mono-ui text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <button
                  onClick={onEnterWorkspace}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
                >
                  Try demo
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={openLocalConsole}
                  className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/30 transition-all"
                >
                  Local console
                </button>
                <span className="text-xs text-muted-foreground">No account required for demo.</span>
              </div>
            </div>

            <div id={SECTIONS.mcp.id} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h2 className="font-semibold text-foreground">MCP integration</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Use MCP when the host agent already supports tools. The MCP server is a bridge; MemoryMesh API remains the system of record.
              </p>
              <CodeBlock label=".cursor/mcp.json" language="JSON">{MCP_SNIPPET}</CodeBlock>
            </div>

            <div id={SECTIONS.api.id} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                  <Code2 className="w-3.5 h-3.5 text-green-400" />
                </div>
                <h2 className="font-semibold text-foreground">REST API and API keys</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                API-key deployments use `X-MemoryMesh-API-Key` by default. The backend stores only hashed keys, resolves tenant context from the key, and checks role scopes before privileged operations.
              </p>
              <div className="grid gap-4">
                <CodeBlock label="api-keys.ts" language="TypeScript">{API_KEY_SNIPPET}</CodeBlock>
                <CodeBlock label="recall.ts" language="TypeScript">{REST_SNIPPET}</CodeBlock>
              </div>
            </div>

            <div id={SECTIONS.sdk.id} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h2 className="font-semibold text-foreground">SDKs</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The published SDK docs are reflected here: install, authenticate, run agents, remember, recall, trace tools, and handle errors.
              </p>
              <div className="grid gap-4">
                <CodeBlock label="@memorymsh/sdk" language="TypeScript">{TS_SDK_SNIPPET}</CodeBlock>
                <CodeBlock label="memorymesh-sdk" language="Python">{PY_SDK_SNIPPET}</CodeBlock>
                <CodeBlock label="tool-tracing.ts" language="TypeScript">{TOOL_TRACE_SNIPPET}</CodeBlock>
                <CodeBlock label="errors.ts" language="TypeScript">{ERROR_SNIPPET}</CodeBlock>
              </div>
            </div>

            <div id={SECTIONS.memory.id} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h2 className="font-semibold text-foreground">Memory concepts</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                MemoryMesh sits on top of Cognee memory. It adds the developer-facing workflow: backends, datasets, session boundaries, operations, receipts, checkpoints, and recovery state.
              </p>
              <CodeBlock label="memory.ts" language="TypeScript">{MEMORY_SNIPPET}</CodeBlock>
            </div>

            <div id={SECTIONS.security.id} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                </div>
                <h2 className="font-semibold text-foreground">Privacy & security</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Use X-MemoryMesh-API-Key for service integrations and Authorization for signed user sessions.',
                    'Use local_cognee when memory must stay inside your network.',
                    'Use role scopes for least-privilege automation keys.',
                    'Keep dataset and session ids stable but avoid placing secrets inside them.',
                    'Store receipt_ref for audit and incident reconstruction.',
                    'Probe memory_status before relying on Cognee Cloud or local Cognee in production.',
                  ].map((tip) => (
                    <div key={tip} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-4">Documentation</h3>
              <div className="space-y-1">
                {visibleSections.map((key) => {
                  const section = SECTIONS[key];
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => openSection(key)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                          activeSection === key ? 'bg-primary/8 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <section.icon className="w-3.5 h-3.5 shrink-0" style={{ color: section.color }} />
                          <span className="text-sm">{section.title}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSection === key ? 'rotate-90' : ''}`} />
                      </button>
                      {activeSection === key && (
                        <div className="mt-2 mb-3 ml-6">
                          <SectionDetail section={section} />
                        </div>
                      )}
                    </div>
                  );
                })}
                {visibleSections.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matching doc section.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <KeyRound className="w-5 h-5 text-primary mb-3" />
              <h4 className="text-sm font-semibold text-foreground mb-1.5">API key model</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Keys are created once, returned once, stored as hashes, and checked against tenant context plus role scopes.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><span className="text-foreground">Header:</span> X-MemoryMesh-API-Key</p>
                <p><span className="text-foreground">Bearer:</span> Authorization</p>
                <p><span className="text-foreground">Create:</span> /api/enterprise/api-keys</p>
                <p><span className="text-foreground">Verify:</span> /api/enterprise/context</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-4">Recent changes</h3>
              <div className="space-y-3">
                {CHANGELOG.map((item) => (
                  <div key={`${item.date}-${item.text}`} className="flex items-start gap-3">
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

            <div className="rounded-xl border border-border bg-card p-5">
              <BookOpen className="w-5 h-5 text-primary mb-3" />
              <h4 className="text-sm font-semibold text-foreground mb-1.5">Adoption order</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Demo first, local or cloud backend second, package integration third, production scopes last.
              </p>
              <div className="space-y-2">
                {[
                  ['Demo', onEnterWorkspace],
                  ['Memory modes', () => onNavigate('memory')],
                  ['Agent setup', () => onNavigate('agents')],
                  ['Pricing', () => onNavigate('pricing')],
                ].map(([label, action]) => (
                  <button
                    key={label as string}
                    type="button"
                    onClick={action as () => void}
                    className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span>{label as string}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
