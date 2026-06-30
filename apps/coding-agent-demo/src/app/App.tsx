import { useState, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import { LandingPage } from './LandingPage';
import { Topbar } from './components/Topbar';
import { WorkspacePanel } from './components/WorkspacePanel';
import { AgentsSection } from './components/AgentsSection';
import { ConnectAgentSection } from './components/ConnectAgentSection';
import { SessionSection } from './components/SessionSection';
import { RecoverySection } from './components/RecoverySection';
import { OutcomeSection } from './components/OutcomeSection';
import { MemoryLocationsSection } from './components/MemoryLocationsSection';
import { MemoryBrowser } from './components/MemoryBrowser';
import { WorkspaceEmptyState } from './components/WorkspaceEmptyState';

export interface MemoryActivity {
  id: string;
  type: 'remember' | 'recall' | 'improve' | 'forget';
  description: string;
  timestamp: string;
}

export interface RecoveryData {
  contextLost: boolean;
  recoveredItems: string[];
  recoveryTime: string;
  summary: string;
}

export interface OutcomeData {
  changes: { type: string; file: string; description: string }[];
  before: string;
  after: string;
  summary: string;
}

export interface SessionRecord {
  id: string;
  type: 'run' | 'connect';
  agent: string;
  task: string;
  memoryCount: number;
  time: string;
}

export type ConnectionState = 'idle' | 'setup' | 'connecting' | 'live' | 'complete';

const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const API_BASE =
  import.meta.env.VITE_MEMORYMESH_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

type RunStep = {
  progress: number;
  status: string;
  thought: string;
  activity: Omit<MemoryActivity, 'id' | 'timestamp'>;
};

type RunProfile = {
  name: string;
  fallbackTask: string;
  started: string;
  complete: string;
  steps: RunStep[];
  recovery: RecoveryData;
  outcome: OutcomeData;
};

const RUN_PROFILES: Record<string, RunProfile> = {
  build: {
    name: 'Build Assistant',
    fallbackTask: 'Auth system',
    started: 'Restoring project memory and preparing a build plan.',
    complete: 'Code work persisted with implementation evidence.',
    steps: [
      { progress: 10, status: 'Recalling project context from memory...', thought: 'Check the project structure and prior architecture decisions before changing code.', activity: { type: 'recall', description: 'Loaded project structure, architecture decisions, and dependency graph.' } },
      { progress: 22, status: 'Analysing task requirements...', thought: 'Break the task into schema, API, UI components, and tests.', activity: { type: 'remember', description: 'Stored task breakdown and implementation plan for this session.' } },
      { progress: 38, status: 'Generating schema and data models...', thought: 'Apply the existing Postgres pattern and keep auth state explicit.', activity: { type: 'remember', description: 'Stored users table, sessions table, and index design.' } },
      { progress: 52, status: 'Building API route handlers...', thought: 'Create login, register, and logout handlers with clear error states.', activity: { type: 'remember', description: 'Stored auth endpoint design, token strategy, and validation rules.' } },
      { progress: 66, status: 'Improving patterns from prior sessions...', thought: 'Use the remembered argon2 decision instead of falling back to bcrypt.', activity: { type: 'improve', description: 'Applied argon2 hashing from approved project memory.' } },
      { progress: 80, status: 'Generating UI components...', thought: 'Reuse recalled component conventions to avoid re-explaining style rules.', activity: { type: 'recall', description: 'Recalled form validation and component structure patterns.' } },
      { progress: 91, status: 'Cleaning up stale references...', thought: 'Remove deprecated auth verification work that memory says was dropped.', activity: { type: 'forget', description: 'Removed deprecated /auth/verify memory from the active run context.' } },
      { progress: 100, status: 'Session complete - all work persisted.', thought: '', activity: { type: 'remember', description: 'Persisted full auth implementation, file locations, and next-session notes.' } },
    ],
    recovery: {
      contextLost: false,
      recoveredItems: ['Prior architecture decisions: Postgres, JWT, argon2', 'Component conventions and folder structure', 'In-progress task plan', 'Known fixes already applied'],
      recoveryTime: '0.8s',
      summary: 'Build Assistant kept the implementation state recoverable. If the session stopped mid-run, MemoryMesh could restore the task plan, files touched, decisions, and next safe action.',
    },
    outcome: {
      changes: [
        { type: 'created', file: 'src/lib/auth.ts', description: 'Argon2 hashing, JWT signing, session helpers.' },
        { type: 'created', file: 'src/api/routes/auth.ts', description: 'Login, register, and logout route handlers.' },
        { type: 'created', file: 'src/db/schema/users.ts', description: 'User and session schema with indexes.' },
        { type: 'created', file: 'src/components/auth/LoginForm.tsx', description: 'Login form with validation and loading state.' },
        { type: 'modified', file: 'src/app/App.tsx', description: 'Protected route wrapper and auth provider wiring.' },
      ],
      before: '// before\n<Route path="/dashboard" element={<Dashboard />} />',
      after: '// after\n<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />',
      summary: 'Full auth flow drafted with memory-backed decisions and a recoverable implementation trail.',
    },
  },
  research: {
    name: 'Research Assistant',
    fallbackTask: 'Compare memory approaches for AI agents',
    started: 'Preparing source-backed research memory.',
    complete: 'Research brief persisted with source trail.',
    steps: [
      { progress: 12, status: 'Recalling research scope...', thought: 'Start from the existing question, exclusions, and preferred source types.', activity: { type: 'recall', description: 'Loaded research objective, source policy, and open questions from memory.' } },
      { progress: 24, status: 'Building source plan...', thought: 'Separate primary sources, implementation examples, and risks.', activity: { type: 'remember', description: 'Stored source plan: docs, repos, architecture notes, and validation criteria.' } },
      { progress: 40, status: 'Collecting candidate evidence...', thought: 'Track why each source matters, not just the link.', activity: { type: 'remember', description: 'Saved source notes with relevance, claim supported, and confidence level.' } },
      { progress: 56, status: 'Clustering findings...', thought: 'Group evidence into product, technical, adoption, and risk themes.', activity: { type: 'improve', description: 'Merged duplicate findings into reusable research memory clusters.' } },
      { progress: 72, status: 'Checking contradictions...', thought: 'Identify claims that need stronger proof before they are reused.', activity: { type: 'recall', description: 'Retrieved prior contradictory notes and unresolved assumptions.' } },
      { progress: 88, status: 'Writing research brief...', thought: 'Keep the answer traceable to evidence and decisions.', activity: { type: 'remember', description: 'Stored final brief, open questions, and recommended follow-up research.' } },
      { progress: 100, status: 'Research session complete.', thought: '', activity: { type: 'remember', description: 'Persisted source trail and reusable research memory.' } },
    ],
    recovery: {
      contextLost: false,
      recoveredItems: ['Research objective and source policy', 'Candidate evidence list', 'Finding clusters', 'Open questions and contradictions'],
      recoveryTime: '0.7s',
      summary: 'Research Assistant can resume with the same source trail and evidence ranking instead of restarting from a blank search.',
    },
    outcome: {
      changes: [
        { type: 'created', file: 'research/source-trail.md', description: 'Sources grouped by claim, relevance, and confidence.' },
        { type: 'created', file: 'research/findings-brief.md', description: 'Decision-ready brief with key findings and caveats.' },
        { type: 'created', file: 'research/open-questions.md', description: 'Unresolved questions carried forward for the next run.' },
      ],
      before: 'Question only, no persistent source trail.',
      after: 'Brief, source trail, contradictions, and next questions saved as memory.',
      summary: 'Research output is now reusable: the next session can recall sources, findings, contradictions, and the unfinished investigation state.',
    },
  },
  support: {
    name: 'Support Assistant',
    fallbackTask: 'Investigate unresolved support tickets',
    started: 'Starting ticket investigation with checkpointed runtime state.',
    complete: 'Ticket investigation persisted with recovery cursor.',
    steps: [
      { progress: 10, status: 'Starting MemoryMesh run...', thought: 'Create a durable run for ticket-investigation-agent.', activity: { type: 'remember', description: 'Started run: agent_id=ticket-investigation-agent, dataset=support_tickets.' } },
      { progress: 22, status: 'Preparing investigation plan...', thought: 'Fetch open tickets, follow continuation signals, save checkpoint, summarize recurring issues.', activity: { type: 'remember', description: 'Recorded plan_prepared event with ticket investigation steps.' } },
      { progress: 38, status: 'Fetching support tickets...', thought: 'Tool output has next_page_token=page_2, so the investigation is not complete yet.', activity: { type: 'remember', description: 'Recorded fetch_support_tickets trace: 50 items, next_page_token=page_2.' } },
      { progress: 52, status: 'Saving checkpoint...', thought: 'Preserve page cursor and partial findings before continuing.', activity: { type: 'remember', description: 'Saved checkpoint support-page-1 with resume_state page_token=page_2.' } },
      { progress: 66, status: 'Restoring checkpoint...', thought: 'Validate that the agent can recover the exact cursor and partial findings.', activity: { type: 'recall', description: 'Restored checkpoint: page 1, next_page_token=page_2, partial finding billing delay.' } },
      { progress: 82, status: 'Recovering task...', thought: 'Resume from saved cursor instead of repeating page one.', activity: { type: 'improve', description: 'Recovered task from checkpoint with idempotency key ticket-demo-recover-001.' } },
      { progress: 100, status: 'Ticket investigation complete.', thought: '', activity: { type: 'remember', description: 'Persisted investigation receipt, recovery cursor, and recurring issue summary.' } },
    ],
    recovery: {
      contextLost: true,
      recoveredItems: ['Run id and ticket task', 'Tool trace for fetch_support_tickets', 'Checkpoint support-page-1', 'Resume cursor page_2 and partial findings'],
      recoveryTime: '0.6s',
      summary: 'Support Assistant uses the fuller ticket-investigation path: MemoryMesh records the run, tool trace, checkpoint, restored state, and recovered task so the agent can continue without repeating earlier work.',
    },
    outcome: {
      changes: [
        { type: 'recorded', file: 'run: ticket-investigation-agent', description: 'Started durable support-ticket investigation run.' },
        { type: 'recorded', file: 'tool: fetch_support_tickets', description: 'Stored tool trace with next_page_token=page_2.' },
        { type: 'saved', file: 'checkpoint: support-page-1', description: 'Saved partial findings and resume cursor.' },
        { type: 'recovered', file: 'resume_state', description: 'Recovered task from checkpoint without repeating page one.' },
      ],
      before: 'Open-ticket investigation could lose cursor and repeat already fetched records.',
      after: 'Investigation has a durable checkpoint, validated tool trace, resume cursor, and recovery receipt.',
      summary: 'Support Assistant is now wired through the ticket-investigation workflow, using the same lifecycle as examples/ticket-investigation-agent.',
    },
  },
};

function memoryBackend(location: 'local' | 'cloud' | 'demo') {
  if (location === 'local') return 'local_cognee';
  if (location === 'cloud') return 'cognee_cloud';
  return 'offline_mirror';
}

async function runBackendAgent(agentId: string | null, task: string, location: 'local' | 'cloud' | 'demo') {
  const response = await fetch(`${API_BASE}/api/agents/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId || 'build',
      task,
      memory_backend: memoryBackend(location),
    }),
  });
  if (!response.ok) {
    throw new Error(`Backend agent run failed: ${response.status}`);
  }
  return response.json();
}

function recoveryFromReceipt(receipt: any): RecoveryData {
  const recovery = receipt?.recovery || {};
  return {
    contextLost: recovery.mode?.includes('recovery') || recovery.mode?.includes('cursor') || false,
    recoveredItems: recovery.restores || recovery.brief?.next_actions || [
      `Agent: ${receipt?.agent_name || 'Agent'}`,
      `Run: ${receipt?.run_id || 'recorded'}`,
      `Evidence records: ${(receipt?.evidence || []).length}`,
      `Tool traces: ${(receipt?.tool_traces || []).length}`,
    ],
    recoveryTime: 'backend receipt',
    summary: recovery.brief?.summary || recovery.mode || 'Backend run returned durable recovery state.',
  };
}

function outcomeFromReceipt(receipt: any): OutcomeData {
  const traces = receipt?.tool_traces || [];
  const evidence = receipt?.evidence || [];
  return {
    changes: [
      ...traces.slice(0, 4).map((trace: any) => ({
        type: trace.tool || 'tool',
        file: trace.phase || trace.status || 'runtime',
        description: JSON.stringify(trace.output || trace).slice(0, 180),
      })),
      ...evidence.slice(0, 3).map((item: any) => ({
        type: 'evidence',
        file: item.url || item.id || item.label || 'source',
        description: item.claim || item.issue || item.value || JSON.stringify(item).slice(0, 180),
      })),
    ].slice(0, 5),
    before: `Task: ${receipt?.task || 'not recorded'}`,
    after: receipt?.final_output || receipt?.outcome?.summary || 'Backend agent completed.',
    summary: receipt?.outcome?.receipt || receipt?.outcome?.summary || receipt?.final_output || 'Backend agent completed with an inspectable receipt.',
  };
}

export default function App() {
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [mode, setMode] = useState<'run' | 'connect'>('run');
  const sessionRef = useRef<HTMLDivElement>(null);

  // run-mode
  const [selectedAgent, setSelectedAgent] = useState<string | null>('build');
  const [taskInput, setTaskInput] = useState('');
  const [memoryLocation, setMemoryLocation] = useState<'local' | 'cloud' | 'demo'>('demo');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [agentStatus, setAgentStatus] = useState('');
  const [agentThought, setAgentThought] = useState('');
  const [memoryActivity, setMemoryActivity] = useState<MemoryActivity[]>([]);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [outcomeData, setOutcomeData] = useState<OutcomeData | null>(null);

  // connect-mode
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectActivity, setConnectActivity] = useState<MemoryActivity[]>([]);
  const [connectProgress, setConnectProgress] = useState(0);
  const [connectStatus, setConnectStatus] = useState('');
  const [connectRecovery, setConnectRecovery] = useState<RecoveryData | null>(null);
  const [connectOutcome, setConnectOutcome] = useState<OutcomeData | null>(null);

  // shared history
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);

  const addHistory = (rec: Omit<SessionRecord, 'id'>) =>
    setSessionHistory(h => [{ ...rec, id: Date.now().toString() }, ...h].slice(0, 10));

  // ── Mode switch ────────────────────────────────────────────────────
  const handleModeChange = (m: 'run' | 'connect') => {
    if (sessionActive) {
      toast.warning('Session in progress', { description: 'Wait for the session to complete before switching modes.' });
      return;
    }
    setMode(m);
    if (m === 'run') {
      setSelectedConnection(null);
      setConnectionState('idle');
    }
  };

  // ── New session reset ──────────────────────────────────────────────
  const handleNewSession = () => {
    setSessionActive(false);
    setSessionDone(false);
    setProgress(0);
    setAgentStatus('');
    setAgentThought('');
    setMemoryActivity([]);
    setRecoveryData(null);
    setOutcomeData(null);
    setTaskInput('');
  };

  // ── Disconnect ─────────────────────────────────────────────────────
  const handleDisconnect = () => {
    setConnectionState('idle');
    setSelectedConnection(null);
    setConnectActivity([]);
    setConnectProgress(0);
    setConnectStatus('');
    setConnectRecovery(null);
    setConnectOutcome(null);
    toast.info('Agent disconnected');
  };

  // ── Run simulation ─────────────────────────────────────────────────
  const handleStartSession = () => {
    if (mode !== 'run') return;
    const profile = RUN_PROFILES[selectedAgent || 'build'] ?? RUN_PROFILES.build;
    const runTask = taskInput || profile.fallbackTask;
    const backendRun = runBackendAgent(selectedAgent, runTask, memoryLocation)
      .then((receipt) => ({ receipt }))
      .catch((error) => ({ error }));
    setSessionActive(true);
    setSessionDone(false);
    setProgress(0);
    setAgentStatus(`Initializing ${profile.name}...`);
    setAgentThought('');
    setMemoryActivity([]);
    setRecoveryData(null);
    setOutcomeData(null);
    toast.success('Session started', { description: `${profile.name} - ${memoryLocation} memory` });
    // Scroll to session output after short delay
    setTimeout(() => sessionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);

    const steps = profile.steps;
    const unusedBuildSteps = [
      { progress: 10, status: 'Recalling project context from memory…', thought: 'Let me check what I already know about this project before starting.', activity: { type: 'recall' as const, description: 'Loaded: project structure, 3 prior architecture decisions, dependency graph' } },
      { progress: 22, status: 'Analysing task requirements…', thought: 'Breaking the task into subtasks: schema → API → UI components → tests.', activity: { type: 'remember' as const, description: 'Stored: task breakdown and implementation plan for this session' } },
      { progress: 38, status: 'Generating schema and data models…', thought: 'Based on prior decisions, we use Postgres. User table needs: id, email, password_hash, created_at.', activity: { type: 'remember' as const, description: 'Stored: schema design — users table, sessions table, indexes' } },
      { progress: 52, status: 'Building API route handlers…', thought: 'POST /auth/login, /register, /logout. JWT tokens, 7-day expiry.', activity: { type: 'remember' as const, description: 'Stored: auth API design — endpoints, token strategy, error codes' } },
      { progress: 66, status: 'Improving patterns based on past sessions…', thought: 'I remember we moved from bcrypt to argon2 last month. Applying that here automatically.', activity: { type: 'improve' as const, description: 'Applied: argon2 hashing from prior session memory, replaced bcrypt default' } },
      { progress: 80, status: 'Generating UI components…', thought: 'Using component conventions recalled from memory — no need to re-explain style rules.', activity: { type: 'recall' as const, description: 'Recalled: component conventions, form validation patterns from prior work' } },
      { progress: 91, status: 'Cleaning up stale references…', thought: 'Removing the /auth/verify endpoint we decided to drop two sessions ago.', activity: { type: 'forget' as const, description: 'Removed: deprecated /auth/verify stub — no longer valid per prior decision' } },
      { progress: 100, status: 'Session complete — all work persisted to memory.', thought: '', activity: { type: 'remember' as const, description: 'Persisted: full auth implementation, file locations, patterns — ready for next session' } },
    ];

    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        setSessionActive(false);
        setSessionDone(true);
        setAgentThought('');
        toast.success('Session complete', { description: 'Work persisted to memory — recovery ready' });
        addHistory({ type: 'run', agent: profile.name, task: runTask, memoryCount: steps.length, time: ts() });
        setRecoveryData({
          contextLost: false,
          recoveredItems: ['Prior architecture decisions (Postgres, JWT, argon2)', 'Component conventions and folder structure', 'In-progress tasks from previous session', 'Known bug fixes already applied'],
          recoveryTime: '0.8s',
          summary: 'Full context maintained. If this session had crashed mid-way, all work up to the last checkpoint would be recoverable in under 1 second — zero re-explanation needed.',
        });
        setOutcomeData({
          changes: [
            { type: 'created',  file: 'src/lib/auth.ts',               description: 'Argon2 hashing, JWT signing/verification, session helpers' },
            { type: 'created',  file: 'src/api/routes/auth.ts',         description: 'POST /auth/login, /register, /logout with full validation' },
            { type: 'created',  file: 'src/db/schema/users.ts',         description: 'Drizzle ORM schema — users and sessions tables with indexes' },
            { type: 'created',  file: 'src/components/auth/LoginForm.tsx', description: 'Login form with error handling and loading state' },
            { type: 'modified', file: 'src/app/App.tsx',                description: 'Added protected route wrapper and auth context provider' },
          ],
          before: `// src/app/App.tsx (before)
import { Routes, Route } from 'react-router';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}`,
          after: `// src/app/App.tsx (after)
import { Routes, Route } from 'react-router';
import { AuthProvider } from './context/auth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}`,
          summary: 'Full email/password auth system built — schema, API, UI, and protected routes. Argon2 applied automatically from prior session memory. Zero re-explanation needed.',
        });
        setRecoveryData(profile.recovery);
        setOutcomeData(profile.outcome);
        backendRun
          .then(({ receipt, error }) => {
            if (error) throw error;
            setRecoveryData(recoveryFromReceipt(receipt));
            setOutcomeData(outcomeFromReceipt(receipt));
            toast.success('Backend receipt ready', { description: `${receipt.agent_name} returned a durable run receipt.` });
          })
          .catch((error) => {
            toast.warning('Using local preview receipt', { description: String(error).slice(0, 90) });
          });
        return;
      }
      const s = steps[i++];
      setProgress(s.progress);
      setAgentStatus(s.status);
      setAgentThought(s.thought);
      setMemoryActivity(prev => [...prev, { id: `a-${Date.now()}-${i}`, timestamp: ts(), ...s.activity }]);
      if (s.activity.type === 'remember') toast(`Memory stored`, { description: s.activity.description.slice(0, 60), duration: 2000 });
      if (s.activity.type === 'recall')   toast(`Memory recalled`, { description: s.activity.description.slice(0, 60), duration: 2000 });
      setTimeout(run, 1700);
    };
    setTimeout(run, 400);
  };

  // ── Connect simulation ─────────────────────────────────────────────
  const handleConnect = () => {
    if (!selectedConnection) return;
    setConnectionState('connecting');
    setConnectActivity([]);
    setConnectProgress(0);
    setConnectStatus('');
    setConnectRecovery(null);
    setConnectOutcome(null);
    toast.info('Connecting agent…', { description: `Establishing MCP session` });

    const handshake = [
      { delay: 600,  msg: 'Handshaking with MCP server…' },
      { delay: 1300, msg: 'Verifying API key…' },
      { delay: 2000, msg: 'Loading memory location (demo)…' },
      { delay: 2700, msg: 'Session established.' },
    ];
    handshake.forEach(({ delay, msg }) => setTimeout(() => setConnectStatus(msg), delay));

    setTimeout(() => {
      setConnectionState('live');
      setConnectStatus('Agent connected — session active');
      const agentLabel = selectedConnection === 'cursor' ? 'Cursor' : selectedConnection === 'claude-code' ? 'Claude Code' : selectedConnection === 'codex' ? 'Codex' : selectedConnection === 'openclaw' ? 'OpenClaw' : 'Custom agent';
      toast.success(`${agentLabel} connected`, { description: 'Live memory session active' });

      const live = [
        { progress: 12, activity: { type: 'recall'   as const, description: `${agentLabel} session started — recalled project context (14 memories loaded)` } },
        { progress: 25, activity: { type: 'remember' as const, description: 'Agent stored: current task — "refactor auth module to use argon2"' } },
        { progress: 40, activity: { type: 'recall'   as const, description: 'Retrieved: previous auth implementation, known patterns, file locations' } },
        { progress: 55, activity: { type: 'remember' as const, description: 'Agent stored: changed auth.ts — swapped bcrypt → argon2id, updated hash rounds' } },
        { progress: 68, activity: { type: 'improve'  as const, description: 'Refined: session token pattern updated based on new auth approach' } },
        { progress: 80, activity: { type: 'remember' as const, description: 'Agent stored: updated 3 dependent files — api/auth.ts, middleware/auth.ts, tests/auth.test.ts' } },
        { progress: 92, activity: { type: 'forget'   as const, description: 'Expired: stale bcrypt config — no longer valid after migration' } },
        { progress: 100, activity: { type: 'remember' as const, description: 'Session closed — all changes persisted. Ready for next agent session.' } },
      ];
      let j = 0;
      const runLive = () => {
        if (j >= live.length) {
          setConnectionState('complete');
          setConnectStatus('Session complete');
          toast.success('Agent session complete', { description: 'Work persisted to memory' });
          addHistory({ type: 'connect', agent: agentLabel, task: 'Auth module refactor', memoryCount: live.length, time: ts() });
          setConnectRecovery({
            contextLost: false,
            recoveredItems: [`${agentLabel} session context and task state`, 'File changes and line-level diffs', 'Architectural decisions made during session', 'Updated dependency and import map'],
            recoveryTime: '0.6s',
            summary: `${agentLabel} completed its session cleanly. If it reconnects tomorrow it will know exactly what changed, why, and what to do next.`,
          });
          setConnectOutcome({
            changes: [
              { type: 'modified', file: 'src/lib/auth.ts',        description: 'Replaced bcrypt with argon2id — faster verification, stronger security' },
              { type: 'modified', file: 'src/api/routes/auth.ts', description: 'Updated hash/verify calls to use new argon2 interface' },
              { type: 'modified', file: 'src/middleware/auth.ts', description: 'Adjusted token expiry from 24h to 7d per security policy' },
              { type: 'modified', file: 'tests/auth.test.ts',     description: 'Updated test fixtures to use argon2 hashed passwords' },
            ],
            before: `// src/lib/auth.ts (before)
import bcrypt from 'bcrypt';

export const hashPassword = (pw: string) =>
  bcrypt.hash(pw, 10);

export const verifyPassword = (pw: string, hash: string) =>
  bcrypt.compare(pw, hash);`,
            after: `// src/lib/auth.ts (after)
import argon2 from 'argon2';

export const hashPassword = (pw: string) =>
  argon2.hash(pw, { type: argon2.argon2id });

export const verifyPassword = (pw: string, hash: string) =>
  argon2.verify(hash, pw);`,
            summary: `${agentLabel} migrated auth from bcrypt to argon2id across 4 files. MemoryMesh tracked every decision — the agent knew argon2id was the agreed standard from prior memory.`,
          });
          return;
        }
        const s = live[j++];
        setConnectProgress(s.progress);
        setConnectActivity(prev => [...prev, { id: `c-${Date.now()}-${j}`, timestamp: ts(), ...s.activity }]);
        if (s.activity.type === 'remember') toast(`Memory stored`, { description: s.activity.description.slice(0, 55), duration: 2000 });
        setTimeout(runLive, 1700);
      };
      setTimeout(runLive, 500);
    }, 3000);
  };

  if (view === 'landing') {
    return (
      <>
        <Toaster position="bottom-right" theme="dark" />
        <LandingPage onEnterWorkspace={() => setView('workspace')} />
      </>
    );
  }

  const activeMemory  = mode === 'connect' ? connectActivity  : memoryActivity;
  const activeRecovery = mode === 'connect' ? connectRecovery : recoveryData;
  const activeOutcome  = mode === 'connect' ? connectOutcome  : outcomeData;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="bottom-right" theme="dark" />
      <Topbar memoryStatus="ready" serviceStatus="operational" onBack={() => setView('landing')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <AgentsSection selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} mode={mode} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="space-y-5">
            <WorkspacePanel
              mode={mode}
              onModeChange={handleModeChange}
              taskInput={taskInput}
              onTaskInputChange={setTaskInput}
              memoryLocation={memoryLocation}
              onMemoryLocationChange={setMemoryLocation}
              selectedAgent={selectedAgent}
              selectedConnection={selectedConnection}
              onStartSession={handleStartSession}
              onConnect={handleConnect}
              onNewSession={handleNewSession}
              sessionActive={sessionActive}
              sessionDone={sessionDone}
              connectionState={connectionState}
              sessionHistory={sessionHistory}
            />
            <MemoryBrowser
              activity={activeMemory}
              memoryLocation={memoryLocation}
              isActive={sessionActive || connectionState === 'live'}
            />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Empty state — shown only when nothing is running yet */}
            {!sessionActive && !sessionDone && connectionState === 'idle' && mode === 'run' && (
              <WorkspaceEmptyState selectedAgent={selectedAgent} onSuggest={setTaskInput} />
            )}
            <ConnectAgentSection
              selectedConnection={selectedConnection}
              onSelectConnection={(id) => {
                setSelectedConnection(id);
                setConnectionState('setup');
                setConnectActivity([]);
                setConnectRecovery(null);
                setConnectOutcome(null);
              }}
              mode={mode}
              connectionState={connectionState}
              connectActivity={connectActivity}
              connectProgress={connectProgress}
              connectStatus={connectStatus}
              onDisconnect={handleDisconnect}
            />

            <div ref={sessionRef}>
            <SessionSection
              sessionActive={sessionActive}
              progress={progress}
              memoryActivity={memoryActivity}
              agentStatus={agentStatus}
              agentThought={agentThought}
              memoryLocation={memoryLocation}
              mode={mode}
            />
            </div>

            <RecoverySection recoveryData={activeRecovery} />
            <OutcomeSection outcomeData={activeOutcome} />
          </div>
        </div>

        <MemoryLocationsSection />
      </div>
    </div>
  );
}
