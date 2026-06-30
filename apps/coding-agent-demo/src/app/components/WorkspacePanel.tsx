import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Play, Link2, RotateCcw, Clock, Brain } from 'lucide-react';
import type { ConnectionState, SessionRecord } from '../App';

interface Props {
  mode: 'run' | 'connect';
  onModeChange: (mode: 'run' | 'connect') => void;
  taskInput: string;
  onTaskInputChange: (v: string) => void;
  memoryLocation: 'local' | 'cloud' | 'demo';
  onMemoryLocationChange: (v: 'local' | 'cloud' | 'demo') => void;
  selectedAgent: string | null;
  selectedConnection: string | null;
  onStartSession: () => void;
  onConnect: () => void;
  onNewSession: () => void;
  sessionActive: boolean;
  sessionDone: boolean;
  connectionState: ConnectionState;
  sessionHistory: SessionRecord[];
}

const LOCATION_BADGE: Record<string, { label: string; cls: string }> = {
  local: { label: 'Private local',    cls: 'text-green-400 bg-green-400/10 border-green-400/20' },
  cloud: { label: 'Cloud (managed)',  cls: 'text-primary bg-primary/10 border-primary/20' },
  demo:  { label: 'Demo (temporary)', cls: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
};

export function WorkspacePanel({
  mode, onModeChange,
  taskInput, onTaskInputChange,
  memoryLocation, onMemoryLocationChange,
  selectedAgent, selectedConnection,
  onStartSession, onConnect, onNewSession,
  sessionActive, sessionDone, connectionState, sessionHistory,
}: Props) {
  const canRun       = !!(selectedAgent && taskInput.trim());
  const canConnect   = !!(selectedConnection && connectionState === 'setup');
  const isConnecting = connectionState === 'connecting';
  const isLive       = connectionState === 'live' || connectionState === 'complete';

  const connectLabel = isConnecting ? 'Connecting…' : isLive ? 'Connected' : 'Connect agent';
  const badge = LOCATION_BADGE[memoryLocation];

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm sticky top-20">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Workspace</h3>
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as 'run' | 'connect')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="run" className="flex items-center gap-1.5 text-xs">
              <Play className="w-3.5 h-3.5" />Run an agent
            </TabsTrigger>
            <TabsTrigger value="connect" className="flex items-center gap-1.5 text-xs">
              <Link2 className="w-3.5 h-3.5" />Connect yours
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-5 space-y-5">
        {/* Active memory location badge */}
        {(sessionActive || sessionDone || isLive) && (
          <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${badge.cls}`}>
            <Brain className="w-3 h-3" />
            {badge.label}
          </div>
        )}

        {/* Run mode: task input */}
        {mode === 'run' && !sessionDone && (
          <div>
            <Label htmlFor="task" className="text-xs font-medium mb-2 block text-foreground">
              Task description
            </Label>
            <Textarea
              id="task"
              placeholder="Describe what you want the agent to build or accomplish…"
              value={taskInput}
              onChange={(e) => onTaskInputChange(e.target.value)}
              className="min-h-[100px] text-sm bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
              disabled={sessionActive}
            />
          </div>
        )}

        {/* Connect mode: status hint */}
        {mode === 'connect' && !isLive && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed">
            {!selectedConnection
              ? 'Select an agent on the right to begin setup.'
              : connectionState === 'setup'
              ? 'Follow the steps on the right, then click Connect.'
              : 'Establishing connection — please wait…'}
          </div>
        )}

        {/* Memory location */}
        <div>
          <Label className="text-xs font-medium mb-3 block text-foreground">Memory location</Label>
          <RadioGroup
            value={memoryLocation}
            onValueChange={(v) => onMemoryLocationChange(v as 'local' | 'cloud' | 'demo')}
            disabled={sessionActive || isLive}
          >
            <div className="space-y-2.5">
              {[
                { value: 'local', label: 'Private local',  desc: 'Self-hosted Cognee' },
                { value: 'cloud', label: 'Cloud memory',   desc: 'Managed Cognee Cloud' },
                { value: 'demo',  label: 'Demo memory',    desc: 'Temporary — session only' },
              ].map(opt => (
                <div key={opt.value} className="flex items-start space-x-2.5">
                  <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={opt.value} className="text-sm font-medium cursor-pointer text-foreground">{opt.label}</Label>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Primary CTA */}
        {mode === 'run' ? (
          sessionDone ? (
            <Button onClick={onNewSession} variant="outline" className="w-full" size="lg">
              <RotateCcw className="w-4 h-4 mr-2" />New session
            </Button>
          ) : (
            <div>
              <Button
                onClick={onStartSession}
                disabled={!canRun || sessionActive}
                className="w-full"
                size="lg"
              >
                {sessionActive
                  ? <><span className="w-2 h-2 rounded-full bg-white/80 animate-pulse mr-2" />Running…</>
                  : 'Start session'}
              </Button>
              {/* Helper text when disabled */}
              {!sessionActive && !canRun && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {!selectedAgent
                    ? 'Select an agent above to continue'
                    : 'Enter a task description above to begin'}
                </p>
              )}
            </div>
          )
        ) : (
          <Button
            onClick={onConnect}
            disabled={!canConnect || isConnecting || isLive}
            variant={isLive ? 'outline' : 'default'}
            className="w-full"
            size="lg"
          >
            {connectLabel}
          </Button>
        )}

        {/* Session history */}
        {sessionHistory.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-2">
              Recent sessions
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {sessionHistory.map(rec => (
                <div key={rec.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="font-medium text-foreground/70 shrink-0">{rec.agent}</span>
                  <span className="truncate flex-1">{rec.task}</span>
                  <span className="shrink-0 font-mono-ui">{rec.memoryCount} ops</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
