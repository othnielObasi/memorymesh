import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Page = "home" | "capabilities" | "architecture" | "solutions" | "developers" | "integrations" | "google" | "agent";
type ConsoleTab = "overview" | "runs" | "recovery" | "checkpoints" | "toolEvidence" | "modelRoutes" | "memory" | "audit" | "settings";

type Tone = "neutral" | "dark" | "green" | "blue" | "violet" | "amber" | "red" | "white";

type Stage = {
  id: string;
  label: string;
  eyebrow: string;
  progress: number;
  input: string;
  summary: string;
  messages: Array<["user" | "agent" | "impact", string, string]>;
  terminal: Array<["cmd" | "ok" | "warn" | "muted", string]>;
  evidence: Record<string, string>;
};

const capabilities = [
  {
    pillar: "Runtime continuity",
    tone: "green" as Tone,
    description: "Keep long-running agent workflows consistent across failures, restarts, retries, and task changes.",
    items: [
      ["Durable runs", "Track every agent workflow as a resumable runtime record."],
      ["Checkpoints", "Persist safe execution state before and after critical model and tool steps."],
      ["Recovery engine", "Restore the latest trusted state after provider, tool, or worker failure."],
      ["Task versioning", "Preserve prior evidence when an operator changes scope mid-run."],
    ],
  },
  {
    pillar: "Execution assurance",
    tone: "amber" as Tone,
    description: "Reduce operational risk when agents interact with tools, external systems, and sensitive workflows.",
    items: [
      ["Idempotency", "Prevent duplicate emails, tickets, approvals, payments, and system updates during retries."],
      ["Tool evidence", "Record tool inputs, outputs, observed signals, retries, and validation outcomes."],
      ["Action receipts", "Keep a durable record of external actions and replay decisions."],
      ["Audit reports", "Reconstruct what happened, where the agent resumed, and why the final answer was produced."],
    ],
  },
  {
    pillar: "Gateway abstraction",
    tone: "blue" as Tone,
    description: "Work with enterprise model and tool gateways without locking the product to one provider.",
    items: [
      ["Model gateway registry", "Support optional gateway, managed model, Azure OpenAI, OpenAI-compatible gateways, Anthropic, and local models."],
      ["Fallback records", "Capture primary route, fallback route, failure reason, latency, and selected output."],
      ["Tool gateway registry", "Register MCP-compatible tools, internal APIs, SaaS actions, and enterprise systems."],
      ["Embedding routes", "Use approved embedding providers for memory retrieval and similar-failure recall."],
    ],
  },
  {
    pillar: "Enterprise control",
    tone: "violet" as Tone,
    description: "Give organisations the access, tenancy, and operational boundaries expected by platform teams.",
    items: [
      ["Tenant hierarchy", "Separate organisations, workspaces, projects, environments, agents, and actors."],
      ["API keys", "Use workspace-scoped service keys with hashed storage and scoped permissions."],
      ["RBAC", "Support owner, admin, developer, operator, auditor, and viewer roles."],
      ["Control-plane audit", "Track configuration changes, gateway updates, tool registration, and access events."],
    ],
  },
];

const solutions = [
  {
    name: "Software engineering",
    tone: "green" as Tone,
    tag: "Coding agent · checkpoints",
    headline: "Recoverable coding work across repo files, tests, architecture decisions, and documentation.",
    body: "Coding agents can resume without losing the task contract, files inspected, failed tests, or next safe action.",
  },
  {
    name: "Compliance review",
    tone: "violet" as Tone,
    tag: "Tool evidence · audit",
    headline: "Evidence-heavy reviews with traceable tool outputs, task versions, and final decision records.",
    body: "Reviewers can inspect the evidence path, model route, checkpoint history, and memory used in the workflow.",
  },
  {
    name: "Finance operations",
    tone: "amber" as Tone,
    tag: "Idempotency",
    headline: "Retry-safe agent workflows around payments, approvals, reconciliations, and account updates.",
    body: "Idempotency records reduce the risk of repeated external actions after network or worker failures.",
  },
  {
    name: "IT incident response",
    tone: "blue" as Tone,
    tag: "Recovery engine",
    headline: "Incident agents that preserve diagnostics across logs, alerts, deploy records, and runbooks.",
    body: "Operators can restore the last safe investigation state and continue with a clear recovery timeline.",
  },
];

const solutionStats: Array<[string, string]> = [
  ["3", "Memory backends: local Cognee, Cognee Cloud, offline mirror"],
  ["4", "Memory lifecycle verbs: remember, recall, improve, forget"],
  ["3", "Connect paths: REST API, SDKs, and MCP server"],
  ["1", "Durable receipt for every run, checkpoint, and recovery"],
];

const integrations = [
  ["Model gateways", "Cognee memory, OpenAI-compatible gateways, Anthropic, Azure OpenAI, local/open-weight models"],
  ["Tool gateways", "MCP gateways, internal APIs, workflow tools, CRM, ticketing, ERP, logs, knowledge bases"],
  ["Storage", "Cognee graph-vector memory plus PostgreSQL runtime checkpoints and audit records"],
  ["Observability", "Structured runtime events, audit records, model attempts, fallback history, recovery metrics"],
  ["Identity and access", "Workspace API keys, service accounts, scoped permissions, operator and auditor roles"],
];

const routeModels = [
  ["Primary", "Claude Haiku 4.5", "global.anthropic.claude-haiku-4-5-20251001-v1-0", "green"],
  ["Fallback", "Nova 2 Lite", "us.amazon.nova-2-lite-v1-0", "amber"],
  ["Low-cost", "Nova Micro", "us.amazon.nova-micro-v1-0", "blue"],
  ["Synthesis", "Claude Sonnet 4.5", "global.anthropic.claude-sonnet-4-5-20250929-v1-0", "violet"],
  ["Memory", "Titan Embed Text v2", "amazon.titan-embed-text-v2-0", "neutral"],
] as const;

