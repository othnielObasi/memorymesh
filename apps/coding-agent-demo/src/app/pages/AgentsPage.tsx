import { useState } from 'react';
import { ArrowRight, Terminal, Code2, Package, ChevronRight, Zap, Brain, Search, HeadphonesIcon, Settings2, CheckCircle2, Clock } from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

type TabType = 'builtin' | 'connect';
type MethodType = 'mcp' | 'api' | 'sdk';

const BUILTIN_AGENTS = [
  {
    icon: Brain,
    name: 'Build Assistant',
    status: 'available' as const,
    tagline: 'Code generation, refactoring & architecture',
    description: 'Generates, refactors, and reviews code with full context of your project structure, past decisions, and known patterns.',
    capabilities: [
      'Generates code from natural language descriptions',
      'Refactors existing code with awareness of full codebase',
      'Remembers your coding style and conventions',
      'Tracks architectural decisions across sessions',
      'Reviews changes against known patterns and history',
    ],
    memoryUsage: ['Project structure', 'Coding conventions', 'Architectural decisions', 'Past implementations', 'Dependency graph'],
  },
  {
    icon: Search,
    name: 'Research Agent',
    status: 'coming' as const,
    tagline: 'Deep research, synthesis & knowledge curation',
    description: 'Conducts multi-source research and builds a persistent knowledge base that improves with every session.',
    capabilities: [
      'Web research with source citation',
      'Knowledge synthesis across sessions',
      'Persistent research library',
      'Contradiction detection',
      'Research gap identification',
    ],
    memoryUsage: ['Source library', 'Key findings', 'Research threads', 'Contradictions', 'Open questions'],
  },
  {
    icon: HeadphonesIcon,
    name: 'Support Agent',
    status: 'coming' as const,
    tagline: 'Customer ticket resolution with institutional memory',
    description: 'Handles support tickets with full knowledge of prior cases, known solutions, and product documentation.',
    capabilities: [
      'Ticket classification and routing',
      'Solution recall from prior cases',
      'Escalation pattern recognition',
      'Customer history awareness',
      'Resolution quality tracking',
    ],
    memoryUsage: ['Case history', 'Known solutions', 'Customer profiles', 'Product docs', 'Escalation patterns'],
  },
  {
    icon: Settings2,
    name: 'Ops Agent',
    status: 'coming' as const,
    tagline: 'Infrastructure, deployments & incident response',
    description: 'Manages deployments and incidents with memory of system state, past incidents, and runbook history.',
    capabilities: [
      'Deployment planning with change history',
      'Incident pattern recognition',
      'Runbook memory and suggestions',
      'Infrastructure state tracking',
      'Post-mortem learning',
    ],
    memoryUsage: ['Deployment history', 'Incident patterns', 'System topology', 'Runbooks', 'Change log'],
  },
];

const CONNECTION_CODE: Record<MethodType, { lang: string; code: string }> = {
  mcp: {
    lang: 'json',
    code: `// .cursor/mcp.json  (or equivalent config)
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "http://127.0.0.1:8000/api",
        "MM_API_KEY": "your-api-key",
        "MM_AGENT_ID": "cursor-primary",
        "MM_PROJECT": "current-repo",
        "MM_MEMORY_BACKEND": "local_cognee"
      }
    }
  }
}`,
  },
  api: {
    lang: 'typescript',
    code: `// Wrap your agent's session lifecycle
import { MemoryMeshClient } from '@memorymsh/sdk';

const mm = new MemoryMeshClient({
  baseUrl: process.env.MM_API_URL ?? 'http://127.0.0.1:8000',
  apiKey: process.env.MM_API_KEY,
  defaultMemoryBackend: 'local_cognee',
});

// On session start — restore context
const context = await mm.recall({
  dataset: 'current-repo',
  query: 'What decisions, failures, files, and next actions matter?'
});
console.log(context);

// During session — persist decisions
await mm.remember({
  dataset: 'current-repo',
  text: 'Decision: use Postgres over SQLite for scale',
  metadata: { agent_id: 'my-agent' },
});

// On session end — improve and clean up
await mm.improveMemory({
  dataset: 'current-repo',
  feedback: 'Future agents should check migrations before changing auth.'
});`,
  },
  sdk: {
    lang: 'python',
    code: `# Python SDK — works with LangChain, CrewAI, etc.
from memorymesh import MemoryMeshClient

mm = MemoryMeshClient(
    base_url=os.environ.get("MM_API_URL", "http://127.0.0.1:8000"),
    api_key=os.environ.get("MM_API_KEY"),
    default_memory_backend="local_cognee",
)

context = mm.recall(
    query="Restore project memory before this run",
    dataset="current-repo",
)

result = your_agent.run(
    task="Continue the work",
    context=context,
)

mm.remember(
    text=str(result),
    dataset="current-repo",
    metadata={"agent_id": "research-agent"},
)`,
  },
};

const EXTERNAL_AGENTS = [
  { name: 'Cursor', desc: 'Add MCP config to .cursor/mcp.json', method: 'MCP' },
  { name: 'Claude Code', desc: 'Use Cognee hooks/plugin-dir, or MemoryMesh REST API', method: 'Plugin / API' },
  { name: 'Codex', desc: 'Integrate via REST API or SDK', method: 'API / SDK' },
  { name: 'OpenClaw', desc: 'Use Cognee OpenClaw plugin, or MemoryMesh API bridge', method: 'Plugin / API' },
  { name: 'OpenCode', desc: 'Use Cognee OpenCode plugin, or MemoryMesh MCP/API', method: 'Plugin / MCP' },
  { name: 'LangChain', desc: 'Use the Python SDK memory module', method: 'SDK' },
  { name: 'CrewAI', desc: 'Drop-in memory tool via Python SDK', method: 'SDK' },
  { name: 'AutoGen', desc: 'Custom memory plugin via SDK', method: 'SDK' },
  { name: 'Any MCP agent', desc: 'One config block, works everywhere', method: 'MCP' },
];

