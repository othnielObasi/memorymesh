import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { AlertTriangle, Brain, Eye, TrendingUp, Trash2, CheckCircle2, Loader } from 'lucide-react';
import type { MemoryActivity } from '../App';

interface Props {
  sessionActive: boolean;
  progress: number;
  memoryActivity: MemoryActivity[];
  agentStatus: string;
  agentThought?: string;
  memoryLocation: 'local' | 'cloud' | 'demo';
  mode: 'run' | 'connect';
}

const ICONS = { remember: Brain, recall: Eye, improve: TrendingUp, forget: Trash2 };
const COLORS = {
  remember: { text: 'text-primary',         bg: 'bg-primary/10',   color: '#818cf8' },
  recall:   { text: 'text-cyan-400',         bg: 'bg-cyan-400/10',  color: '#22d3ee' },
  improve:  { text: 'text-green-400',        bg: 'bg-green-400/10', color: '#34d399' },
  forget:   { text: 'text-muted-foreground', bg: 'bg-muted/40',     color: '#5a6a8a' },
};

const LOCATION_LABEL: Record<string, string> = {
  local: 'Private local memory',
  cloud: 'Managed cloud memory',
  demo:  'Demo memory',
};

// Typewriter hook
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!text) { setDisplayed(''); return; }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

export function SessionSection({ sessionActive, progress, memoryActivity, agentStatus, agentThought = '', memoryLocation, mode }: Props) {
  const typedThought = useTypewriter(agentThought);

  if (mode !== 'run' || (!sessionActive && memoryActivity.length === 0)) return null;

  const isDone = !sessionActive && memoryActivity.length > 0;
  const usedFallback = memoryActivity.some((item) => item.description.toLowerCase().includes('fallback used'));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Session</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{LOCATION_LABEL[memoryLocation]}</span>
          {sessionActive && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">Running</span>
            </div>
          )}
          {isDone && !usedFallback && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400 font-medium">Complete</span>
            </div>
          )}
          {isDone && usedFallback && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">Fallback used</span>
            </div>
          )}
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        {/* Progress */}
        <div className="px-5 pt-5 pb-4 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{agentStatus}</span>
            <span className="text-xs font-mono-ui text-muted-foreground tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />

          {/* Typewriter thought */}
          {(typedThought || agentThought) && sessionActive && (
            <div className="flex items-start gap-2 pt-2">
              <Loader className="w-3.5 h-3.5 text-primary animate-spin shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic leading-relaxed min-h-[1.25rem]">
                "{typedThought}<span className={typedThought.length < agentThought.length ? 'opacity-100' : 'opacity-0'}>▋</span>"
              </p>
            </div>
          )}
        </div>

        {/* Activity feed */}
        {memoryActivity.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-mono-ui text-muted-foreground uppercase tracking-widest mb-3">
              Memory activity
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {memoryActivity.map((a, i) => {
                const Icon = ICONS[a.type];
                const { text, bg, color } = COLORS[a.type];
                return (
                  <div key={a.id} className="flex items-start gap-3 text-xs"
                    style={{ animation: i === memoryActivity.length - 1 ? 'fadeInUp .2s ease-out' : 'none' }}>
                    <span className="font-mono-ui text-muted-foreground/40 shrink-0 pt-0.5 w-16 tabular-nums">{a.timestamp}</span>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-3 h-3 ${text}`} />
                    </div>
                    <span className="font-mono-ui font-medium w-16 shrink-0" style={{ color }}>{a.type}</span>
                    <span className="text-muted-foreground leading-relaxed">{a.description}</span>
                  </div>
                );
              })}
              {sessionActive && (
                <div className="flex items-center gap-2 pl-[90px] pt-1">
                  <Loader className="w-3 h-3 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Processing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completion */}
        {isDone && (
          <div className={`mx-4 mb-4 flex items-start gap-2 rounded-lg border p-3 ${
            usedFallback ? 'border-yellow-400/20 bg-yellow-400/8' : 'border-green-400/20 bg-green-400/8'
          }`}>
            {usedFallback ? (
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            )}
            <p className={`text-xs leading-relaxed ${usedFallback ? 'text-yellow-300' : 'text-green-400'}`}>
              {usedFallback
                ? 'Session completed with offline fallback. The workflow ran, but local Cognee was not the live memory backend for at least one operation.'
                : 'Session complete - all work persisted to memory. Recovery summary and outcome evidence are below.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
