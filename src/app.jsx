// FLINT Command Center — app.jsx
// Wired to live Notion data via useNotion().
// Intake tab calls Claude API to extract tasks. No Notion writes anywhere.

const { useState, useMemo, useRef, useEffect, useCallback } = React;

const T = {
  paper: 'var(--paper)',
  ink: 'var(--ink)',
  ink2: 'var(--ink-2)',
  ink3: 'var(--ink-3)',
  rule: 'var(--rule)',
  ruleStrong: 'var(--rule-strong)',
  accent: 'var(--accent)',
  accentInk: 'var(--accent-ink)',
  mono: 'var(--mono)',
  sans: 'var(--sans)',
  serif: 'var(--serif)',
};

// ─── Primitives ──────────────────────────────────────────────────────────────

function Mono({ children, size = 11, color = T.ink3, style }) {
  return (
    <span style={{
      fontFamily: T.mono, fontSize: size, letterSpacing: 0.3,
      textTransform: 'uppercase', color, ...style,
    }}>{children}</span>
  );
}

function Rule({ strong, style }) {
  return <div style={{ height: 1, background: strong ? T.ruleStrong : T.rule, ...style }} />;
}

function CatPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', cursor: 'pointer', flexShrink: 0,
      padding: '6px 10px', borderRadius: 999,
      fontFamily: T.mono, fontSize: 11, letterSpacing: 0.4,
      textTransform: 'uppercase',
      background: active ? T.ink : 'transparent',
      color: active ? T.paper : T.ink2,
      boxShadow: active ? 'none' : `inset 0 0 0 1px ${T.ruleStrong}`,
      transition: 'all 0.12s ease',
    }}>{label}</button>
  );
}

function PrioDot({ priority, size = 6 }) {
  const fill = { Critical: T.accent, High: T.ink, Medium: 'transparent' }[priority];
  const border = priority === 'Medium' ? T.ink2 : 'transparent';
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: fill,
      boxShadow: border !== 'transparent' ? `inset 0 0 0 1px ${border}` : 'none',
      flexShrink: 0,
    }} />
  );
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <Mono size={10} color={T.ink3}>Syncing with Notion…</Mono>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ padding: '40px 20px' }}>
      <div style={{
        padding: '14px 16px', border: `1px solid ${T.ruleStrong}`,
        borderLeft: `3px solid ${T.accent}`,
      }}>
        <Mono size={10} color={T.accent} style={{ fontWeight: 600 }}>Sync error</Mono>
        <div style={{
          fontFamily: T.mono, fontSize: 11, color: T.ink2,
          marginTop: 6, lineHeight: 1.5, textTransform: 'none', letterSpacing: 0,
        }}>{message}</div>
        <button onClick={onRetry} style={{
          marginTop: 12, border: `1px solid ${T.ink}`, background: 'transparent',
          color: T.ink, padding: '7px 12px',
          fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Retry</button>
      </div>
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

function TopStrip({ syncedAt, onRefresh }) {
  const now = new Date();
  const date = now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const clock = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  const syncLabel = syncedAt
    ? new Date(syncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })
    : null;

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{
        padding: '10px 20px 10px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.rule}`,
        background: T.paper,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 2, color: T.ink, fontWeight: 600 }}>FLINT</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1, color: T.ink3 }}>COMMAND CENTER</span>
        </div>
        <button onClick={onRefresh} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: 0,
        }}>
          {syncLabel && <Mono size={10}>↻ {syncLabel}</Mono>}
          {!syncLabel && <Mono size={10}>{date} · {clock}</Mono>}
        </button>
      </div>
    </div>
  );
}

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'me', label: 'My Tasks' },
    { id: 'team', label: 'Team' },
    { id: 'intake', label: 'Intake' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: T.paper, borderTop: `1px solid ${T.ruleStrong}`,
      paddingBottom: 34, zIndex: 40,
    }}>
      <div style={{ display: 'flex' }}>
        {tabs.map((t, i) => {
          const isActive = t.id === active;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
              padding: '14px 0 12px', position: 'relative',
              borderLeft: i > 0 ? `1px solid ${T.rule}` : 'none',
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 11, letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: isActive ? T.ink : T.ink3,
                fontWeight: isActive ? 600 : 500,
              }}>{t.label}</div>
              {isActive && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 32, height: 2, background: T.accent,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── My Tasks tab ─────────────────────────────────────────────────────────────

function MyTasksTab({ myTasks, waitingOn, loading, error, onRefresh, onOpenTask }) {
  const [cat, setCat] = useState('All');
  const [collapsed, setCollapsed] = useState({});

  const tasks = useMemo(
    () => cat === 'All' ? myTasks : myTasks.filter(t => t.category === cat),
    [cat, myTasks]
  );

  const groups = ['Critical', 'High', 'Medium'].map(p => ({
    p, items: tasks.filter(t => t.priority === p),
  }));

  const criticalCount = myTasks.filter(t => t.priority === 'Critical').length;
  const highCount     = myTasks.filter(t => t.priority === 'High').length;

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={onRefresh} />;

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: '18px 20px 14px' }}>
        <Mono size={10}>
          {new Date().toLocaleString('en-US', { weekday: 'long' })} morning
        </Mono>
        <div style={{
          fontFamily: T.serif, fontSize: 30, lineHeight: '34px', color: T.ink,
          marginTop: 6, letterSpacing: -0.5, fontWeight: 500,
        }}>
          {criticalCount > 0
            ? <>{criticalCount} critical, {highCount} high today.</>
            : <>{highCount} high-priority tasks today.</>
          }
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        padding: '0 20px 14px', scrollbarWidth: 'none',
      }}>
        <CatPill label="All" active={cat === 'All'} onClick={() => setCat('All')} />
        {CATEGORIES.map(c =>
          <CatPill key={c} label={c} active={cat === c} onClick={() => setCat(c)} />
        )}
      </div>

      <Rule strong />

      {groups.map(({ p, items }) => {
        if (items.length === 0) return null;
        const isCollapsed = collapsed[p];
        return (
          <div key={p}>
            <button
              onClick={() => setCollapsed(c => ({ ...c, [p]: !isCollapsed }))}
              style={{
                width: '100%', border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                padding: '16px 20px 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PrioDot priority={p} size={7} />
                <Mono size={11} color={T.ink} style={{ fontWeight: 600, letterSpacing: 1.5 }}>{p}</Mono>
                <Mono size={11} color={T.ink3}>· {items.length}</Mono>
              </div>
              <Mono size={11}>{isCollapsed ? '+' : '−'}</Mono>
            </button>

            {!isCollapsed && items.map((t, i) => (
              <TaskRow
                key={t.id}
                task={t}
                hero={p === 'Critical' && i === 0}
                onClick={() => onOpenTask(t)}
              />
            ))}
            <Rule />
          </div>
        );
      })}

      {myTasks.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Mono size={10} color={T.ink3}>No active tasks found in Notion.</Mono>
        </div>
      )}

      <WaitingOnSection waitingOn={waitingOn} />
    </div>
  );
}

