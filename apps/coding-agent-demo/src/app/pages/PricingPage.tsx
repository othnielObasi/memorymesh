import { useState } from 'react';
import { ArrowRight, CheckCircle2, Minus, HelpCircle } from 'lucide-react';
import type { PageType } from '../LandingPage';

interface Props {
  onNavigate: (p: PageType) => void;
  onEnterWorkspace: () => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try it out',
    monthly: 0,
    annual: 0,
    desc: 'Demo memory in the workspace. No setup, no credit card, no commitment.',
    cta: 'Start for free',
    ctaStyle: 'border',
    highlight: false,
    badge: null,
    features: {
      memory: 'Demo (session-only)',
      agents: '1 built-in agent',
      sessions: 'Unlimited sessions',
      memory_ops: '500 ops / month',
      recovery: 'Within session',
      history: 'None',
      api: false,
      custom_agents: false,
      sso: false,
      sla: false,
      support: 'Community',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For serious work',
    monthly: 19,
    annual: 15,
    desc: 'Persistent cloud memory, all built-in agents, unlimited sessions, and API access.',
    cta: 'Start Pro',
    ctaStyle: 'primary',
    highlight: true,
    badge: 'Most popular',
    features: {
      memory: 'Cloud (Cognee managed)',
      agents: 'All built-in agents',
      sessions: 'Unlimited sessions',
      memory_ops: '50,000 ops / month',
      recovery: 'Instant, cross-session',
      history: '90-day retention',
      api: true,
      custom_agents: true,
      sso: false,
      sla: false,
      support: 'Email, 48h response',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For teams and scale',
    monthly: null,
    annual: null,
    desc: 'Self-hosted Cognee, SSO, custom retention, SLA, and dedicated support.',
    cta: 'Talk to us',
    ctaStyle: 'border',
    highlight: false,
    badge: 'Self-hosted available',
    features: {
      memory: 'Self-hosted or cloud',
      agents: 'All agents + custom',
      sessions: 'Unlimited sessions',
      memory_ops: 'Unlimited',
      recovery: 'Instant, cross-session',
      history: 'Custom retention',
      api: true,
      custom_agents: true,
      sso: true,
      sla: '99.9% uptime SLA',
      support: 'Dedicated, 4h response',
    },
  },
];

const COMPARISON_ROWS = [
  { label: 'Memory location',    key: 'memory',       type: 'text' },
  { label: 'Built-in agents',    key: 'agents',       type: 'text' },
  { label: 'Sessions',           key: 'sessions',     type: 'text' },
  { label: 'Memory operations',  key: 'memory_ops',   type: 'text' },
  { label: 'Context recovery',   key: 'recovery',     type: 'text' },
  { label: 'Memory history',     key: 'history',      type: 'text' },
  { label: 'API access',         key: 'api',          type: 'bool' },
  { label: 'Connect your agents',key: 'custom_agents',type: 'bool' },
  { label: 'SSO / SAML',         key: 'sso',          type: 'bool' },
  { label: 'Uptime SLA',         key: 'sla',          type: 'sla'  },
  { label: 'Support',            key: 'support',      type: 'text' },
] as const;

const FAQ = [
  {
    q: "What happens to my memory when a demo session ends?",
    a: "Demo memory is temporary — it's cleared when you close the browser tab. It's designed for exploring the workspace, not for real work. Upgrade to Pro for persistent cloud memory.",
  },
  {
    q: "Can I self-host on the free plan?",
    a: "Self-hosted Cognee is an Enterprise feature. It requires infrastructure setup and dedicated support. Free and Pro plans use our managed cloud or demo memory.",
  },
  {
    q: "What counts as a memory operation?",
    a: "Each remember, recall, improve, or forget action counts as one operation. A typical session involves 10–50 operations depending on session length and task complexity.",
  },
  {
    q: "Can I connect my own agents (Cursor, Claude Code, etc.) on the free plan?",
    a: "Connecting external agents requires API access, which is a Pro feature. The free plan is workspace-only — you run the built-in Build Assistant via the UI.",
  },
  {
    q: "Is memory encrypted?",
    a: "Yes. Cloud memory is encrypted at rest (AES-256) and in transit (TLS 1.3). Self-hosted Cognee encryption is managed by your infrastructure.",
  },
  {
    q: "Can I export or delete my memory?",
    a: "Yes — you have full control. Export your memory graph at any time, or delete individual memories or your entire history from the workspace settings.",
  },
];

export function PricingPage({ onNavigate, onEnterWorkspace }: Props) {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(129,140,248,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="font-display text-5xl md:text-6xl text-foreground leading-tight mb-5">
            Simple, transparent<br />
            <span className="italic" style={{ color: '#818cf8' }}>pricing.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Start free with demo memory. Upgrade when you need persistence.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full border border-border bg-card">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Annual
              <span className={`text-xs px-1.5 py-0.5 rounded-full transition-all ${annual ? 'bg-white/20' : 'bg-green-400/15 text-green-400'}`}>
                −20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="px-6 pb-20 border-t border-border">
        <div className="max-w-6xl mx-auto pt-16">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`rounded-2xl border p-8 flex flex-col relative ${
                  plan.highlight ? 'border-primary/35 bg-primary/5' : 'border-border bg-card'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      plan.highlight
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground border border-border'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-semibold text-foreground text-lg mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-5">{plan.tagline}</p>
                  <div className="flex items-end gap-1.5 mb-3">
                    {plan.monthly === null ? (
                      <span className="font-display text-4xl text-foreground">Custom</span>
                    ) : plan.monthly === 0 ? (
                      <span className="font-display text-4xl text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="font-display text-4xl text-foreground">
                          ${annual ? plan.annual : plan.monthly}
                        </span>
                        <span className="text-muted-foreground text-sm mb-1">/mo</span>
                      </>
                    )}
                  </div>
                  {plan.monthly !== null && plan.monthly > 0 && annual && (
                    <p className="text-xs text-green-400">Billed annually — save ${(plan.monthly - (plan.annual ?? 0)) * 12}/yr</p>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3">{plan.desc}</p>
                </div>

                <div className="space-y-2.5 mb-8 flex-1">
                  {Object.entries(plan.features).map(([key, val]) => {
                    const row = COMPARISON_ROWS.find(r => r.key === key);
                    if (!row) return null;
                    return (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        {row.type === 'bool' ? (
                          val ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                          ) : (
                            <Minus className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                          )
                        ) : (
                          <span className="text-xs text-foreground/80 text-right max-w-[55%]">
                            {val === false ? <Minus className="w-4 h-4 text-muted-foreground/30" /> : String(val)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={plan.id === 'enterprise' ? undefined : onEnterWorkspace}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                    plan.ctaStyle === 'primary'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border text-foreground hover:bg-muted/40'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-foreground">Full comparison</h2>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-muted/30 border-b border-border">
              <div className="px-5 py-4 text-xs font-mono-ui text-muted-foreground uppercase tracking-widest">Feature</div>
              {PLANS.map(p => (
                <div key={p.id} className={`px-5 py-4 text-sm font-semibold text-center ${p.highlight ? 'text-primary' : 'text-foreground'}`}>
                  {p.name}
                </div>
              ))}
            </div>
            {/* Rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div key={row.key} className={`grid grid-cols-4 border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                <div className="px-5 py-3.5 text-xs text-muted-foreground flex items-center">{row.label}</div>
                {PLANS.map(plan => {
                  const val = plan.features[row.key as keyof typeof plan.features];
                  return (
                    <div key={plan.id} className="px-5 py-3.5 flex items-center justify-center">
                      {row.type === 'bool' ? (
                        val ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground/25" />
                        )
                      ) : (
                        <span className="text-xs text-foreground/75 text-center">
                          {val === false ? <Minus className="w-4 h-4 text-muted-foreground/25" /> : String(val)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-mono-ui text-primary uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="font-display text-3xl text-foreground">Common questions.</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-foreground pr-4">{item.q}</span>
                  <HelpCircle className={`w-4 h-4 shrink-0 transition-colors ${openFaq === i ? 'text-primary' : 'text-muted-foreground'}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl text-foreground mb-4">
            Start free.<br />
            <span className="italic" style={{ color: '#818cf8' }}>Upgrade when you need to.</span>
          </h2>
          <p className="text-muted-foreground mb-8">No credit card required for the free plan. Cancel Pro anytime.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={onEnterWorkspace}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm">
              Open workspace — free <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('docs')}
              className="text-sm text-muted-foreground border border-border px-6 py-3 rounded-lg hover:text-foreground hover:border-foreground/15 transition-all">
              Read the docs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