const runStages: Stage[] = [
  {
    id: "ready",
    label: "Ready",
    eyebrow: "No active run",
    progress: 0,
    input: "Add role-based access control to the dashboard without changing the auth provider.",
    summary: "Start a reference workflow that demonstrates durable runs, checkpointing, tool evidence, fallback recovery, task versioning, and execution memory.",
    messages: [],
    terminal: [
      ["cmd", "> await agent task"],
      ["muted", "runtime continuity engine ready"],
      ["muted", "model and tool gateway registries ready"],
      ["muted", "no active execution trace"],
    ],
    evidence: {
      trace: "—",
      modelRoute: "Not selected",
      toolEvidence: "No tool call yet",
      checkpoint: "—",
      recovery: "Not required",
      memory: "No memory applied",
    },
  },
  {
    id: "plan",
    label: "Plan",
    eyebrow: "Planning checkpoint",
    progress: 32,
    input: "Add role-based access control to the dashboard without changing the auth provider.",
    summary: "The agent prepares a retrieval plan and MemoryMesh saves a safe checkpoint before tools execute.",
    messages: [
      ["user", "", "Add role-based access control to the dashboard without changing the auth provider."],
      ["agent", "Plan", "Retrieve ticket records, follow continuation signals, validate terminal completion, then summarise recurring issues."],
      ["agent", "Checkpoint", "Pre-tool state saved so the workflow can resume safely if the next step fails."],
    ],
    terminal: [
      ["cmd", "> create_plan coding-agent-analysis"],
      ["ok", "tenant and workspace context resolved"],
      ["ok", "model route selected"],
      ["ok", "checkpoint saved · chk_plan_001"],
    ],
    evidence: {
      trace: "plan_support_001",
      modelRoute: "Gateway route selected for planning",
      toolEvidence: "0 tool calls executed",
      checkpoint: "chk_plan_001",
      recovery: "Ready if interruption occurs",
      memory: "No prior memory needed",
    },
  },
  {
    id: "execute",
    label: "Execute",
    eyebrow: "Tool evidence recorded",
    progress: 58,
    input: "Continue the RBAC implementation after inspecting the repo.",
    summary: "Tool inputs, outputs, observed signals, and validation state become part of the run record.",
    messages: [
      ["user", "", "Continue the RBAC implementation after inspecting the repo."],
      ["agent", "Tool evidence", "fetch_coding_agents returned next_page_token=page_2, so the workflow continued retrieval."],
      ["agent", "Validation", "The result was not final until the terminal next_page_token=null signal was observed."],
      ["agent", "Execution memory", "The complete-retrieval rule is now available as an approved memory candidate."],
    ],
    terminal: [
      ["cmd", "> tool.fetch coding_agents"],
      ["ok", "tool input and output recorded"],
      ["warn", "observed next_page_token=page_2"],
      ["ok", "continued until terminal response"],
      ["ok", "execution memory candidate stored"],
    ],
    evidence: {
      trace: "trace_support_001",
      modelRoute: "Planning model route retained",
      toolEvidence: "fetch_coding_agents until next_page_token=null",
      checkpoint: "chk_support_001",
      recovery: "Checkpoint available",
      memory: "complete_retrieval_rule_001",
    },
  },
  {
    id: "recover",
    label: "Recover",
    eyebrow: "Failure recovery",
    progress: 78,
    input: "Resume the investigation after interruption.",
    summary: "A worker interruption is detected. MemoryMesh restores the latest checkpoint and records the fallback route.",
    messages: [
      ["user", "", "The run was interrupted. Resume from the last safe state."],
      ["agent", "Failure detected", "The workflow stopped after checkpoint save, before final synthesis."],
      ["agent", "Fallback route", "A fallback model route was selected and recorded with the recovery event."],
      ["agent", "Recovery", "The checkpoint restored task state, trace state, tool evidence, and memory context."],
    ],
    terminal: [
      ["cmd", "> recover run trace_support_001"],
      ["warn", "interruption detected after checkpoint"],
      ["ok", "fallback route recorded"],
      ["ok", "checkpoint restored · chk_support_001"],
      ["ok", "recovery_status=restored"],
    ],
    evidence: {
      trace: "recover_support_001",
      modelRoute: "Primary route → fallback route",
      toolEvidence: "Previous tool evidence retained",
      checkpoint: "chk_support_001",
      recovery: "Restored from trusted checkpoint",
      memory: "complete_retrieval_rule_001 available",
    },
  },
  {
    id: "extend",
    label: "Extend",
    eyebrow: "Task versioning",
    progress: 100,
    input: "Apply developer feedback: prefer middleware-only guards for future RBAC tasks.",
    summary: "The operator changes scope. MemoryMesh versions the task, preserves prior evidence, applies approved memory, and produces an audit-ready result.",
    messages: [
      ["user", "", "Now extend the resumed investigation to include regression tests and identify recurring blockers."],
      ["agent", "Task version", "A new task version was created while preserving evidence from the earlier coding-agent investigation."],
      ["agent", "Memory applied", "Approved memory retrieved: continue retrieval until next_page_token=null before answering."],
      ["agent", "Result", "Recurring blockers include missing evidence, delayed approvals, policy exceptions, vendor documentation gaps, and review handoff delays."],
      ["impact", "Outcome", "The workflow demonstrates continuity across task change, memory reuse, tool evidence, fallback history, and recovery audit."],
    ],
    terminal: [
      ["cmd", "> modify task include regression_tests"],
      ["ok", "task_version advanced to 2"],
      ["ok", "approved execution memory retrieved"],
      ["ok", "same completion rule applied"],
      ["ok", "audit report generated"],
    ],
    evidence: {
      trace: "trace_compliance_001",
      modelRoute: "Graph-vector memory model route",
      toolEvidence: "support + compliance ticket traces",
      checkpoint: "chk_compliance_001",
      recovery: "Task continued from restored state",
      memory: "approved memory applied before planning",
    },
  },
];