function TaskRow({ task, hero = false, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', border: 'none', background: 'transparent',
      cursor: 'pointer', textAlign: 'left', display: 'block',
      padding: hero ? '10px 20px 16px' : '12px 20px',
      borderBottom: `1px solid ${T.rule}`,
    }}>
      {hero && (
        <div style={{ marginBottom: 6 }}>
          <Mono size={10} color={T.accent} style={{ fontWeight: 600, letterSpacing: 1.5 }}>
            ✦ Top priority · {task.age}
          </Mono>
        </div>
      )}
      <div style={{
        fontFamily: T.sans, fontSize: hero ? 19 : 15,
        lineHeight: hero ? '25px' : '20px', color: T.ink,
        fontWeight: hero ? 500 : 450, letterSpacing: hero ? -0.2 : 0,
      }}>{task.title}</div>
      {hero && task.notes && (
        <div style={{
          fontFamily: T.sans, fontSize: 13, color: T.ink2,
          marginTop: 6, lineHeight: 1.45,
        }}>{task.notes}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: hero ? 10 : 6 }}>
        {task.category && <Mono size={10}>{task.category}</Mono>}
        {task.category && task.due && <span style={{ width: 2, height: 2, background: T.ink3, borderRadius: 1 }} />}
        {task.due && <Mono size={10}>Due {task.due}</Mono>}
        {task.status === 'Blocked' && (
          <>
            <span style={{ width: 2, height: 2, background: T.accent, borderRadius: 1 }} />
            <Mono size={10} color={T.accent} style={{ fontWeight: 600 }}>Blocked</Mono>
          </>
        )}
      </div>
    </button>
  );
}

