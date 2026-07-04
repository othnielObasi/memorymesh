import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
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

type GuideKey = 'quick' | 'mcp' | 'api' | 'sdk' | 'memory' | 'security';

type Step = {
  title: string;
  body: string;
};

type Guide = {
  key: GuideKey;
  title: string;
  label: string;
  eyebrow: string;
  summary: string;
  icon: typeof Zap;
  color: string;
  answers: string[];
  steps: Step[];
  done: string[];
  code?: {
    label: string;
    language: string;
    value: string;
  }[];
};

const MCP_SNIPPET = `{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "https://api-two-blue-75.vercel.app/api",
        "MM_API_KEY": "your-memorymesh-api-key",
        "MM_API_KEY_HEADER": "X-MemoryMesh-API-Key",
        "MM_MEMORY_BACKEND": "cognee_cloud",
        "MM_PROJECT": "current-repo"
      }
    }
  }
}`;

const API_SNIPPET = `// Create a scoped service key after bootstrap.
await fetch("https://api-two-blue-75.vercel.app/api/enterprise/api-keys", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-MemoryMesh-API-Key": process.env.MEMORYMESH_OWNER_KEY
  },
  body: JSON.stringify({
    name: "cursor-agent",
    role: "developer"
  })
});

// Verify the key resolves to the expected tenant and scopes.
await fetch("https://api-two-blue-75.vercel.app/api/enterprise/context", {
  headers: {
    "X-MemoryMesh-API-Key": process.env.MEMORYMESH_API_KEY
  }
});`;

const REST_SNIPPET = `const receipt = await fetch("https://api-two-blue-75.vercel.app/api/agents/run", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-MemoryMesh-API-Key": process.env.MEMORYMESH_API_KEY
  },
  body: JSON.stringify({
    agent_id: "research",
    backend: "cognee_cloud",
    dataset: "current-repo",
    task: "Summarize the decisions and unresolved risks in this project."
  })
}).then((response) => response.json());

console.log(receipt.final_output);
console.log(receipt.receipt_ref);`;

const SDK_INSTALL_SNIPPET = `npm install @memorymsh/sdk
pip install memorymesh-sdk
npx -y @memorymsh/mcp-server`;

const TS_SDK_SNIPPET = `import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: "https://api-two-blue-75.vercel.app",
  apiKey: process.env.MEMORYMESH_API_KEY,
  defaultMemoryBackend: "cognee_cloud"
});

await client.health();
await client.memoryStatus("cognee_cloud", true);

const receipt = await client.runAgent({
  agentId: "build",
  backend: "cognee_cloud",
  dataset: "current-repo",
  task: "Refactor the auth module and remember the important constraints."
});`;

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
    backend="cognee_cloud",
    dataset="support-queue",
    task="Investigate unresolved billing tickets.",
)`;

const MEMORY_SNIPPET = `await client.remember({
  dataset: "current-repo",
  sessionId: "auth-refactor",
  text: "Do not remove password fallback until all tenants migrate.",
  metadata: { source: "review", priority: "high" }
});

