import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
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

type DocSection = {
  id: string;
  icon: typeof Zap;
  color: string;
  title: string;
  shortTitle: string;
  summary: string;
  goal: string;
  useWhen: string[];
  doThis: string[];
  verify: string[];
};

const SECTION_ORDER: SectionKey[] = ['quick', 'mcp', 'api', 'sdk', 'memory', 'security'];

const SECTIONS: Record<SectionKey, DocSection> = {
  quick: {
    id: 'docs-quick-start',
    icon: Zap,
    color: '#818cf8',
    title: 'Quick start',
    shortTitle: 'Quick start',
    summary: 'Choose demo, local, or cloud memory, then run one receipt-backed agent flow.',
    goal: 'Get from zero to a verified MemoryMesh run without guessing which mode or package to use.',
    useWhen: [
      'You are evaluating MemoryMesh for the first time.',
      'You need to show a team how agent memory becomes a reusable receipt.',
      'You want to decide between temporary demo memory, private local memory, or managed cloud memory.',
    ],
    doThis: [
      'Run the demo first if you want a no-login preview.',
      'Use local memory when project context must stay inside your machine or network.',
      'Use cloud memory when a team needs shared, managed memory and API keys.',
      'After the first run, inspect final_output, receipt_ref, memory_operations, evidence, and checkpoints.',
    ],
    verify: [
      'A successful run returns a final answer plus receipt_ref.',
      'The receipt includes the memory backend used for the run.',
      'A second run can recall prior context instead of starting from zero.',
    ],
  },
  mcp: {
    id: 'docs-mcp',
    icon: Terminal,
    color: '#22d3ee',
    title: 'MCP integration',
    shortTitle: 'MCP setup',
    summary: 'Connect Cursor, OpenCode, Claude, or another MCP-compatible host to MemoryMesh.',
    goal: 'Let existing coding agents use durable memory without replacing the tool developers already work in.',
    useWhen: [
      'Your agent host supports MCP tools.',
      'You want MemoryMesh available inside Cursor, OpenCode, Claude, or a custom MCP client.',
      'You need recall, remember, improve, forget, and run receipts from the host agent.',
    ],
    doThis: [
      'Install @memorymsh/mcp-server through npx in the host MCP config.',
      'Set MM_API_URL to the MemoryMesh API base including /api.',
      'Pass MM_API_KEY with MM_API_KEY_HEADER=X-MemoryMesh-API-Key for service access.',
      'Call memorymesh_status before depending on memorymesh_recall or memorymesh_run_agent.',
    ],
    verify: [
      'The MCP client lists memorymesh_status, memorymesh_remember, memorymesh_recall, memorymesh_improve, memorymesh_forget, and memorymesh_run_agent.',
      'memorymesh_status returns the selected backend and readiness.',
      'A host-agent task creates a receipt instead of only a chat answer.',
    ],
  },
  api: {
    id: 'docs-api',
    icon: Code2,
    color: '#34d399',
    title: 'REST API',
    shortTitle: 'API reference',
    summary: 'Use HTTP endpoints for tenants, API keys, memory operations, agent runs, and receipts.',
    goal: 'Give backend teams a clear, auditable way to wire MemoryMesh into products, internal tools, and agent workers.',
    useWhen: [
      'You are building your own integration instead of using an SDK.',
      'You need tenant-aware API keys and service-to-service calls.',
      'You want receipts and memory operations stored next to tickets, PRs, jobs, or workflow runs.',
    ],
    doThis: [
      'Bootstrap the first organisation, workspace, project, and owner key with /api/enterprise/bootstrap.',
      'Create scoped service keys with /api/enterprise/api-keys.',
      'Send keys with X-MemoryMesh-API-Key. Use Authorization only for bearer sessions.',
      'Store receipt_ref on the external object that triggered the run.',
    ],
    verify: [
      'GET /api/enterprise/context resolves the tenant, role, scopes, and auth mode.',
      'Invalid keys return 401 and missing scopes return 403.',
      'Each run response includes a stable identifier that can be audited later.',
    ],
  },
  sdk: {
    id: 'docs-sdks',
    icon: Package,
    color: '#f59e0b',
    title: 'SDKs',
    shortTitle: 'SDKs',
    summary: 'Use TypeScript, Python, or MCP packages instead of hand-writing boilerplate.',
    goal: 'Help developers adopt MemoryMesh in the language and agent runtime they already use.',
    useWhen: [
      'You are integrating a TypeScript app, Node service, Python worker, notebook, or agent framework.',
      'You want typed helpers for health checks, memory status, agent runs, remember, recall, and tool tracing.',
      'You need consistent error handling across teams.',
    ],
    doThis: [
      'Use @memorymsh/sdk for TypeScript and JavaScript.',
      'Use memorymesh-sdk for Python.',
      'Use @memorymsh/mcp-server for MCP hosts.',
      'Run health() and memoryStatus() before production workflows.',
    ],
    verify: [
      'health() confirms the API is reachable.',
      'memoryStatus() confirms the backend is ready.',
      'runAgent(), remember(), and recall() return structured responses, not plain strings.',
    ],
  },
  memory: {
    id: 'docs-memory',
    icon: Brain,
    color: '#c084fc',
    title: 'Memory concepts',
    shortTitle: 'Memory concepts',
    summary: 'Understand what MemoryMesh adds on top of Cognee-backed memory.',
    goal: 'Make memory understandable as a product surface: where it lives, how it is scoped, and how agents reuse it.',
    useWhen: [
      'You need to explain demo, local, and cloud memory to a technical team.',
      'You are deciding how to scope memory by repo, customer, session, workflow, or investigation.',
      'You want Cognee memory, but with developer-friendly receipts, run state, and agent workflow controls.',
    ],
    doThis: [
      'Use offline_mirror for demo and test flows.',
      'Use local_cognee for self-hosted private memory.',
      'Use cognee_cloud for managed team memory.',
      'Keep dataset and session_id stable enough for recall, but do not put secrets inside them.',
    ],
    verify: [
      'A memory probe reports the configured backend.',
      'Recall returns relevant records for the active dataset and session.',
      'Receipts show what was remembered, recalled, improved, or forgotten.',
    ],
  },
  security: {
    id: 'docs-security',
    icon: Shield,
    color: '#34d399',
    title: 'Privacy & security',
    shortTitle: 'Privacy',
    summary: 'Control tenant boundaries, API keys, roles, scopes, and private memory modes.',
    goal: 'Give security and platform teams confidence that MemoryMesh can be used without leaking project context.',
    useWhen: [
      'You are preparing a team or enterprise deployment.',
      'You need service keys for CI, IDE agents, support workers, or internal apps.',
      'You need private memory for sensitive repositories or customer investigations.',
    ],
    doThis: [
      'Create scoped API keys for each integration instead of reusing an owner key.',
      'Rotate keys from the enterprise API when a tool or developer changes access.',
      'Use local_cognee for private self-hosted memory.',
      'Treat receipt_ref as the audit pointer for every external workflow.',
    ],
    verify: [
      'API keys are stored as hashes and only shown once at creation.',
      'Role scopes restrict memory, run, tool, and admin operations.',
      'Audit data records key creation, tenant context, and run receipts.',
    ],
  },
};

