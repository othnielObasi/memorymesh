import { Activity, Brain, ChevronLeft } from 'lucide-react';

interface TopbarProps {
  memoryStatus: 'ready' | 'connecting' | 'offline' | 'fallback';
  serviceStatus: 'operational' | 'degraded' | 'offline';
  onBack?: () => void;
  userName?: string | null;
  workspaceName?: string | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export function Topbar({ memoryStatus, serviceStatus, onBack, userName, workspaceName, onSignIn, onSignOut }: TopbarProps) {
  const statusColor = (s: string) => {
    if (s === 'ready' || s === 'operational') return 'text-green-400';
    if (s === 'connecting' || s === 'degraded' || s === 'fallback') return 'text-yellow-400';
    return 'text-muted-foreground';
  };
  const memoryDot =
    memoryStatus === 'ready'
      ? 'bg-green-400 animate-pulse'
      : memoryStatus === 'fallback' || memoryStatus === 'connecting'
        ? 'bg-yellow-400'
        : 'bg-muted-foreground';

  return (
    <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mr-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Home
            </button>
          )}
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">MemoryMesh</span>
          <span className="text-xs text-muted-foreground font-mono border border-border rounded px-1.5 py-0.5 ml-1">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-5">
          {workspaceName && (
            <div className="hidden md:block text-xs text-muted-foreground">
              Workspace: <span className="text-foreground/80">{workspaceName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${statusColor(serviceStatus)}`} />
            <span className="text-xs text-muted-foreground">
              Service: <span className="capitalize text-foreground/70">{serviceStatus}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${memoryDot}`} />
            <span className="text-xs text-muted-foreground">
              Memory: <span className="capitalize text-foreground/70">{memoryStatus}</span>
            </span>
          </div>
          {(userName || onSignIn) && (
            userName ? (
              <button
                onClick={onSignOut}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted/50 transition-colors"
              >
                {userName} - Sign out
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                Sign in
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