const matches = await client.recall({
  dataset: "current-repo",
  sessionId: "auth-refactor",
  query: "What constraints matter before editing authentication?",
  topK: 3
});`;

const GUIDES: Guide[] = [
  {
    key: 'quick',
    title: 'Start correctly',
    label: 'Quick start',
    eyebrow: 'Adoption path',
    summary: 'Decide whether to evaluate, self-host, or connect team memory before installing anything.',
    icon: Zap,
    color: '#818cf8',
    answers: [
      'Which MemoryMesh mode should I use first?',
      'What should a successful first run prove?',
      'When should I move from demo to local or cloud?',
    ],
    steps: [
      {
        title: 'Use demo for product evaluation',
        body: 'Demo memory is temporary and needs no account. It should help a reviewer understand the workflow: choose an agent, run a task, inspect the receipt, then ask a follow-up question.',
      },
      {
        title: 'Use local memory for private projects',
        body: 'Local mode is for developers and teams that need project memory to stay inside their machine or network. It should connect to a local project and use local_cognee as the memory backend.',
      },
      {
        title: 'Use cloud memory for shared teams',
        body: 'Cloud mode is for organisations that need shared memory, API keys, tenant context, backups, and service integrations. This path uses cognee_cloud.',
      },
      {
        title: 'Judge the first run by the receipt',
        body: 'A useful run returns final_output, receipt_ref, memory operations, backend status, and enough context to prove that the next run can reuse what happened before.',
      },
    ],
    done: [
      'You know whether the next step is Demo, Local, or Cloud.',
      'You can explain why MemoryMesh stores run memory instead of only returning a chat response.',
      'You have a receipt-backed run to inspect.',
    ],
  },
  {
    key: 'mcp',
    title: 'Connect an MCP client',
    label: 'MCP integration',
    eyebrow: 'Cursor, OpenCode, Claude',
    summary: 'Expose MemoryMesh tools inside an agent host without replacing the developer workflow.',
    icon: Terminal,
    color: '#22d3ee',
    answers: [
      'How do I add MemoryMesh to Cursor, OpenCode, Claude, or another MCP host?',
      'Which tools should the host expose?',
      'How do I check the connection before using memory?',
    ],
    steps: [
      {
        title: 'Install the MCP server in the host config',
        body: 'Use @memorymsh/mcp-server through npx. Point MM_API_URL at the deployed API including /api, then provide MM_API_KEY and MM_API_KEY_HEADER.',
      },
      {
        title: 'Verify the tool list',
        body: 'The host should expose memorymesh_status, memorymesh_start_session, memorymesh_remember, memorymesh_recall, memorymesh_improve, memorymesh_forget, memorymesh_run_agent, and memorymesh_session_summary.',
      },
      {
        title: 'Start with status, then recall',
        body: 'Call memorymesh_status before relying on recall or run_agent. This catches missing API keys, backend issues, or wrong memory mode early.',
      },
    ],
    done: [
      'The MCP host lists MemoryMesh tools.',
      'memorymesh_status reports the active backend.',
      'A host-agent task creates a receipt_ref.',
    ],
    code: [{ label: '.cursor/mcp.json', language: 'JSON', value: MCP_SNIPPET }],
  },
  {
    key: 'api',
    title: 'Use the REST API',
    label: 'REST API',
    eyebrow: 'HTTP and tenants',
    summary: 'Create tenants, issue scoped API keys, call agent and memory endpoints, and audit the result.',
    icon: Code2,
    color: '#34d399',
    answers: [
      'How do services authenticate to MemoryMesh?',
      'Where do tenant, workspace, project, and role scopes come from?',
      'Which endpoints should a backend team wire first?',
    ],
    steps: [
      {
        title: 'Bootstrap the first organisation',
        body: 'Production bootstrap creates the organisation, workspace, project, and owner key. Use a bootstrap token in production so public users cannot create owner tenants.',
      },
      {
        title: 'Create scoped service keys',
        body: 'Use /api/enterprise/api-keys to create keys for IDE agents, CI workers, internal apps, or MCP clients. Send keys with X-MemoryMesh-API-Key.',
      },
      {
        title: 'Resolve context before writes',
        body: 'Call /api/enterprise/context to confirm the key resolves to the expected tenant, role, scopes, and auth mode before running memory or agent operations.',
      },
      {
        title: 'Store receipt_ref externally',
        body: 'Attach receipt_ref to the ticket, pull request, job, incident, or workflow that triggered the run. This is the audit pointer users can return to later.',
      },
    ],
    done: [
      'X-MemoryMesh-API-Key resolves to the correct tenant.',
      'Invalid keys return 401 and missing scopes return 403.',
      'Agent runs return structured receipts, not plain text only.',
    ],
    code: [
      { label: 'api-keys.ts', language: 'TypeScript', value: API_SNIPPET },
      { label: 'agent-run.ts', language: 'TypeScript', value: REST_SNIPPET },
    ],
  },
  {
    key: 'sdk',
    title: 'Install an SDK',
    label: 'SDKs',
    eyebrow: 'TypeScript, Python, MCP',
    summary: 'Use published packages when you want typed helpers instead of raw HTTP calls.',
    icon: Package,
    color: '#f59e0b',
    answers: [
      'Which package should I install?',
      'How do I verify the API and memory backend?',
      'How do I run an agent from application code?',
    ],
    steps: [
      {
        title: 'Use @memorymsh/sdk for TypeScript',
        body: 'Use this package in Node services, web apps, IDE extensions, and JavaScript agent runtimes. It supports health checks, memory status, runAgent, remember, recall, tool tracing, checkpoints, event streams, and framework adapters.',
      },
      {
        title: 'Use memorymesh-sdk for Python',
        body: 'Use this package in Python workers, notebooks, backend services, and agent frameworks. It follows the same API-key model and backend names.',
      },
      {
        title: 'Use @memorymsh/mcp-server for agent hosts',
        body: 'Use MCP when the developer tool already supports an MCP server and you do not want to write integration code.',
      },
      {
        title: 'Wrap tools when actions need auditability',
        body: 'Use wrapTool in TypeScript or trace_tool in Python when custom tools need input/output traces, validation signals, checkpoints, and idempotency keys for external actions.',
      },
    ],
    done: [
      'health() confirms API reachability.',
      'memoryStatus() confirms the selected backend is ready.',
      'runAgent(), remember(), recall(), and tool tracing return structured responses.',
    ],
    code: [
      { label: 'install', language: 'Shell', value: SDK_INSTALL_SNIPPET },
      { label: '@memorymsh/sdk', language: 'TypeScript', value: TS_SDK_SNIPPET },
      { label: 'memorymesh-sdk', language: 'Python', value: PY_SDK_SNIPPET },
    ],
  },
  {
    key: 'memory',
    title: 'Understand memory modes',
    label: 'Memory concepts',
    eyebrow: 'Cognee-backed memory',
    summary: 'MemoryMesh sits above Cognee and turns memory into a workflow surface developers can operate.',
    icon: Brain,
    color: '#c084fc',
    answers: [
      'How is MemoryMesh different from Cognee?',
      'What do demo, local_cognee, and cognee_cloud mean?',
      'How should memory be scoped for repos, tickets, incidents, and research?',
    ],
    steps: [
      {
        title: 'Cognee is the memory engine',
        body: 'Cognee handles memory and graph-backed retrieval. MemoryMesh adds mode selection, developer-facing workflows, receipts, agent run state, tool traces, and SDK/MCP/API surfaces.',
      },
      {
        title: 'Choose the backend by privacy and collaboration',
        body: 'offline_mirror is for demos and tests. local_cognee is for private self-hosted memory. cognee_cloud is for managed organisation memory.',
      },
      {
        title: 'Scope memory intentionally',
        body: 'Use dataset for repo, customer, support queue, knowledge area, or workflow. Use sessionId for a task, investigation, incident, or project phase. Avoid placing secrets in either field.',
      },
    ],
    done: [
      'The selected backend is visible in the run receipt.',
      'Recall returns records scoped to the active dataset and session.',
      'Receipts show what was remembered, recalled, improved, or forgotten.',
    ],
    code: [{ label: 'memory.ts', language: 'TypeScript', value: MEMORY_SNIPPET }],
  },
  {
    key: 'security',
    title: 'Ship securely',
    label: 'Privacy & security',
    eyebrow: 'Keys, roles, audit',
    summary: 'Use tenant-scoped keys, role scopes, backend probes, and receipt audit trails before production use.',
    icon: Shield,
    color: '#34d399',
    answers: [
      'How are API keys handled?',
      'How do teams keep local project memory private?',
      'What should be checked before production?',
    ],
    steps: [
      {
        title: 'Use scoped API keys',
        body: 'Create one key per integration. API keys are returned once, stored as hashes, and resolved to tenant context on each request.',
      },
      {
        title: 'Prefer least privilege',
        body: 'Use roles and scopes for memory reads, memory writes, run creation, tool execution, gateway access, and admin operations. Do not reuse owner keys in tools.',
      },
      {
        title: 'Keep sensitive work local when needed',
        body: 'Use local_cognee when source code, customer data, or investigation context should not leave your machine or private network.',
      },
      {
        title: 'Audit with receipts',
        body: 'A production workflow should store receipt_ref beside the external event. That keeps the answer, context, memory operations, and run state traceable.',
      },
    ],
    done: [
      'API keys are stored as hashes and never displayed after creation.',
      '401 and 403 failures are clear and intentional.',
      'Every important workflow keeps receipt_ref for audit.',
    ],
  },
];

const GUIDE_LOOKUP = Object.fromEntries(GUIDES.map((guide) => [guide.key, guide])) as Record<GuideKey, Guide>;

function CodeBlock({ label, language, children }: { label: string; language: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#090d16]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs font-mono-ui text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{language}</span>
      </div>
      <pre className="hide-scrollbar max-h-[520px] overflow-auto p-5 text-[13px] leading-relaxed text-[#90a0c7] font-mono-ui">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function GuideChecklist({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <p className="mb-3 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="flex gap-2 rounded-lg border border-border bg-muted/10 p-3 text-sm leading-relaxed text-[#92a3cd]">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0" style={{ color }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocsPage({ onNavigate, onEnterWorkspace }: Props) {
  const [activeKey, setActiveKey] = useState<GuideKey>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const activeGuide = GUIDE_LOOKUP[activeKey];

  const filteredGuides = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return GUIDES;
    return GUIDES.filter((guide) => {
      return [
        guide.title,
        guide.label,
        guide.eyebrow,
        guide.summary,
        ...guide.answers,
        ...guide.steps.map((step) => `${step.title} ${step.body}`),
        ...guide.done,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [searchQuery]);

  const openLocalConsole = () => window.location.assign('/?mode=local');

  return (
    <div className="pt-16">
      <section className="border-b border-border px-6 py-14">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,780px)_380px] lg:items-end lg:justify-between">
            <div>
              <p className="mb-4 text-xs font-mono-ui uppercase tracking-widest text-primary">Documentation</p>
              <h1 className="mb-5 max-w-[760px] font-display text-5xl text-foreground">
                Build agents that remember what matters.
              </h1>
              <p className="max-w-[720px] text-lg leading-relaxed text-[#91a3cc]">
                MemoryMesh gives coding agents a durable memory layer, with demo, local, and cloud modes, plus MCP, SDK, and REST interfaces for real developer workflows.
              </p>
            </div>

            <div className="border-l border-border pl-6">
              <p className="mb-4 text-sm font-semibold text-foreground">Start by choosing the path that matches your job.</p>
              <div className="space-y-2 text-sm">
                <button onClick={onEnterWorkspace} className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-[#91a3cc] hover:border-primary/40 hover:text-foreground">
                  <span><span className="text-foreground">Demo</span> <span className="text-muted-foreground">/ evaluate without setup</span></span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button onClick={openLocalConsole} className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-[#91a3cc] hover:border-primary/40 hover:text-foreground">
                  <span><span className="text-foreground">Local</span> <span className="text-muted-foreground">/ keep memory private</span></span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onNavigate('memory')} className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-[#91a3cc] hover:border-primary/40 hover:text-foreground">
                  <span><span className="text-foreground">Cloud</span> <span className="text-muted-foreground">/ share team memory</span></span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 relative max-w-[760px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search docs by mode, SDK, MCP, API keys, privacy..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-4 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">Guides</p>
            <nav className="space-y-1">
              {filteredGuides.map((guide) => {
                const Icon = guide.icon;
                const active = guide.key === activeKey;
                return (
                  <button
                    key={guide.key}
                    type="button"
                    onClick={() => setActiveKey(guide.key)}
                    className={`w-full rounded-lg border-l-2 px-3 py-3 text-left transition-colors ${
                      active
                        ? 'border-primary bg-primary/8 text-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: guide.color }} />
                      <span className="text-sm font-medium">{guide.label}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{guide.eyebrow}</span>
                  </button>
                );
              })}
              {filteredGuides.length === 0 && (
                <p className="rounded-lg border border-border px-3 py-3 text-xs text-muted-foreground">No matching guide.</p>
              )}
            </nav>

            <div className="mt-8 border-t border-border pt-6">
              <p className="mb-3 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">API key model</p>
              <div className="space-y-2 text-xs leading-relaxed text-[#91a3cc]">
                <p><span className="text-foreground">Header:</span> X-MemoryMesh-API-Key</p>
                <p><span className="text-foreground">Bearer:</span> Authorization</p>
                <p><span className="text-foreground">Create:</span> /api/enterprise/api-keys</p>
                <p><span className="text-foreground">Verify:</span> /api/enterprise/context</p>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <article className="rounded-xl border border-border bg-card">
              <header className="border-b border-border p-8">
                <div className="mb-5 flex items-start justify-between gap-5">
                  <div>
                    <p className="mb-3 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">{activeGuide.eyebrow}</p>
                    <h2 className="text-3xl font-semibold text-foreground">{activeGuide.title}</h2>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20">
                    <activeGuide.icon className="h-5 w-5" style={{ color: activeGuide.color }} />
                  </div>
                </div>
                <p className="max-w-4xl text-base leading-relaxed text-[#91a3cc]">{activeGuide.summary}</p>
              </header>

              <div className="p-8">
                <div className="min-w-0 space-y-10">
                  <section>
                    <p className="mb-4 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">What this answers</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {activeGuide.answers.map((answer) => (
                        <div key={answer} className="border-t border-border pt-3 text-sm leading-relaxed text-[#91a3cc]">
                          {answer}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <p className="text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">Implementation guide</p>
                    {activeGuide.steps.map((step, index) => (
                      <div key={step.title} className="grid gap-4 border-t border-border pt-5 sm:grid-cols-[52px_minmax(0,1fr)]">
                        <span className="font-mono-ui text-sm text-primary/70">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                          <p className="max-w-3xl text-[15px] leading-relaxed text-[#91a3cc]">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </section>

                  {activeGuide.code && (
                    <section className="space-y-4">
                      <p className="text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">Example</p>
                      {activeGuide.code.map((snippet) => (
                        <CodeBlock key={snippet.label} label={snippet.label} language={snippet.language}>
                          {snippet.value}
                        </CodeBlock>
                      ))}
                    </section>
                  )}

                  <GuideChecklist title="Definition of done" items={activeGuide.done} color={activeGuide.color} />

                  <div className="grid gap-6 border-t border-border pt-6 md:grid-cols-2">
                    <div>
                    <p className="mb-3 text-xs font-mono-ui uppercase tracking-widest text-muted-foreground">Related actions</p>
                    <div className="space-y-2">
                      {[
                        ['Try demo', onEnterWorkspace],
                        ['Open local console', openLocalConsole],
                        ['Memory modes', () => onNavigate('memory')],
                        ['Agents', () => onNavigate('agents')],
                      ].map(([label, action]) => (
                        <button
                          key={label as string}
                          type="button"
                          onClick={action as () => void}
                          className="group flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <span>{label as string}</span>
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                    </div>

                    <div>
                    <div className="mb-3 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Production note</p>
                    </div>
                    <p className="max-w-md text-sm leading-relaxed text-[#91a3cc]">
                      Cloud and service integrations should use scoped API keys. Local mode should keep source and customer context inside the local deployment.
                    </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </main>
        </div>
      </section>
    </div>
  );
}