const runEvents = ["Request", "Plan", "Route", "Checkpoint", "Tool", "Evidence", "Interrupt", "Fallback", "Recover", "Version", "Memory", "Answer"];
const eventProgress: Record<string, number> = { ready: 1, plan: 4, execute: 6, recover: 9, extend: 12 };

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    dark: "bg-neutral-950 text-white",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    white: "bg-white/10 text-white ring-1 ring-white/15",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>;
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 text-sm font-black text-white">C</span>
      <span className="text-sm font-black tracking-tight text-neutral-950">MemoryMesh</span>
    </div>
  );
}

function Header({ page, setPage, onLogin }: { page: Page; setPage: (page: Page) => void; onLogin: () => void }) {
  const linkClass = (id: Page) => (page === id ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-950");
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-neutral-200 px-5 py-4">
      <button type="button" onClick={() => setPage("home")} aria-label="Open MemoryMesh home">
        <Logo />
      </button>
      <nav className="flex items-center gap-5 text-sm font-bold">
        <button type="button" onClick={() => setPage("capabilities")} className={linkClass("capabilities")}>Capabilities</button>
        <button type="button" onClick={() => setPage("architecture")} className={linkClass("architecture")}>Architecture</button>
        <button type="button" onClick={() => setPage("solutions")} className={linkClass("solutions")}>Solutions</button>
        <button type="button" onClick={() => setPage("developers")} className={linkClass("developers")}>Developers</button>
        <button type="button" onClick={() => setPage("integrations")} className={linkClass("integrations")}>Integrations</button>
        <button type="button" onClick={() => setPage("google")} className={linkClass("google")}>Cognee path</button>
        <button type="button" onClick={() => setPage("agent")} className={linkClass("agent")}>Agent demo</button>
        <button type="button" onClick={onLogin} className="rounded-full bg-neutral-950 px-4 py-2 text-white">Log in</button>
      </nav>
    </header>
  );
}

