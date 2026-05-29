import { useState } from 'react';
import { Terminal, Box, Code2, Zap, Plug, CheckCircle2, Circle, Loader, Wifi, Brain, Eye, TrendingUp, Trash2, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { ConnectionState, MemoryActivity } from '../App';

interface Props {
  selectedConnection: string | null;
  onSelectConnection: (id: string) => void;
  mode: 'run' | 'connect';
  connectionState: ConnectionState;
  connectActivity: MemoryActivity[];
  connectProgress: number;
  connectStatus: string;
  onDisconnect: () => void;
}

const AGENTS = [
  { id: 'cursor',      name: 'Cursor',       icon: Terminal, color: 'from-indigo-500 to-blue-500',   method: 'MCP' },
  { id: 'claude-code', name: 'Claude Code',  icon: Code2,    color: 'from-amber-500 to-orange-500',  method: 'MCP' },
  { id: 'codex',       name: 'Codex',        icon: Box,      color: 'from-violet-500 to-purple-500', method: 'API' },
  { id: 'openclaw',    name: 'OpenClaw',     icon: Zap,      color: 'from-teal-500 to-green-500',    method: 'MCP' },
  { id: 'custom',      name: 'Custom agent', icon: Plug,     color: 'from-pink-500 to-rose-500',     method: 'SDK' },
];

type Method = 'MCP' | 'API' | 'SDK';

const CONFIG: Record<Method, { filename: string; code: (id: string) => string }> = {
  MCP: {
    filename: '.cursor/mcp.json',
    code: id => `{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymesh/mcp-server"],
      "env": {
        "MM_API_URL": "http://127.0.0.1:8000/api",
        "MM_API_KEY": "mm_local_or_cloud_key",
        "MM_AGENT_ID": "${id}-primary",
        "MM_MEMORY_BACKEND": "local_cognee",
        "MM_PROJECT": "current-repo"
      }
    }
  }
}`,
  },
  API: {
    filename: 'AGENTS.md',
    code: id => `# MemoryMesh instructions for ${id}

Before editing code:
1. Recall project memory:
   POST http://127.0.0.1:8000/api/memory/recall
   {
     "backend": "local_cognee",
     "dataset": "current-repo",
     "query": "What project decisions, failures, test signals, and handoff notes matter for this task?"
   }

During work:
- Prefer the relevant files and next actions from the MemoryMesh receipt.
- Do not store secrets.
- Save decisions, test failures, and final proof back to MemoryMesh.

After work:
POST http://127.0.0.1:8000/api/memory/remember
{
  "backend": "local_cognee",
  "dataset": "current-repo",
  "text": "Decision/proof from this ${id} run..."
}

POST http://127.0.0.1:8000/api/memory/improve
{
  "backend": "local_cognee",
  "dataset": "current-repo",
  "feedback": "What future agents should do better next time."
}`,
  },
  SDK: {
    filename: 'agent.py',
    code: id => `import requests

API = "http://127.0.0.1:8000/api"
DATASET = "current-repo"

def recall(task: str):
    return requests.post(f"{API}/memory/recall", json={
        "backend": "local_cognee",
        "dataset": DATASET,
        "query": task,
        "metadata": {"agent_id": "${id}"}
    }).json()

def remember(text: str):
    return requests.post(f"{API}/memory/remember", json={
        "backend": "local_cognee",
        "dataset": DATASET,
        "text": text,
        "metadata": {"agent_id": "${id}"}
    }).json()

context = recall("Restore project memory before this agent run")
result = your_agent.run(task="Continue the coding task", context=context)
remember(str(result))`,
  },
};

const OP_ICONS = { remember: Brain, recall: Eye, improve: TrendingUp, forget: Trash2 };
const OP_STYLE: Record<string, { text: string; bg: string; color: string }> = {
  remember: { text: 'text-primary',           bg: 'bg-primary/10',    color: '#818cf8' },
  recall:   { text: 'text-cyan-400',           bg: 'bg-cyan-400/10',   color: '#22d3ee' },
  improve:  { text: 'text-green-400',          bg: 'bg-green-400/10',  color: '#34d399' },
  forget:   { text: 'text-muted-foreground',   bg: 'bg-muted/40',      color: '#5a6a8a' },
};

const HANDSHAKE = [
  'Handshaking with MCP server…',
  'Verifying API key…',
  'Loading memory location (demo)…',
  'Session established.',
];

export function ConnectAgentSection({
  selectedConnection, onSelectConnection, mode,
  connectionState, connectActivity, connectProgress, connectStatus, onDisconnect,
}: Props) {
  const [method, setMethod] = useState<Method>('MCP');
  const [copied, setCopied] = useState(false);

  if (mode !== 'connect') return null;

  const agent = AGENTS.find(a => a.id === selectedConnection);
  const cfg = CONFIG[method];

  const handleCopy = () => {
    if (!selectedConnection) return;
    navigator.clipboard.writeText(cfg.code(selectedConnection));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ── Connecting ────────────────────────────────────────────────────
  if (connectionState === 'connecting') {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Loader className="w-4 h-4 text-primary animate-spin" />
          Connecting {agent?.name}…
        </h3>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          {HANDSHAKE.map((step, i) => {
            const isDone   = connectStatus === 'Session established.' || HANDSHAKE.indexOf(connectStatus) > i;
            const isActive = connectStatus === step;
            return (
              <div key={step} className="flex items-center gap-3">
                {isDone   ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                 : isActive ? <Loader      className="w-4 h-4 text-primary animate-spin shrink-0" />
                 :            <Circle      className="w-4 h-4 text-muted-foreground/25 shrink-0" />}
                <span className={`text-sm ${isActive ? 'text-foreground' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/35'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Live / complete ───────────────────────────────────────────────
  if (connectionState === 'live' || connectionState === 'complete') {
    const isLive = connectionState === 'live';
    const AgentIcon = agent?.icon ?? Plug;
    return (
      <div className="space-y-3">
        {/* Header with agent identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent?.color ?? 'from-gray-500 to-gray-600'} flex items-center justify-center shrink-0`}>
              <AgentIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground leading-tight">{agent?.name ?? 'Agent'}</h3>
              <p className="text-xs text-muted-foreground">MCP · demo memory</p>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
              <span className={`text-xs font-medium ${isLive ? 'text-green-400' : 'text-muted-foreground'}`}>
                {isLive ? 'Live' : 'Complete'}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDisconnect}
            className="text-xs text-muted-foreground hover:text-red-400 gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Disconnect
          </Button>
        </div>

        {/* Live terminal feed */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Wifi className={`w-3.5 h-3.5 ${isLive ? 'text-green-400' : 'text-muted-foreground/40'}`} />
              <span className="text-xs font-mono-ui text-muted-foreground">memory activity stream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-ui text-muted-foreground">{connectProgress}%</span>
            </div>
          </div>
          <div className="h-1 bg-muted">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${connectProgress}%` }} />
          </div>
          <div className="p-4 space-y-2 min-h-[200px] max-h-80 overflow-y-auto">
            {connectActivity.length === 0 && (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-muted-foreground">Waiting for agent activity…</p>
              </div>
            )}
            {connectActivity.map((a, i) => {
              const Icon = OP_ICONS[a.type];
              const s = OP_STYLE[a.type];
              return (
                <div key={a.id} className="flex items-start gap-3 text-xs"
                  style={{ animation: i === connectActivity.length - 1 ? 'fadeInUp .2s ease-out' : 'none' }}>
                  <span className="font-mono-ui text-muted-foreground/40 shrink-0 pt-0.5 w-16">{a.timestamp}</span>
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${s.bg}`}>
                    <Icon className={`w-3 h-3 ${s.text}`} />
                  </div>
                  <span className="font-mono-ui font-medium w-16 shrink-0" style={{ color: s.color }}>{a.type}</span>
                  <span className="text-muted-foreground leading-relaxed">{a.description}</span>
                </div>
              );
            })}
            {isLive && connectActivity.length > 0 && (
              <div className="flex items-center gap-2 pl-[88px]">
                <Loader className="w-3 h-3 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Agent working…</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Setup ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Connect your agent</h3>
        <p className="text-sm text-muted-foreground">Pick your agent, copy the config, click Connect — done in 2 minutes.</p>
      </div>

      {/* Step 1 */}
      <div>
        <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">
          <span className="text-primary mr-2">01</span>Choose your agent
        </p>
        <div className="grid grid-cols-5 gap-2">
          {AGENTS.map(a => {
            const Icon = a.icon;
            const sel  = selectedConnection === a.id;
            return (
              <button key={a.id} onClick={() => onSelectConnection(a.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  sel ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-primary/20'
                }`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-foreground text-center leading-tight">{a.name}</span>
                <span className="text-xs font-mono-ui text-muted-foreground">{a.method}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedConnection && (
        <>
          {/* Step 2 */}
          <div>
            <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">
              <span className="text-primary mr-2">02</span>Connection method
            </p>
            <div className="flex gap-1 p-1 rounded-lg border border-border bg-muted/20">
              {(['MCP', 'API', 'SDK'] as Method[]).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                    method === m ? 'bg-card text-foreground border border-border shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">
              <span className="text-primary mr-2">03</span>Add to your config
            </p>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="text-xs font-mono-ui text-muted-foreground">{cfg.filename}</span>
                <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono-ui text-muted-foreground overflow-x-auto leading-relaxed hide-scrollbar">
                <code>{cfg.code(selectedConnection)}</code>
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Replace <span className="font-mono-ui text-foreground/60">mm_demo_xxxxxxxxxxxx</span> with your real API key, then click <strong className="text-foreground">Connect agent</strong> in the left panel.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
