import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Server, Cloud, FlaskConical, Check } from 'lucide-react';

export function MemoryLocationsSection() {
  const locations = [
    {
      id: 'local',
      name: 'Private local memory',
      icon: Server,
      status: 'setup required',
      features: [
        'Open-source Cognee',
        'Requires a reachable local Cognee service',
        'Complete data privacy',
        'No cloud account required',
        'Full control and customization',
      ],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'cloud',
      name: 'Managed cloud memory',
      icon: Cloud,
      status: 'account required',
      features: [
        'Cognee Cloud hosting',
        'Managed infrastructure',
        'Automatic scaling',
        'Team collaboration',
        'Enterprise support available',
      ],
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'demo',
      name: 'Demo memory',
      icon: FlaskConical,
      status: 'preview',
      features: [
        'Temporary storage',
        'No setup required',
        'Instant testing',
        'Clears after session',
        'Perfect for quick trials',
      ],
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Memory locations</h3>
        <p className="text-sm text-muted-foreground">Choose where agent memory lives</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map((location) => {
          const Icon = location.icon;

          return (
            <Card key={location.id} className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${location.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={location.status.includes('required') ? 'secondary' : 'default'}>
                    {location.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">{location.name}</h4>
                  <ul className="space-y-2">
                    {location.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-secondary border-border">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">MemoryMesh vs Cognee</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">MemoryMesh</strong> is the agent workspace and orchestration layer.{' '}
            <strong className="text-foreground">Cognee</strong> is the memory backend that stores and retrieves context.
            MemoryMesh can work with local Cognee (self-hosted), Cognee Cloud (managed), or demo mode (temporary).
            This separation lets you run agents your way while choosing the memory infrastructure that fits your needs.
          </p>
        </div>
      </Card>
    </div>
  );
}