function Terminal({ lines }: { lines: Array<["cmd" | "ok" | "warn" | "muted", string]> }) {
  const color = { cmd: "text-neutral-100", ok: "text-emerald-300", warn: "text-amber-300", muted: "text-neutral-500" };
  const prefix = { cmd: "$", ok: "✓", warn: "!", muted: "·" };
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-800 bg-neutral-950 shadow-2xl shadow-neutral-950/15">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-2 font-mono text-xs text-neutral-500">runtime continuity trace</span>
      </div>
      <div className="min-h-[285px] p-5">
        {lines.map((line, index) => (
          <div key={`${line[1]}-${index}`} className={`flex gap-3 font-mono text-sm leading-7 ${color[line[0]]}`}>
            <span className="w-4 shrink-0 text-neutral-500">{prefix[line[0]]}</span>
            <span>{line[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapabilityMap() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {capabilities.map((group) => (
        <section key={group.pillar} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Badge tone={group.tone}>{group.pillar}</Badge>
            <span className="text-xs font-black text-neutral-400">{group.items.length} capabilities</span>
          </div>
          <p className="mb-5 text-sm leading-7 text-neutral-600">{group.description}</p>
          <div className="space-y-3">
            {group.items.map(([name, description]) => (
              <div key={name} className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100">
                <p className="text-sm font-black">{name}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function OperatingMap() {
  const rows = [
    ["Enterprise agents", "Support, finance, compliance, IT, research, and operations agents."],
    ["MemoryMesh SDK/API", "Runs, events, checkpoints, recovery, memory, idempotency, and audit records."],
    ["Continuity engine", "Run manager, checkpoint manager, recovery engine, task versioning, and execution memory."],
    ["Gateway layer", "Cognee memory plus OpenAI-compatible, Anthropic, Azure OpenAI, and local model routes."],
    ["Tool layer", "MCP gateways, internal APIs, CRM, tickets, logs, ERP, databases, and workflow systems."],
    ["Runtime store", "PostgreSQL-backed runtime records with tenant-aware separation and audit logs."],
  ];
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black">Enterprise operating map</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">Where MemoryMesh sits in production agent infrastructure</p>
        </div>
        <Badge tone="dark">Graph-vector memory</Badge>
      </div>
      <div className="grid gap-3">
        {rows.map(([name, description], index) => (
          <div key={name} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100 md:grid-cols-[190px_1fr]">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">{index + 1}</span>
              <p className="text-sm font-black">{name}</p>
            </div>
            <p className="text-sm leading-6 text-neutral-600">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationPanel() {
  return (
    <div className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">Reference model route</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">Cognee shown as the primary graph-vector memory layer</p>
        </div>
        <Badge tone="dark">Model route</Badge>
      </div>
      <div className="space-y-3">
        {routeModels.map(([label, name, modelId, tone]) => (
          <div key={modelId} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100">
            <div>
              <p className="text-sm font-black">{name}</p>
              <p className="mt-1 font-mono text-[11px] text-neutral-500">{modelId}</p>
            </div>
            <Badge tone={tone as Tone}>{label}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomePage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <Header page="home" setPage={setPage} onLogin={onLogin} />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_.9fr] lg:items-center">
        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone="dark">Cognee-powered continuity</Badge>
            <Badge tone="green">Recoverable coding agents</Badge>
            <Badge tone="violet">Graph-vector memory</Badge>
          </div>
          <h1 className="max-w-4xl text-6xl font-black leading-[0.9] tracking-[-0.075em] md:text-8xl">
            Context continuity for long-running coding agents.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-600">
            MemoryMesh helps AI teams move agents from prototype to production by preserving execution state, restoring interrupted workflows, preventing duplicate actions, and keeping model and tool evidence auditable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setPage("architecture")} className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-black text-white">See architecture</button>
            <button type="button" onClick={() => setPage("capabilities")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-neutral-950 ring-1 ring-neutral-200">Explore capabilities</button>
            <button type="button" onClick={() => setPage("google")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-neutral-950 ring-1 ring-neutral-200">Cognee reference path</button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-black tracking-tight">Restore</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Resume long-running workflows from the last trusted checkpoint.</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">Prove</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Show model routes, tool evidence, fallback decisions, and recovery events.</p>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">Control</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Apply tenant boundaries, API keys, RBAC, idempotency, and audit logs.</p>
            </div>
          </div>
        </div>
        <Terminal lines={[["cmd", "> memorymesh run incident-review"], ["ok", "workspace context resolved"], ["ok", "plan prepared before tool execution"], ["ok", "checkpoint saved · chk_runtime_001"], ["warn", "worker interruption detected"], ["ok", "fallback route recorded"], ["ok", "checkpoint restored from durable storage"], ["ok", "audit report generated"]]} />
      </section>
      <section className="mx-auto max-w-6xl border-t border-neutral-200 px-5 py-14">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Why MemoryMesh</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">Agents need continuity, not just orchestration.</h2>
            <p className="mt-5 text-base leading-8 text-neutral-600">Production agents often run across multiple tools, models, retries, approvals, and changing user instructions. MemoryMesh keeps those workflows consistent when something breaks.</p>
          </div>
          <div className="space-y-5">
            <div className="border-b border-neutral-200 pb-5">
              <p className="text-sm font-black">Recover from infrastructure failure</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">Rate limits, provider outages, tool errors, and worker restarts are recorded as runtime events, not lost context.</p>
            </div>
            <div className="border-b border-neutral-200 pb-5">
              <p className="text-sm font-black">Prevent repeated external actions</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">Idempotency records help avoid duplicate emails, tickets, approvals, payments, or system updates during retries.</p>
            </div>
            <div>
              <p className="text-sm font-black">Make agent work auditable</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">Every run can retain model attempts, tool evidence, checkpoint restores, task versions, memory use, and final recovery reports.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CapabilitiesPage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <Header page="capabilities" setPage={setPage} onLogin={onLogin} />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <Badge tone="dark">Enterprise capability map</Badge>
        <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.065em] md:text-7xl">
          Continuity, safety, gateway abstraction, and enterprise control.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-600">
          MemoryMesh gives platform teams the runtime records and controls needed to run agents across long workflows: tenant context, gateway routes, tool evidence, checkpoints, recovery events, idempotency, and audit trails.
        </p>
        <div className="mt-10"><CapabilityMap /></div>
      </section>
    </main>
  );
}


function ArchitectureDiagram() {
  const engineBlocks = [
    ["Run manager", "Creates durable run records and tenant context."],
    ["Checkpoint manager", "Stores resumable execution state."],
    ["Recovery engine", "Restores safe state after failure."],
    ["Task versioning", "Tracks changing user scope."],
    ["Idempotency", "Prevents duplicate external actions."],
    ["Execution memory", "Reuses approved lessons across runs."],
    ["Tool evidence", "Records tool inputs, outputs, and signals."],
    ["Model attempts", "Logs primary and fallback routes."],
    ["Audit generator", "Builds reconstructable evidence records."],
  ];
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black">Enterprise architecture</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">How MemoryMesh sits between agent applications, gateways, tools, and durable runtime storage.</p>
        </div>
        <Badge tone="dark">Runtime continuity layer</Badge>
      </div>
      <div className="space-y-4">
        <div className="rounded-[1.5rem] bg-neutral-950 p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Enterprise agent applications</p>
          <p className="mt-2 text-2xl font-black tracking-tight">Support · Finance · Compliance · IT · Research · Operations</p>
        </div>
        <div className="flex justify-center text-2xl font-black text-neutral-300">↓</div>
        <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-neutral-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">MemoryMesh SDK / API</p>
              <p className="mt-2 text-xl font-black tracking-tight">Python SDK · TypeScript SDK · REST API · Webhooks</p>
            </div>
            <Badge tone="green">Developer adoption</Badge>
          </div>
        </div>
        <div className="flex justify-center text-2xl font-black text-neutral-300">↓</div>
        <div className="rounded-[1.5rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">MemoryMesh continuity engine</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {engineBlocks.map(([name, description]) => (
              <div key={name} className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                <p className="text-sm font-black">{name}</p>
                <p className="mt-1 text-xs leading-5 text-neutral-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="flex justify-center py-3 text-2xl font-black text-neutral-300">↓</div>
            <div className="rounded-[1.5rem] bg-sky-50 p-5 ring-1 ring-sky-100">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Model gateway layer</p>
              <p className="mt-2 text-lg font-black">Cognee memory · Claude Code/Codex style agents · OpenAI-compatible models · Local models</p>
              <p className="mt-3 text-sm leading-6 text-neutral-600">MemoryMesh records model attempts, fallback decisions, latency, error reason, selected output, and recovery status.</p>
            </div>
          </div>
          <div>
            <div className="flex justify-center py-3 text-2xl font-black text-neutral-300">↓</div>
            <div className="rounded-[1.5rem] bg-violet-50 p-5 ring-1 ring-violet-100">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Tool gateway layer</p>
              <p className="mt-2 text-lg font-black">MCP gateways · Internal APIs · CRM · Tickets · Logs · ERP · Databases</p>
              <p className="mt-3 text-sm leading-6 text-neutral-600">MemoryMesh records tool arguments, outputs, observed signals, retries, validation, and whether evidence influenced the final answer.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center text-2xl font-black text-neutral-300">↓</div>
        <div className="rounded-[1.5rem] bg-neutral-100 p-5 ring-1 ring-neutral-200">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">Runtime store layer</p>
          <p className="mt-2 text-xl font-black tracking-tight">PostgreSQL · Cloud SQL · Customer-managed storage · Cloud-managed database deployment</p>
          <p className="mt-3 text-sm leading-6 text-neutral-600">Stores runs, events, checkpoints, task versions, tool traces, model attempts, fallback records, idempotency keys, execution memory, and audit logs.</p>
        </div>
      </div>
    </div>
  );
}

function ArchitecturePage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  const failureRows = [
    ["Rate limits", "MemoryMesh records the failed attempt, preserves checkpoint state, and continues through retry or fallback without losing context."],
    ["Provider outages", "The model gateway can switch providers while MemoryMesh records model attempts, fallback reason, and recovery status."],
    ["Slow responses", "Timeouts become runtime events; the recovery engine restores the last trusted checkpoint and continues from there."],
    ["Tool failures", "Tool arguments, outputs, errors, retries, and validation state are stored as evidence before the agent proceeds."],
    ["Bad intermediate outputs", "Validation can block incomplete or unsafe outputs before they become memory or final answer material."],
    ["Cascading failures", "Each stage is checkpointed and traceable, so operators can see where failure spread and which state was restored."],
  ];
  const enterpriseRows = [
    ["Enterprise tenancy", "Organisation, workspace, project, environment, agent, and actor context keep records separated."],
    ["Access control", "Workspace API keys, RBAC roles, and audit logs support controlled platform adoption."],
    ["Duplicate-action protection", "Idempotency records prevent repeated emails, approvals, tickets, payments, or updates during retries."],
    ["Execution memory", "Approved recovery and retrieval lessons can be reused before future planning steps."],
    ["Gateway choice", "Cognee memory is the primary path; optional model/tool gateways can be connected for production deployments."],
    ["Operational audit", "Reports can reconstruct model route, tool evidence, checkpoint restore, task version, and final answer."],
  ];
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <Header page="architecture" setPage={setPage} onLogin={onLogin} />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <Badge tone="blue">Architecture</Badge>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] md:text-7xl">A continuity layer above agents, gateways, tools, and storage.</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">
          MemoryMesh sits between agent applications and enterprise systems. It records state, coordinates recovery, and keeps execution evidence durable across model and tool providers.
        </p>
        <div className="mt-10"><ArchitectureDiagram /></div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-black">How MemoryMesh handles resilient-agent failures</p>
            <div className="mt-4 space-y-3">
              {failureRows.map(([name, description]) => (
                <div key={name} className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100">
                  <p className="text-sm font-black">{name}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-black">Enterprise capabilities beyond resilience</p>
            <div className="mt-4 space-y-3">
              {enterpriseRows.map(([name, description]) => (
                <div key={name} className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100">
                  <p className="text-sm font-black">{name}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Footer({ setPage }: { setPage: (page: Page) => void }) {
  const columns: Array<[string, Array<[string, Page]>]> = [
    ["Product", [["Capabilities", "capabilities"], ["Architecture", "architecture"], ["Solutions", "solutions"]]],
    ["Developers", [["Developers", "developers"], ["Integrations", "integrations"], ["Agent demo", "agent"]]],
    ["Cognee", [["Cognee path", "google"], ["Home", "home"]]],
  ];
  return (
    <footer className="border-t border-neutral-200 bg-[#f7f7f5]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-500">
            A runtime continuity layer for long-running agents: durable memory, checkpoints, recovery, and audit-ready receipts.
          </p>
        </div>
        {columns.map(([title, links]) => (
          <div key={title}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">{title}</p>
            <div className="mt-4 space-y-2">
              {links.map(([label, page]) => (
                <button key={label} type="button" onClick={() => setPage(page)} className="block text-sm font-semibold text-neutral-600 hover:text-neutral-950">
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 py-5 text-xs font-medium text-neutral-400 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} MemoryMesh. Cognee-powered continuity for AI agents.</span>
          <span>Built for the Cognee hackathon · Open source + Cognee Cloud</span>
        </div>
      </div>
    </footer>
  );
}

function SolutionsPage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <Header page="solutions" setPage={setPage} onLogin={onLogin} />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <Badge tone="green">Enterprise solutions</Badge>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] md:text-7xl">Production patterns for recoverable agents.</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">MemoryMesh supports workflows where losing state, repeating work, or hiding tool evidence is unacceptable.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => setPage("architecture")} className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-black text-white hover:bg-neutral-800">See architecture</button>
          <button type="button" onClick={() => setPage("capabilities")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-neutral-950 ring-1 ring-neutral-200 hover:ring-neutral-300">Explore capabilities</button>
          <button type="button" onClick={onLogin} className="rounded-full bg-white px-6 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-200 hover:ring-emerald-300">Open console</button>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {solutionStats.map(([value, label]) => (
            <div key={label} className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <p className="text-4xl font-black tracking-tight">{value}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {solutions.map((solution) => (
            <div
              key={solution.name}
              className="group flex flex-col rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-neutral-950/5 hover:ring-neutral-300"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Badge tone={solution.tone}>{solution.name}</Badge>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-500">{solution.tag}</span>
              </div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">{solution.headline}</h2>
              <p className="mt-4 flex-1 text-sm leading-7 text-neutral-600">{solution.body}</p>
              <button
                type="button"
                onClick={() => setPage("architecture")}
                className="mt-5 inline-flex items-center gap-2 text-sm font-black text-neutral-950"
              >
                See how it works
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <OperatingMap />
      </section>

      <section className="border-t border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em] md:text-4xl">Ready to make your agents recoverable?</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-300">Start from the reference agent demo, then connect your own agents through the API, SDKs, or MCP.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setPage("agent")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-neutral-950 hover:bg-neutral-100">View agent demo</button>
            <button type="button" onClick={() => setPage("developers")} className="rounded-full bg-white/10 px-6 py-3 text-sm font-black text-white ring-1 ring-white/15 hover:bg-white/15">Read developer docs</button>
          </div>
        </div>
      </section>

      <Footer setPage={setPage} />
    </main>
  );
}

function DevelopersPage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <Header page="developers" setPage={setPage} onLogin={onLogin} />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-5xl font-black tracking-[-0.06em]">Developers</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">Use MemoryMesh APIs, SDKs, and adapters to add recoverable runtime state to your agents.</p>
        <div className="mt-8 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <div className="mb-4"><p className="text-sm font-black">SDK quickstart</p><p className="mt-1 text-xs font-semibold text-neutral-500">Start, record, checkpoint, restore.</p></div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-neutral-50 p-5 font-mono text-xs leading-6 text-neutral-800 ring-1 ring-neutral-200">{`from memorymesh import MemoryMeshClient

memorymesh = MemoryMeshClient(api_key="mm_test_...")

run = memorymesh.start_run(
    agent_id="incident-agent",
    task="Investigate failed payment workflow",
)

memorymesh.record_event(run.id, code="plan_prepared")
memorymesh.save_checkpoint(run.id, state={"step": "validate_records"})
memorymesh.restore_checkpoint("chk_runtime_001")`}</pre>
        </div>
        <h2 className="mt-12 text-2xl font-black tracking-tight">Enterprise API resources</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {[
            ["/api/enterprise/context", "GET", "Resolve organisation/workspace/project context"],
            ["/api/enterprise/bootstrap", "POST", "Create first tenant, workspace, project, and API key"],
            ["/api/runs", "POST", "Start a durable agent run"],
            ["/api/runs/{run_id}/events", "POST", "Record a runtime event"],
            ["/api/runs/{run_id}/checkpoints", "POST", "Save a resumable checkpoint"],
            ["/api/enterprise/gateways", "POST", "Register a model gateway"],
            ["/api/enterprise/tools", "POST", "Register an enterprise tool"],
            ["/api/enterprise/audit-logs", "GET", "View tenant-scoped audit logs"],
          ].map(([path, method, description]) => (
            <div key={path} className="grid gap-4 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_80px_1.3fr]">
              <span className="font-mono text-neutral-800">{path}</span><span className="font-mono text-xs font-black text-neutral-500">{method}</span><span className="text-neutral-500">{description}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function IntegrationsPage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <Header page="integrations" setPage={setPage} onLogin={onLogin} />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <Badge tone="blue">Integrations</Badge>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] md:text-7xl">Use the gateways, tools, and storage your enterprise already trusts.</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">MemoryMesh is designed to sit above approved model gateways, tool gateways, and customer-managed storage.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-4">
            {integrations.map(([name, description]) => (
              <div key={name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
                <p className="text-sm font-black">{name}</p><p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
              </div>
            ))}
          </div>
          <IntegrationPanel />
        </div>
      </section>
    </main>
  );
}

function GoogleChallengePage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  const fitRows = [
    ["Prototype to production", "MemoryMesh adds durable runtime state, checkpoints, tool evidence, recovery, idempotency, and audit records around an existing agent."],
    ["Track 2: Optimize Existing Agents", "The strongest fit: MemoryMesh improves reliability, observability, and recovery for agents that already work in prototype form."],
    ["ADK / Gemini reference path", "MemoryMesh can wrap Gemini or ADK agents through the SDK while preserving gateway-agnostic model routing and runtime records."],
    ["MCP tool connection", "Tool calls are captured with input, output, observed signals, retries, validation, and whether evidence influenced the answer."],
    ["Production reliability", "Rate limits, outages, slow responses, tool failures, and bad intermediate outputs become recoverable runtime events."],
    ["Enterprise adoption", "The same runtime layer supports tenancy, API keys, RBAC, gateway registry, tool registry, and audit logs."],
  ];
  const stressRows = [
    ["Model call times out", "Save checkpoint → record failed attempt → use fallback route → resume from last safe state."],
    ["Tool returns partial data", "Record observed signal → continue retrieval until terminal condition → block premature summary."],
    ["User changes task scope", "Create task version → preserve prior evidence → apply approved memory before planning."],
    ["Retry could duplicate action", "Check idempotency key → reuse previous receipt or block duplicate mutation."],
    ["Bad intermediate output", "Validate output → keep it out of execution memory and final report if it fails checks."],
  ];
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <Header page="google" setPage={setPage} onLogin={onLogin} />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <Badge tone="green">Cognee hackathon reference path</Badge>
        <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.065em] md:text-7xl">From prototype agent to production-ready workflow.</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-600">
          MemoryMesh aligns with a production-readiness challenge by adding the runtime continuity layer most prototypes lack: durable checkpoints, recovery, tool evidence, model-attempt history, idempotency, task versions, and audit-ready records.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-black">Challenge fit</p>
            <div className="mt-4 space-y-3">
              {fitRows.map(([name, description]) => (
                <div key={name} className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100">
                  <p className="text-sm font-black">{name}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-black">Reference Cognee architecture</p>
            <div className="mt-4 space-y-3">
              {[
                ["Gemini / ADK agent", "The agent continues to own task-specific reasoning and orchestration."],
                ["MemoryMesh SDK/API", "Records run state, events, checkpoints, task versions, and recovery decisions."],
                ["Model gateway route", "Gemini or approved model gateway route is captured with attempt and fallback metadata."],
                ["MCP tools", "Tool calls and validation results are retained as evidence."],
                ["Cloud SQL / PostgreSQL", "Runtime records remain durable and queryable for operators and auditors."],
              ].map(([name, description], index) => (
                <div key={name} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100 md:grid-cols-[40px_1fr]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">{index + 1}</span>
                  <div><p className="text-sm font-black">{name}</p><p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-black">Stress-test demo path</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            {stressRows.map(([name, description]) => (
              <div key={name} className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100">
                <p className="text-sm font-black">{name}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Console({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<ConsoleTab>("overview");
  const tabs: Array<[ConsoleTab, string]> = [["overview", "Overview"], ["runs", "Runs"], ["recovery", "Recovery"], ["checkpoints", "Checkpoints"], ["toolEvidence", "Tool Evidence"], ["modelRoutes", "Model Routes"], ["memory", "Memory"], ["audit", "Audit"], ["settings", "Settings"]];
  return (
    <div className="flex min-h-screen bg-[#fbfaf7] text-neutral-950">
      <aside className="hidden min-h-screen w-72 border-r border-neutral-200 bg-[#f7f7f5] p-4 lg:block">
        <div className="mb-8 flex items-center justify-between px-2"><Logo /><button type="button" onClick={onLogout} className="text-xs font-bold text-neutral-400 hover:text-neutral-950">Log out</button></div>
        <nav className="space-y-1">
          {tabs.map(([id, label]) => <button key={id} type="button" onClick={() => setActive(id)} className={`flex w-full rounded-2xl px-3 py-3 text-left text-sm font-bold ${active === id ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200" : "text-neutral-600 hover:bg-neutral-200/60"}`}>{label}</button>)}
        </nav>
      </aside>
      <main className="min-h-screen flex-1 p-5 md:p-8">
        <Badge tone="dark">Enterprise console</Badge>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.055em]">{tabs.find(([id]) => id === active)?.[1]}</h1>
        <p className="mt-2 text-sm text-neutral-500">Runtime records, recovery evidence, model routes, tool traces, memory, and audit records.</p>
        {active === "overview" ? <ConsoleOverview /> : null}
        {active === "modelRoutes" ? <div className="mt-8"><IntegrationPanel /></div> : null}
        {active === "settings" ? <div className="mt-8"><OperatingMap /></div> : null}
        {!["overview", "modelRoutes", "settings"].includes(active) ? <RunsTable active={active} /> : null}
      </main>
    </div>
  );
}

function ConsoleOverview() {
  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["Active runs", "3", "Tracked workflows."], ["Checkpoints", "14", "Recoverable states."], ["Recovered", "2", "Successful restores."], ["Gateways", "2", "Model routes registered."]].map(([label, value, detail]) => (
          <div key={label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><p className="text-sm font-bold text-neutral-500">{label}</p><p className="mt-2 text-4xl font-black tracking-tight">{value}</p><p className="mt-2 text-sm leading-6 text-neutral-500">{detail}</p></div>
        ))}
      </div>
      <RunsTable active="overview" />
    </>
  );
}

function RunsTable({ active }: { active: ConsoleTab }) {
  const title = active === "recovery" ? "Recovery records" : active === "toolEvidence" ? "Tool evidence" : active === "memory" ? "Execution memory" : active === "audit" ? "Audit records" : active === "checkpoints" ? "Checkpoints" : "Agent runs";
  return (
    <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <div className="mb-4"><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs font-semibold text-neutral-500">Tenant-scoped runtime records for operators and auditors.</p></div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-400"><tr><th className="px-4 py-3">Run</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Route / evidence</th><th className="px-4 py-3">Checkpoint</th></tr></thead>
          <tbody className="divide-y divide-neutral-200">
            {[["run_91a3c7", "incident-agent", "recovered", "Haiku → Nova Lite", "chk_runtime_001"], ["run_3bf22a", "finance-agent", "running", "idempotency key active", "chk_finance_004"], ["run_a192ef", "support-agent", "checkpointed", "tool evidence stored", "chk_support_017"]].map(([id, agent, status, route, checkpoint]) => (
              <tr key={id}><td className="px-4 py-4"><p className="font-bold">{id}</p><p className="text-xs text-neutral-500">{agent}</p></td><td className="px-4 py-4"><Badge tone={status === "recovered" ? "green" : status === "running" ? "blue" : "amber"}>{status}</Badge></td><td className="px-4 py-4 font-mono text-xs">{route}</td><td className="px-4 py-4 font-mono text-xs">{checkpoint}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProcessRail({ stage }: { stage: Stage }) {
  const activeCount = eventProgress[stage.id] || 1;
  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Runtime process</p><p className="text-xs font-medium text-neutral-400">continuity states</p></div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {runEvents.map((event, index) => (
          <div key={event} className="flex min-w-fit items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${index + 1 === activeCount ? "bg-neutral-950 text-white" : index + 1 < activeCount ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}>{event}</span>{index < runEvents.length - 1 ? <span className="text-neutral-300">→</span> : null}</div>
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: ["user" | "agent" | "impact", string, string] }) {
  const [role, eyebrow, text] = message;
  if (role === "user") return <div className="flex justify-end"><div className="max-w-[78%] rounded-[1.35rem] bg-neutral-950 px-4 py-3 text-sm leading-6 text-white shadow-sm">{text}</div></div>;
  const isImpact = role === "impact";
  return (
    <div className="flex gap-3">
      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isImpact ? "bg-emerald-100 text-emerald-700" : "bg-neutral-950 text-white"}`}>{isImpact ? "✓" : "C"}</div>
      <div className="max-w-[82%]">
        {eyebrow ? <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">{eyebrow}</p> : null}
        <div className={`${isImpact ? "rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-950 ring-1 ring-emerald-100" : "px-1 py-1 text-neutral-800"} text-sm leading-7`}>{text}</div>
      </div>
    </div>
  );
}

function Inspector({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/20 backdrop-blur-sm">
      <button type="button" onClick={onClose} className="absolute inset-0 cursor-default" aria-label="Close inspector" />
      <aside className="relative z-10 flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl">
        <div className="border-b border-neutral-100 px-5 py-4">
          <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">MemoryMesh Inspector</p><p className="mt-1 text-xs font-medium text-neutral-500">Runtime continuity evidence</p><p className="mt-1 font-mono text-xs text-neutral-400">{stage.evidence.trace}</p></div><button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100">Close</button></div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="border-b border-neutral-100 pb-5"><div className="flex items-center justify-between"><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">{stage.eyebrow}</span><span className="text-xs font-medium text-neutral-400">{stage.progress}%</span></div><h2 className="mt-4 text-xl font-semibold tracking-tight">{stage.label}</h2><p className="mt-2 text-sm leading-6 text-neutral-500">{stage.summary}</p></div>
          <div className="mt-4 rounded-2xl bg-neutral-950 p-4"><TerminalLines lines={stage.terminal} /></div>
          <div className="mt-4 divide-y divide-neutral-100 text-sm">
            {Object.entries(stage.evidence).map(([key, value]) => <div key={key} className="grid grid-cols-[110px_1fr] gap-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{key}</p><p className="font-medium leading-5 text-neutral-800">{value}</p></div>)}
          </div>
        </div>
      </aside>
    </div>
  );
}

function TerminalLines({ lines }: { lines: Stage["terminal"] }) {
  const color = { cmd: "text-neutral-100", ok: "text-emerald-300", warn: "text-amber-300", muted: "text-neutral-500" };
  const prefix = { cmd: "$", ok: "✓", warn: "›", muted: "·" };
  return <>{lines.map((line, index) => <div key={`${line[1]}-${index}`} className={`flex gap-3 font-mono text-sm leading-6 ${color[line[0]]}`}><span className="w-4 shrink-0 text-neutral-500">{prefix[line[0]]}</span><span>{line[1]}</span></div>)}</>;
}

function AgentDemoPage({ setPage, onLogin }: { setPage: (page: Page) => void; onLogin: () => void }) {
  const [step, setStep] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const current = runStages[step];
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <Header page="agent" setPage={setPage} onLogin={onLogin} />
      <section className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden min-h-[calc(100vh-73px)] max-h-[calc(100vh-73px)] flex-col border-r border-neutral-200 bg-[#f7f7f5] lg:flex">
          <div className="p-3"><button type="button" onClick={() => setStep(0)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-neutral-200/70"><span className="text-lg">＋</span>New run</button><button type="button" className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-200/70"><span className="text-lg">⌕</span>Search runs</button></div>
          <div className="px-3 pb-2 pt-4"><p className="px-3 text-xs font-black uppercase tracking-wider text-neutral-400">Example runs</p></div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 [scrollbar-color:#d4d4d4_transparent] [scrollbar-width:thin]">
            {["Support ticket analysis", "Compliance blockers", "Fallback recovery", "Tool evidence trace", "Duplicate-action prevention", "Incident restart recovery", "Vendor evidence review", "KYC review blockers"].map((title, index) => <button key={title} type="button" className={`w-full rounded-xl px-3 py-2.5 text-left transition ${index === Math.min(step, 3) ? "bg-neutral-200/80" : "hover:bg-neutral-200/60"}`}><p className="truncate text-sm font-medium">{title}</p><p className="mt-1 truncate text-xs font-medium text-neutral-500">{index < 4 ? "Runtime evidence" : "Enterprise pattern"}</p></button>)}
          </div>
        </aside>
        <div className="flex min-h-[calc(100vh-73px)] flex-col bg-white">
          <div className="flex items-center justify-between gap-3 px-5 py-3"><div><p className="text-sm font-semibold">Ticket Investigation Agent</p><p className="text-xs font-medium text-neutral-500">Reference app built on MemoryMesh runtime continuity infrastructure</p></div><div className="flex items-center gap-2"><Badge tone={current.id === "recover" ? "amber" : "green"}>{current.eyebrow}</Badge><button type="button" onClick={() => setInspectorOpen(true)} className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100">Inspector</button></div></div>
          <div className="h-px bg-neutral-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${current.progress}%` }} /></div>
          <div className="border-b border-neutral-100 px-5 py-2"><div className="mx-auto flex max-w-3xl items-center gap-2 overflow-x-auto text-xs font-medium text-neutral-500"><span className="rounded-full bg-neutral-100 px-3 py-1">Tenant scoped</span><span className="rounded-full bg-neutral-100 px-3 py-1">Gateway registry</span><span className="rounded-full bg-neutral-100 px-3 py-1">Tool evidence</span><span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">Checkpoint recovery</span></div></div>
          <div className="flex-1 overflow-y-auto bg-white px-5 py-8">
            {current.messages.length > 0 ? <div className="mx-auto max-w-3xl space-y-8 py-4"><ProcessRail stage={current} /><div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 ring-1 ring-emerald-100">{current.summary}</div>{current.messages.map((message, index) => <ChatMessage key={index} message={message} />)}</div> : <div className="flex min-h-[520px] items-center justify-center px-5 text-center"><div className="max-w-xl"><h2 className="text-4xl font-black tracking-[-0.045em]">{current.label}</h2><p className="mt-4 text-base leading-7 text-neutral-500">{current.summary}</p><p className="mt-3 text-sm leading-6 text-neutral-400">{current.input}</p></div></div>}
          </div>
          <div className="bg-white px-5 pb-7 pt-3"><div className="mx-auto max-w-3xl"><div className="rounded-[1.75rem] bg-white p-3 shadow-[0_12px_45px_rgba(0,0,0,0.08)] ring-1 ring-neutral-200"><div className="flex items-end gap-3"><div className="min-h-[44px] flex-1 px-2 py-2 text-sm leading-6 text-neutral-500">{current.input}</div><button type="button" disabled={step === runStages.length - 1} onClick={() => setStep((value) => Math.min(value + 1, runStages.length - 1))} className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition ${step === runStages.length - 1 ? "bg-neutral-400" : "bg-neutral-950 hover:bg-neutral-800"}`}>➜</button></div><div className="mt-2 flex items-center justify-between border-t border-neutral-100 px-2 pt-2"><span className="text-xs font-medium text-neutral-400">{["Start investigation", "Plan through gateway", "Record tool evidence", "Recover from failure", "Extend task with memory"][step]}</span><button type="button" onClick={() => setInspectorOpen(true)} className="text-xs font-black text-emerald-700">View runtime evidence</button></div></div></div></div>
        </div>
      </section>
      {inspectorOpen ? <Inspector stage={current} onClose={() => setInspectorOpen(false)} /> : null}
    </main>
  );
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const [signedIn, setSignedIn] = useState(false);
  useMemo(() => capabilities.length > 0 && routeModels.length > 0, []);

  if (signedIn) return <Console onLogout={() => { setSignedIn(false); setPage("home"); }} />;
  if (page === "capabilities") return <CapabilitiesPage setPage={setPage} onLogin={() => setSignedIn(true)} />;
  if (page === "architecture") return <ArchitecturePage setPage={setPage} onLogin={() => setSignedIn(true)} />;
  if (page === "solutions") return <SolutionsPage setPage={setPage} onLogin={() => setSignedIn(true)} />;
  if (page === "developers") return <DevelopersPage setPage={setPage} onLogin={() => setSignedIn(true)} />;
  if (page === "integrations") return <IntegrationsPage setPage={setPage} onLogin={() => setSignedIn(true)} />;
  if (page === "google") return <GoogleChallengePage setPage={setPage} onLogin={() => setSignedIn(true)} />;
  if (page === "agent") return <AgentDemoPage setPage={setPage} onLogin={() => setSignedIn(true)} />;
  return <HomePage setPage={setPage} onLogin={() => setSignedIn(true)} />;
}

createRoot(document.getElementById("root")!).render(<App />);
