import { Badge } from './ui/badge';
import { Code, Search, Headphones, Settings, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedAgent: string | null;
  onSelectAgent: (agent: string) => void;
  mode: 'run' | 'connect';
}

const AGENTS = [
  { id: 'build',    name: 'Build Assistant',    desc: 'Creates and modifies code with full memory of your project context.', icon: Code,        status: 'available', color: 'from-blue-500 to-cyan-500' },
  { id: 'research', name: 'Research Assistant',  desc: 'Gathers information, preserves source trails, and turns findings into reusable memory.', icon: Search,      status: 'available', color: 'from-purple-500 to-pink-500' },
  { id: 'support',  name: 'Support Assistant',   desc: 'Investigates support queues with checkpoints, tool traces, and recovery state.', icon: Headphones,  status: 'available', color: 'from-green-500 to-teal-500' },
  { id: 'ops',      name: 'Ops Assistant',       desc: 'Manages deployments and incidents with memory of system history.', icon: Settings,    status: 'coming',    color: 'from-orange-500 to-red-500' },
];

export function AgentsSection({ selectedAgent, onSelectAgent, mode }: Props) {
  if (mode !== 'run') return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-0.5">Run an agent</h3>
        <p className="text-sm text-muted-foreground">Choose a built-in assistant to start working</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AGENTS.map(agent => {
          const Icon = agent.icon;
          const isSelected  = selectedAgent === agent.id;
          const isAvailable = agent.status === 'available';

          return (
            <button
              key={agent.id}
              onClick={() => isAvailable && onSelectAgent(agent.id)}
              disabled={!isAvailable}
              className={[
                'relative p-4 rounded-xl border text-left transition-all duration-200',
                isAvailable ? 'cursor-pointer' : 'cursor-default opacity-50',
                isSelected
                  ? 'border-primary/50 bg-primary/8 shadow-[0_0_24px_rgba(129,140,248,0.18)]'
                  : isAvailable
                  ? 'border-border bg-card hover:border-primary/25 hover:bg-muted/20'
                  : 'border-border bg-card',
              ].join(' ')}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" />
              )}

              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>

              <p className="font-semibold text-foreground text-sm mb-1">{agent.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{agent.desc}</p>

              <Badge
                variant={isAvailable ? 'default' : 'secondary'}
                className={`text-xs ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {isAvailable ? 'Available' : 'Coming soon'}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