const ADOPTION_PATHS = [
  {
    name: 'Demo memory',
    badge: 'No login',
    result: 'A temporary run receipt with sample memory.',
    bestFor: 'Judges, evaluators, and first-time users.',
    next: 'Move to local or cloud after the workflow makes sense.',
  },
  {
    name: 'Local memory',
    badge: 'Private',
    result: 'Self-hosted local_cognee memory for one machine or private network.',
    bestFor: 'Developers working on sensitive repositories or internal tools.',
    next: 'Connect a local project and run an agent with recall enabled.',
  },
  {
    name: 'Cloud memory',
    badge: 'Team',
    result: 'Managed cognee_cloud memory with tenant API keys.',
    bestFor: 'Teams that need shared memory, backups, and service integrations.',
    next: 'Bootstrap an organisation and create scoped API keys.',
  },
];

const FIRST_RUN_CONTRACT = [
  {
    label: 'Choose',
    value: 'Pick demo, local, or cloud memory before selecting an agent.',
  },
  {
    label: 'Run',
    value: 'Execute Build, Research, or Support against a concrete task.',
  },
  {
    label: 'Review',
    value: 'Read the answer beside its receipt, evidence, memory operations, and checkpoints.',
  },
  {
    label: 'Reuse',
    value: 'Run a follow-up task and confirm previous context is recalled instead of recreated.',
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

const API_KEY_SNIPPET = `// Bootstrap the first tenant and owner key.
await fetch("https://api-two-blue-75.vercel.app/api/enterprise/bootstrap", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Bootstrap-Token": process.env.BOOTSTRAP_ADMIN_TOKEN
  },
  body: JSON.stringify({ name: "Acme", slug: "acme" })
});

// Use the returned owner key to create scoped service keys.
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

await client.health();
await client.memoryStatus("cognee_cloud", true);

const receipt = await client.runAgent({
  agentId: "research",
  task: "Compare durable memory options for coding agents.",
  backend: "cognee_cloud"
});

console.log(receipt.final_output);
console.log(receipt.receipt_ref);
console.log(receipt.memory_operations);`;

const PY_SDK_SNIPPET = `from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url="https://api-two-blue-75.vercel.app",
    api_key=os.environ["MEMORYMESH_API_KEY"],
    default_memory_backend="cognee_cloud",
)

client.health()
client.memory_status("cognee_cloud", probe=True)

receipt = client.run_agent(
    agent_id="support",
    task="Investigate unresolved support tickets.",
    backend="cognee_cloud",
)

print(receipt["final_output"])
print(receipt["receipt_ref"])`;

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

const INTEGRATION_ORDER = [
  'Pick a memory mode: demo, local_cognee, or cognee_cloud.',
  'Verify the API with health() and memoryStatus().',
  'Connect MCP, SDK, or REST from the host agent.',
  'Run one task and store receipt_ref beside the external job.',
  'Use recall in the next run to prove memory is reusable.',
];

function CodeBlock({ label, language, children }: { label: string; language: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <span className="text-xs font-mono-ui text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{language}</span>
      </div>
      <pre className="hide-scrollbar overflow-x-auto p-4 text-xs leading-relaxed text-muted-foreground font-mono-ui">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function GuidanceBlock({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <p className="mb-3 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0" style={{ color }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ section }: { section: DocSection }) {
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
          <section.icon className="h-4 w-4" style={{ color: section.color }} />
        </div>
        <div>
          <p className="text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">{section.shortTitle}</p>
          <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
        </div>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{section.goal}</p>
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
      return [
        section.title,
        section.shortTitle,
        section.summary,
        section.goal,
        ...section.useWhen,
        ...section.doThis,
        ...section.verify,
      ]
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

  return (
    <div className="pt-16">
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-mono-ui uppercase tracking-widest text-primary">Developer documentation</p>
              <h1 className="mb-5 max-w-3xl font-display text-5xl text-foreground">
                Integrate durable agent memory without losing the proof trail.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                This guide explains the adoption path, authentication model, memory modes, SDKs, MCP server, REST API, and verification checks that make MemoryMesh usable in real developer workflows.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">Read this in order</p>
              <div className="space-y-3">
                {INTEGRATION_ORDER.map((step, index) => (
                  <div key={step} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="font-mono-ui text-xs text-primary/70">{String(index + 1).padStart(2, '0')}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search quick start, MCP, API keys, SDKs, local_cognee..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onEnterWorkspace}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                Try demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={openLocalConsole}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted/30"
              >
                Local console
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="space-y-20">
            <section id={SECTIONS.quick.id} className="scroll-mt-24">
              <SectionHeader section={SECTIONS.quick} />

              <div className="mb-8 rounded-xl border border-border bg-card p-5">
                <p className="mb-2 text-xs font-mono-ui uppercase tracking-widest text-primary">Start here</p>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Pick the memory mode before you pick the integration.</h3>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  MemoryMesh has three entry points because teams evaluate memory differently. Demo mode proves the workflow, local mode proves privacy, and cloud mode proves shared team memory with tenant API keys.
                </p>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-3">
                {ADOPTION_PATHS.map((path) => (
                  <div key={path.name} className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-foreground">{path.name}</h3>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary">
                        {path.badge}
                      </span>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{path.result}</p>
                    <div className="space-y-3 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                      <p><span className="text-foreground">Best for:</span> {path.bestFor}</p>
                      <p><span className="text-foreground">Next:</span> {path.next}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">First run contract</p>
                    <h3 className="text-lg font-semibold text-foreground">A first run is only useful when it can be checked and reused.</h3>
                  </div>
                  <span className="hidden rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-400 sm:inline-flex">
                    Receipt-backed
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  {FIRST_RUN_CONTRACT.map((item) => (
                    <div key={item.label} className="border-l border-border pl-4">
                      <p className="mb-1 text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id={SECTIONS.mcp.id} className="scroll-mt-24">
              <SectionHeader section={SECTIONS.mcp} />
              <div className="mb-6 grid gap-8 lg:grid-cols-3">
                <GuidanceBlock title="Use this when" items={SECTIONS.mcp.useWhen} color={SECTIONS.mcp.color} />
                <GuidanceBlock title="Do this" items={SECTIONS.mcp.doThis} color={SECTIONS.mcp.color} />
                <GuidanceBlock title="Verify" items={SECTIONS.mcp.verify} color={SECTIONS.mcp.color} />
              </div>
              <CodeBlock label=".cursor/mcp.json" language="JSON">{MCP_SNIPPET}</CodeBlock>
            </section>

            <section id={SECTIONS.api.id} className="scroll-mt-24">
              <SectionHeader section={SECTIONS.api} />
              <div className="mb-6 grid gap-8 lg:grid-cols-3">
                <GuidanceBlock title="Use this when" items={SECTIONS.api.useWhen} color={SECTIONS.api.color} />
                <GuidanceBlock title="Do this" items={SECTIONS.api.doThis} color={SECTIONS.api.color} />
                <GuidanceBlock title="Verify" items={SECTIONS.api.verify} color={SECTIONS.api.color} />
              </div>
              <div className="grid gap-4">
                <CodeBlock label="api-keys.ts" language="TypeScript">{API_KEY_SNIPPET}</CodeBlock>
                <CodeBlock label="recall.ts" language="TypeScript">{REST_SNIPPET}</CodeBlock>
              </div>
            </section>

            <section id={SECTIONS.sdk.id} className="scroll-mt-24">
              <SectionHeader section={SECTIONS.sdk} />
              <div className="mb-6 grid gap-8 lg:grid-cols-3">
                <GuidanceBlock title="Use this when" items={SECTIONS.sdk.useWhen} color={SECTIONS.sdk.color} />
                <GuidanceBlock title="Do this" items={SECTIONS.sdk.doThis} color={SECTIONS.sdk.color} />
                <GuidanceBlock title="Verify" items={SECTIONS.sdk.verify} color={SECTIONS.sdk.color} />
              </div>
              <div className="grid gap-4">
                <CodeBlock label="@memorymsh/sdk" language="TypeScript">{TS_SDK_SNIPPET}</CodeBlock>
                <CodeBlock label="memorymesh-sdk" language="Python">{PY_SDK_SNIPPET}</CodeBlock>
                <CodeBlock label="tool-tracing.ts" language="TypeScript">{TOOL_TRACE_SNIPPET}</CodeBlock>
                <CodeBlock label="errors.ts" language="TypeScript">{ERROR_SNIPPET}</CodeBlock>
              </div>
            </section>

            <section id={SECTIONS.memory.id} className="scroll-mt-24">
              <SectionHeader section={SECTIONS.memory} />
              <div className="mb-6 grid gap-8 lg:grid-cols-3">
                <GuidanceBlock title="Use this when" items={SECTIONS.memory.useWhen} color={SECTIONS.memory.color} />
                <GuidanceBlock title="Do this" items={SECTIONS.memory.doThis} color={SECTIONS.memory.color} />
                <GuidanceBlock title="Verify" items={SECTIONS.memory.verify} color={SECTIONS.memory.color} />
              </div>
              <CodeBlock label="memory.ts" language="TypeScript">{MEMORY_SNIPPET}</CodeBlock>
            </section>

            <section id={SECTIONS.security.id} className="scroll-mt-24">
              <SectionHeader section={SECTIONS.security} />
              <div className="grid gap-8 lg:grid-cols-3">
                <GuidanceBlock title="Use this when" items={SECTIONS.security.useWhen} color={SECTIONS.security.color} />
                <GuidanceBlock title="Do this" items={SECTIONS.security.doThis} color={SECTIONS.security.color} />
                <GuidanceBlock title="Verify" items={SECTIONS.security.verify} color={SECTIONS.security.color} />
              </div>
            </section>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div>
              <h3 className="mb-4 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">Documentation</h3>
              <div className="space-y-1">
                {visibleSections.map((key) => {
                  const section = SECTIONS[key];
                  const isActive = activeSection === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => openSection(key)}
                      className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
                        isActive ? 'bg-primary/8 text-foreground' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2.5">
                          <section.icon className="h-3.5 w-3.5 shrink-0" style={{ color: section.color }} />
                          <span className="text-sm">{section.title}</span>
                        </span>
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                      </span>
                      {isActive && <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{section.summary}</span>}
                    </button>
                  );
                })}
                {visibleSections.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matching doc section.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <KeyRound className="mb-3 h-5 w-5 text-primary" />
              <h4 className="mb-2 text-sm font-semibold text-foreground">MemoryMesh API Key</h4>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                Cloud and service integrations should use scoped API keys. Keys are returned once, stored as hashes, and resolved to tenant context on each request.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><span className="text-foreground">Header:</span> X-MemoryMesh-API-Key</p>
                <p><span className="text-foreground">Bearer:</span> Authorization</p>
                <p><span className="text-foreground">Create:</span> /api/enterprise/api-keys</p>
                <p><span className="text-foreground">Verify:</span> /api/enterprise/context</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <BookOpen className="mb-3 h-5 w-5 text-primary" />
              <h4 className="mb-2 text-sm font-semibold text-foreground">Where to go next</h4>
              <div className="space-y-2">
                {[
                  ['Try demo memory', onEnterWorkspace],
                  ['Open local console', openLocalConsole],
                  ['Choose memory mode', () => onNavigate('memory')],
                  ['Configure agents', () => onNavigate('agents')],
                ].map(([label, action]) => (
                  <button
                    key={label as string}
                    type="button"
                    onClick={action as () => void}
                    className="group flex w-full items-center justify-between text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>{label as string}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