function WaitingOnSection({ waitingOn }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginTop: 24 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', border: 'none', background: 'transparent',
        cursor: 'pointer', textAlign: 'left',
        padding: '14px 20px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            border: `1.5px solid ${T.ink2}`, background: 'transparent',
          }} />
          <Mono size={11} color={T.ink} style={{ fontWeight: 600, letterSpacing: 1.5 }}>Waiting on</Mono>
          <Mono size={11} color={T.ink3}>· {waitingOn.length}</Mono>
        </div>
        <Mono size={11}>{open ? '−' : '+'}</Mono>
      </button>

      {open && waitingOn.length === 0 && (
        <div style={{ padding: '8px 20px 16px' }}>
          <Mono size={10} color={T.ink3}>
            No waiting items. Create a Waiting On DB in Notion to track these here.
          </Mono>
        </div>
      )}

      {open && waitingOn.map(w => (
        <div key={w.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2, lineHeight: '19px' }}>
            {w.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Mono size={10}>{w.who}</Mono>
            {w.since && <>
              <span style={{ width: 2, height: 2, background: T.ink3, borderRadius: 1 }} />
              <Mono size={10}>{w.since} ago</Mono>
            </>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Team tab ─────────────────────────────────────────────────────────────────

function TeamTab({ team, loading, error, onRefresh }) {
  const [expanded, setExpanded] = useState(null);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={onRefresh} />;

  const blockedCount   = team.filter(p => p.status === 'blocked').length;
  const overloadedCount = team.filter(p => p.status === 'overloaded').length;

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: '18px 20px 16px' }}>
        <Mono size={10}>Team pulse</Mono>
        <div style={{
          fontFamily: T.serif, fontSize: 26, lineHeight: '30px',
          color: T.ink, marginTop: 6, letterSpacing: -0.3, fontWeight: 500,
        }}>
          {team.length} reports ·{' '}
          {blockedCount > 0
            ? <span style={{ color: T.accent }}>{blockedCount} blocked</span>
            : <span style={{ color: T.ink3 }}>none blocked</span>
          }
          {overloadedCount > 0 && <>, {overloadedCount} overloaded</>}
        </div>
      </div>
      <Rule strong />
      {team.map(p => (
        <PersonPanel
          key={p.id}
          person={p}
          expanded={expanded === p.id}
          onToggle={() => setExpanded(e => e === p.id ? null : p.id)}
        />
      ))}
    </div>
  );
}

function StatusToken({ status }) {
  const map = {
    blocked:    { label: 'Blocked',    fg: T.accent, dot: T.accent },
    overloaded: { label: 'Overloaded', fg: T.ink,    dot: T.ink },
    'on-track': { label: 'On track',   fg: T.ink3,   dot: T.ink3 },
  };
  const s = map[status] ?? map['on-track'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      <Mono size={10} color={s.fg} style={{ fontWeight: 600 }}>{s.label}</Mono>
    </div>
  );
}

function PersonPanel({ person, expanded, onToggle }) {
  if (!person.hero) {
    return (
      <div style={{ borderBottom: `1px solid ${T.ruleStrong}`, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: T.sans, fontSize: 17, color: T.ink, fontWeight: 500 }}>
            {person.name}
          </div>
          <Mono size={10} color={T.ink3}>{person._unlinked ? 'Not linked' : 'No tasks'}</Mono>
        </div>
        <Mono size={10} style={{ marginTop: 4 }}>{person.role}</Mono>
      </div>
    );
  }

  return (
    <div style={{ borderBottom: `1px solid ${T.ruleStrong}` }}>
      <button onClick={onToggle} style={{
        width: '100%', border: 'none', background: 'transparent',
        cursor: 'pointer', textAlign: 'left', padding: '16px 20px 14px', display: 'block',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: T.sans, fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>
              {person.name}
            </div>
            <Mono size={10}>{person.role}</Mono>
          </div>
          <StatusToken status={person.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 2 }}>
          <div style={{ paddingTop: 6 }}>
            <PrioDot priority={person.hero.priority} size={7} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 14, color: T.ink, lineHeight: '19px' }}>
              {person.hero.title}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Mono size={10}>{person.hero.priority}</Mono>
              {person.hero.since && <>
                <span style={{ width: 2, height: 2, background: T.ink3, borderRadius: 1, marginTop: 6 }} />
                <Mono size={10}>{person.hero.since}</Mono>
              </>}
            </div>
          </div>
          <Mono size={10} color={T.ink3}>{expanded ? '−' : `${person.queue.length} more`}</Mono>
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: '0 20px 16px',
          background: 'color-mix(in oklab, var(--ink) 3%, var(--paper))',
        }}>
          {person.blockers?.length > 0 && (
            <div style={{
              padding: '10px 12px', marginBottom: 10,
              borderLeft: `2px solid ${T.accent}`, background: T.paper,
            }}>
              <Mono size={10} color={T.accent} style={{ fontWeight: 600 }}>Blocker</Mono>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, marginTop: 2 }}>
                {person.blockers[0]}
              </div>
            </div>
          )}
          <Mono size={10} style={{ display: 'block', padding: '6px 0 4px' }}>
            Queue ({person.queue.length})
          </Mono>
          {person.queue.map((q, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${T.rule}`,
            }}>
              <PrioDot priority={q.priority} size={6} />
              <div style={{ flex: 1, fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: '17px' }}>
                {q.title}
              </div>
              {q.tag && <Mono size={9}>{q.tag}</Mono>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Intake tab ───────────────────────────────────────────────────────────────

const INTAKE_SYSTEM_PROMPT = `You are a task extraction assistant for a Forward Deployed Engineer at a construction technology company.

The user will paste raw content — an email, Slack message, meeting note, or spec. Extract only clear, actionable tasks.

Respond ONLY with a JSON array. No preamble, no markdown fences. Each item:
{
  "id": "s1",
  "title": "Short, actionable task title (imperative verb)",
  "priority": "Critical" | "High" | "Medium",
  "category": one of ["Foundational Object", "Integration / Pipeline", "Workshop / UI", "Admin / Coordination", "POC / Exploration"],
  "due": "today" | "tomorrow" | day name | "next week" | null,
  "assignee": "me" | person name if clearly delegatable,
  "source": "Brief quote or reference from the content that triggered this task"
}

Rules:
- Only extract real action items, not observations or context
- Default priority to Medium unless urgency is explicit
- Default assignee to "me"
- 1–6 tasks maximum. Zero is valid if there are no clear action items.
- If nothing is actionable, return []`;

function IntakeTab() {
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [decisions, setDecisions] = useState({});
  const [copied, setCopied]     = useState(false);
  const [aiError, setAiError]   = useState(null);

  const reset = () => {
    setText(''); setAnalyzed(false); setSuggestions([]);
    setDecisions({}); setCopied(false); setAiError(null);
  };

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setAiError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: INTAKE_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: text }],
        }),
      });

      const data = await response.json();
      const raw  = data.content?.find(b => b.type === 'text')?.text ?? '[]';

      let parsed;
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      } catch {
        parsed = [];
      }

      setSuggestions(Array.isArray(parsed) ? parsed : []);
      setAnalyzed(true);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approvedItems = suggestions.filter(s => decisions[s.id] === 'approve');

  const copyToClipboard = () => {
    if (approvedItems.length === 0) return;
    const lines = approvedItems.map(s =>
      `- ${s.title} [${s.priority}${s.due ? ` · Due ${s.due}` : ''}${s.category ? ` · ${s.category}` : ''}]`
    ).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: '18px 20px 14px' }}>
        <Mono size={10}>Paste · extract · approve</Mono>
        <div style={{
          fontFamily: T.serif, fontSize: 26, lineHeight: '30px',
          color: T.ink, marginTop: 6, letterSpacing: -0.3, fontWeight: 500,
        }}>
          Drop raw content. Copy approved tasks into Notion.
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setAnalyzed(false); setSuggestions([]); }}
          placeholder="Paste an email, meeting note, Slack thread…"
          style={{
            width: '100%', minHeight: analyzed ? 90 : 160,
            border: `1px solid ${T.ruleStrong}`,
            background: T.paper, color: T.ink,
            padding: 12, boxSizing: 'border-box',
            fontFamily: T.mono, fontSize: 12, lineHeight: 1.5,
            resize: 'vertical', outline: 'none',
            transition: 'min-height 0.2s ease',
          }}
        />

        {aiError && (
          <div style={{
            marginTop: 8, padding: '8px 12px',
            border: `1px solid ${T.ruleStrong}`, borderLeft: `2px solid ${T.accent}`,
            fontFamily: T.mono, fontSize: 11, color: T.accent, lineHeight: 1.5,
          }}>{aiError}</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          {text && !analyzed && (
            <button onClick={analyze} disabled={loading} style={{
              border: `1px solid ${T.ink}`, background: T.ink, color: T.paper,
              padding: '9px 14px', flex: 1,
              fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
              textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>{loading ? 'Reading…' : 'Extract tasks →'}</button>
          )}
          {text && (
            <button onClick={reset} style={{
              border: 'none', background: 'transparent', color: T.ink3,
              padding: '9px 10px',
              fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5,
              textTransform: 'uppercase', cursor: 'pointer',
            }}>Clear</button>
          )}
        </div>
      </div>

      {analyzed && suggestions.length === 0 && (
        <div style={{ padding: '24px 20px' }}>
          <Mono size={10} color={T.ink3}>No actionable tasks found in this content.</Mono>
        </div>
      )}

      {analyzed && suggestions.length > 0 && (
        <>
          <div style={{
            marginTop: 18, padding: '10px 20px',
            borderTop: `1px solid ${T.ruleStrong}`,
            borderBottom: `1px solid ${T.rule}`,
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          }}>
            <Mono size={11} color={T.ink} style={{ fontWeight: 600 }}>
              {suggestions.length} suggestions
            </Mono>
            <Mono size={10}>
              {approvedItems.length} approved
            </Mono>
          </div>

          {suggestions.map(s => (
            <SuggestionRow
              key={s.id}
              suggestion={s}
              decision={decisions[s.id]}
              onDecide={d => setDecisions(prev => ({ ...prev, [s.id]: d }))}
            />
          ))}

          <div style={{ padding: '16px 20px 20px' }}>
            <button
              onClick={copyToClipboard}
              disabled={approvedItems.length === 0}
              style={{
                width: '100%',
                border: `1px solid ${approvedItems.length === 0 ? T.rule : T.ink}`,
                background: approvedItems.length === 0 ? 'transparent' : T.ink,
                color: approvedItems.length === 0 ? T.ink3 : T.paper,
                padding: '14px',
                fontFamily: T.mono, fontSize: 11, letterSpacing: 1.5,
                textTransform: 'uppercase',
                cursor: approvedItems.length === 0 ? 'default' : 'pointer',
                transition: 'all 0.12s ease',
              }}>
              {copied
                ? '✓ Copied to clipboard'
                : approvedItems.length === 0
                  ? 'Approve items to copy'
                  : `Copy ${approvedItems.length} task${approvedItems.length === 1 ? '' : 's'} →`
              }
            </button>
            {approvedItems.length > 0 && !copied && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Mono size={10} color={T.ink3}>Paste into your Notion Tasks DB</Mono>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SuggestionRow({ suggestion, decision, onDecide }) {
  const approved = decision === 'approve';
  const rejected = decision === 'reject';
  return (
    <div style={{
      padding: '14px 20px', borderBottom: `1px solid ${T.rule}`,
      background: rejected ? 'color-mix(in oklab, var(--ink) 4%, var(--paper))' : 'transparent',
      opacity: rejected ? 0.5 : 1,
      transition: 'all 0.15s ease',
    }}>
      <div style={{
        fontFamily: T.sans, fontSize: 15, color: T.ink,
        lineHeight: '20px', fontWeight: 450,
        textDecoration: rejected ? 'line-through' : 'none',
      }}>{suggestion.title}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <MetaChip>{suggestion.priority}</MetaChip>
        {suggestion.category && <MetaChip>{suggestion.category}</MetaChip>}
        {suggestion.due && <MetaChip>Due {suggestion.due}</MetaChip>}
        <MetaChip>{suggestion.assignee === 'me' ? '→ Me' : '→ ' + suggestion.assignee}</MetaChip>
      </div>

      <div style={{
        fontFamily: T.mono, fontSize: 11, color: T.ink3,
        marginTop: 8, paddingLeft: 10,
        borderLeft: `2px solid ${T.rule}`,
        lineHeight: 1.5,
      }}>{suggestion.source}</div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={() => onDecide(approved ? null : 'approve')} style={{
          flex: 1, border: `1px solid ${approved ? T.ink : T.ruleStrong}`,
          background: approved ? T.ink : 'transparent',
          color: approved ? T.paper : T.ink,
          padding: '8px', fontFamily: T.mono, fontSize: 10,
          letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer',
        }}>
          {approved ? '✓ Approved' : 'Approve'}
        </button>
        <button onClick={() => onDecide(rejected ? null : 'reject')} style={{
          flex: 1, border: `1px solid ${rejected ? T.ink2 : T.ruleStrong}`,
          background: 'transparent', color: rejected ? T.ink : T.ink2,
          padding: '8px', fontFamily: T.mono, fontSize: 10,
          letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer',
        }}>
          {rejected ? '✗ Rejected' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

function MetaChip({ children }) {
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 10, letterSpacing: 0.4,
      textTransform: 'uppercase', padding: '3px 7px',
      background: 'color-mix(in oklab, var(--ink) 5%, var(--paper))',
      color: T.ink2, borderRadius: 3,
    }}>{children}</span>
  );
}

// ─── Task detail sheet ────────────────────────────────────────────────────────

function TaskSheet({ task, onClose }) {
  if (!task) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fade 0.2s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.paper, width: '100%',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '10px 0 40px',
        maxHeight: '80%', overflow: 'auto',
        animation: 'slide 0.22s ease',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.rule, margin: '0 auto 16px' }} />
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <PrioDot priority={task.priority} size={7} />
            <Mono size={10} color={T.ink}>{task.priority}</Mono>
            {task.category && <>
              <span style={{ width: 2, height: 2, background: T.ink3 }} />
              <Mono size={10}>{task.category}</Mono>
            </>}
            {task.due && <>
              <span style={{ width: 2, height: 2, background: T.ink3 }} />
              <Mono size={10}>Due {task.due}</Mono>
            </>}
          </div>
          <div style={{
            fontFamily: T.serif, fontSize: 22, color: T.ink,
            lineHeight: '28px', letterSpacing: -0.3, fontWeight: 500,
          }}>{task.title}</div>
          {task.notes && (
            <div style={{
              fontFamily: T.sans, fontSize: 14, color: T.ink2,
              marginTop: 14, lineHeight: 1.55,
            }}>{task.notes}</div>
          )}
          {task.status === 'Blocked' && task.blockedBy && (
            <div style={{
              marginTop: 14, padding: '10px 12px',
              borderLeft: `2px solid ${T.accent}`, background: 'color-mix(in oklab, var(--ink) 3%, var(--paper))',
            }}>
              <Mono size={10} color={T.accent} style={{ fontWeight: 600 }}>Blocked by</Mono>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, marginTop: 2 }}>
                {task.blockedBy}
              </div>
            </div>
          )}
          <div style={{
            marginTop: 20, padding: '12px 0',
            borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}`,
            display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: 8,
          }}>
            <Mono size={10}>Source</Mono>
            <Mono size={10} color={T.ink}>Notion · Tasks DB</Mono>
            <Mono size={10}>Status</Mono>
            <Mono size={10} color={T.ink}>{task.status}</Mono>
            {task.age && <>
              <Mono size={10}>Age</Mono>
              <Mono size={10} color={T.ink}>{task.age}</Mono>
            </>}
          </div>
          <Mono size={10} style={{ display: 'block', marginTop: 16, color: T.ink3, textAlign: 'center' }}>
            Read-only mirror · edit in Notion
          </Mono>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function FlintApp({ teamSize }) {
  const [tab, setTab]         = useState(() => {
    try { return localStorage.getItem('flint_tab') || 'me'; } catch { return 'me'; }
  });
  const [openTask, setOpenTask] = useState(null);

  const { myTasks, team, waitingOn, loading, error, refresh, syncedAt } = useNotion();

  useEffect(() => {
    try { localStorage.setItem('flint_tab', tab); } catch {}
  }, [tab]);

  const visibleTeam = team.slice(0, teamSize);

  return (
    <div style={{
      width: '100%', height: '100%', background: T.paper,
      color: T.ink, position: 'relative',
      display: 'flex', flexDirection: 'column', fontFamily: T.sans,
    }}>
      <TopStrip syncedAt={syncedAt} onRefresh={refresh} />
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 66 }}>
        {tab === 'me' && (
          <MyTasksTab
            myTasks={myTasks}
            waitingOn={waitingOn}
            loading={loading}
            error={error}
            onRefresh={refresh}
            onOpenTask={setOpenTask}
          />
        )}
        {tab === 'team' && (
          <TeamTab
            team={visibleTeam}
            loading={loading}
            error={error}
            onRefresh={refresh}
          />
        )}
        {tab === 'intake' && <IntakeTab />}
      </div>
      <TabBar active={tab} onChange={setTab} />
      <TaskSheet task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  );
}

window.FlintApp = FlintApp;
