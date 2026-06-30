import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface RecoveryData {
  contextLost: boolean;
  recoveredItems: string[];
  recoveryTime: string;
  summary: string;
}

interface RecoverySectionProps {
  recoveryData: RecoveryData | null;
}

export function RecoverySection({ recoveryData }: RecoverySectionProps) {
  if (!recoveryData) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Recovery</h3>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-foreground">Recovery summary</h4>
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                {recoveryData.recoveryTime}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {recoveryData.summary}
            </p>

            {recoveryData.recoveredItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Recovered items:</p>
                <ul className="space-y-1.5">
                  {recoveryData.recoveredItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