export function AgentsPage({ onNavigate, onEnterWorkspace }: Props) {
  const [tab, setTab] = useState<TabType>('builtin');
  const [method, setMethod] = useState<MethodType>('mcp');
  const [expanded, setExpanded] = useState<string | null>('Build Assistant');

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(34,211,238,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Agents</p>
          <h1 className="font-display text-5xl md:text-6xl text-foreground leading-tight mb-6">
            Bring your agent.<br />
            <span className="italic" style={{ color: '#22d3ee' }}>Or use ours.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Run a built-in agent from the workspace, or connect the agents you already use. Either way, memory is handled automatically.
          </p>

          {/* Tab switcher */}
          <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 gap-1">
            {[
              { id: 'builtin' as const, label: 'Built-in agents' },
              { id: 'connect' as const, label: 'Connect your agent' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {tab === 'builtin' ? (
        /* ── Built-in agents ─────────────────────────────── */
        <section className="px-6 pb-24 border-t border-border">
          <div className="max-w-6xl mx-auto pt-16">
            <div className="space-y-4">
              {BUILTIN_AGENTS.map(agent => (
                <div
                  key={agent.name}
                  className={`rounded-2xl border transition-all ${
                    expanded === agent.name ? 'border-primary/25 bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  {/* Header row */}
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                    onClick={() => setExpanded(expanded === agent.name ? null : agent.name)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                        agent.status === 'available' ? 'bg-primary/10 border-primary/20' : 'bg-muted/40 border-border'
                      }`}>
                        <agent.icon className={`w-5 h-5 ${agent.status === 'available' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-foreground">{agent.name}</span>
                          {agent.status === 'available' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Available</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />Coming soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.tagline}</p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === agent.name ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {/* Expanded content */}
                  {expanded === agent.name && (
                    <div className="px-6 pb-6 border-t border-border/50">
                      <div className="grid md:grid-cols-2 gap-8 pt-6">
                        <div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{agent.description}</p>
                          <h4 className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">Capabilities</h4>
                          <ul className="space-y-2">
                            {agent.capabilities.map(c => (
                              <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />{c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">Memory stores</h4>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {agent.memoryUsage.map(m => (
                              <span key={m} className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground">
                                {m}
                              </span>
                            ))}
                          </div>
                          {agent.status === 'available' ? (
                            <button onClick={onEnterWorkspace}
                              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
                              Run in workspace <ArrowRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button className="text-sm text-muted-foreground border border-border px-5 py-2.5 rounded-lg cursor-default opacity-50">
                              Coming soon
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* ── Connect your agent ────────────────────────────── */
        <section className="px-6 pb-24 border-t border-border">
          <div className="max-w-6xl mx-auto pt-16">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left: method selector + code */}
              <div>
                <h2 className="font-display text-3xl text-foreground mb-3">Connect in minutes.</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Three integration methods — MCP for editor agents, REST API for custom workflows, and SDK for programmatic control.
                </p>

                {/* Method tabs */}
                <div className="flex gap-1 p-1 rounded-lg border border-border bg-muted/20 mb-4">
                  {([
                    { id: 'mcp' as const, label: 'MCP', icon: Terminal },
                    { id: 'api' as const, label: 'REST API', icon: Code2 },
                    { id: 'sdk' as const, label: 'SDK', icon: Package },
                  ]).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                        method === m.id ? 'bg-card text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" />{m.label}
                    </button>
                  ))}
                </div>

                {/* Code block */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                    </div>
                    <span className="text-xs font-mono-ui text-muted-foreground">
                      {method === 'mcp' ? 'mcp-config.json' : method === 'api' ? 'session.ts' : 'agent.py'}
                    </span>
                    <span className="text-xs text-muted-foreground">{CONNECTION_CODE[method].lang}</span>
                  </div>
                  <pre className="p-4 text-xs font-mono-ui text-muted-foreground overflow-x-auto hide-scrollbar leading-relaxed">
                    <code>{CONNECTION_CODE[method].code}</code>
                  </pre>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Setup takes about 2 minutes. No prompt engineering required.
                </div>
              </div>

              {/* Right: compatible agents */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-4">Compatible agents</h3>
                <div className="space-y-2 mb-8">
                  {EXTERNAL_AGENTS.map(agent => (
                    <div key={agent.name}
                      className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/15 transition-colors group">
                      <div>
                        <p className="text-sm font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.desc}</p>
                      </div>
                      <span className="text-xs font-mono-ui text-muted-foreground border border-border rounded px-2 py-0.5">{agent.method}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm font-medium text-foreground mb-2">Using a custom agent?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Any agent that can make HTTP requests or run a subprocess can use MemoryMesh. The REST API is fully documented and the MCP server follows the open standard.
                  </p>
                  <button onClick={() => onNavigate('docs')}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    Read the integration guide <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl text-foreground mb-4">
            Your agent + <span className="italic" style={{ color: '#22d3ee' }}>persistent memory.</span>
          </h2>
          <p className="text-muted-foreground mb-8">Start with the workspace to see a built-in agent in action, or dive into the docs to connect your own.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={onEnterWorkspace}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm">
              Open workspace <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('docs')}
              className="text-sm text-muted-foreground border border-border px-6 py-3 rounded-lg hover:text-foreground hover:border-foreground/15 transition-all">
              Integration docs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
