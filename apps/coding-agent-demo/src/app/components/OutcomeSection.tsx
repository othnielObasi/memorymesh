import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileCode, GitCompare, ListChecks, PlusCircle, Edit3 } from 'lucide-react';
import type { OutcomeData } from '../App';

interface Props { outcomeData: OutcomeData | null; }

// ── Minimal syntax highlighter ─────────────────────────────────────
const KW = new Set(['import','export','default','from','const','let','var','function','async','await','return','if','else','type','interface','extends','class','new','this','true','false','null','undefined','void']);
const PRIM = new Set(['string','number','boolean']);

function tokenize(code: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\/\/[^\n]*)|(["'`](?:[^"'`\\]|\\.)*["'`])|(\b[\w]+\b)|([{}[\]()<>.,;:=+\-*|&!])|(\s+)/g;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(code)) !== null) {
    const [full, comment, str, word, op, ws] = match;
    if (comment) { parts.push(<span key={key++} style={{ color: '#4a5568' }}>{full}</span>); }
    else if (str) { parts.push(<span key={key++} style={{ color: '#34d399' }}>{full}</span>); }
    else if (word) {
      if (KW.has(word))   parts.push(<span key={key++} style={{ color: '#818cf8' }}>{full}</span>);
      else if (PRIM.has(word)) parts.push(<span key={key++} style={{ color: '#22d3ee' }}>{full}</span>);
      else if (/^[A-Z]/.test(word)) parts.push(<span key={key++} style={{ color: '#f59e0b' }}>{full}</span>);
      else parts.push(<span key={key++} style={{ color: '#94a3c0' }}>{full}</span>);
    }
    else if (op) { parts.push(<span key={key++} style={{ color: '#5a6a8a' }}>{full}</span>); }
    else { parts.push(full); }
  }
  return parts;
}

function CodeBlock({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <div className="rounded-lg bg-muted/20 border border-border overflow-hidden">
      <div className="flex min-w-0 max-w-full">
        {/* Line numbers */}
        <div className="select-none px-3 py-4 text-right border-r border-border bg-muted/20 shrink-0">
          {lines.map((_, i) => (
            <div key={i} className="text-xs font-mono-ui text-muted-foreground/30 leading-5">{i + 1}</div>
          ))}
        </div>
        {/* Code */}
        <pre className="min-w-0 flex-1 overflow-x-hidden whitespace-pre-wrap break-words p-4 text-xs font-mono-ui leading-5">
          <code>{lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{tokenize(line)}</div>
          ))}</code>
        </pre>
      </div>
    </div>
  );
}

const CHANGE_ICONS: Record<string, React.ReactNode> = {
  created:  <PlusCircle className="w-3.5 h-3.5 text-green-400" />,
  modified: <Edit3      className="w-3.5 h-3.5 text-primary" />,
};

export function OutcomeSection({ outcomeData }: Props) {
  if (!outcomeData) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Outcome evidence</h3>

      <Card className="p-5 bg-card border-border overflow-hidden">
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground text-sm mb-1">Work completed</h4>
              <p className="text-sm text-muted-foreground leading-relaxed break-words [overflow-wrap:anywhere]">{outcomeData.summary}</p>
            </div>
          </div>

          <Tabs defaultValue="changes" className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-3">
              <TabsTrigger value="changes" className="flex items-center gap-1 text-xs">
                <ListChecks className="w-3.5 h-3.5" />Changes
              </TabsTrigger>
              <TabsTrigger value="before" className="flex items-center gap-1 text-xs">
                <GitCompare className="w-3.5 h-3.5" />Before
              </TabsTrigger>
              <TabsTrigger value="after" className="flex items-center gap-1 text-xs">
                <GitCompare className="w-3.5 h-3.5" />After
              </TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="mt-4 space-y-2">
              {outcomeData.changes.map((c, i) => (
                <div key={i} className="flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mt-0.5 shrink-0">{CHANGE_ICONS[c.type] ?? CHANGE_ICONS.modified}</div>
                  <div className="flex-1 min-w-0">
                    <code className="block max-w-full truncate text-xs font-mono-ui text-foreground/80" title={c.file}>{c.file}</code>
                    <p className="mt-0.5 text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">{c.description}</p>
                  </div>
                  <span className={`text-xs font-mono-ui shrink-0 ${c.type === 'created' ? 'text-green-400' : 'text-primary'}`}>
                    {c.type}
                  </span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="before" className="mt-4">
              <CodeBlock code={outcomeData.before} />
            </TabsContent>

            <TabsContent value="after" className="mt-4">
              <CodeBlock code={outcomeData.after} />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
