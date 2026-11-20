<script lang="ts">
  import { team, ME, type Email } from './mail.svelte'
  import {
    DEADLINE_DAYS,
    RED_AFTER_DAY,
    clock,
    dayOf,
    daysLeft,
    formatDate,
    formatPayout,
    isEscalated,
    openCases,
    remindersFor,
    sendNudge,
  } from './cases.svelte'
  import CountdownChip from './CountdownChip.svelte'
  import Payout from './Payout.svelte'

  let { query = '' }: { query?: string } = $props()

  let justNudged = $state<number | null>(null)

  const matches = (m: Email) => {
    const q = query.trim().toLowerCase()
    return !q || [m.from, m.subject, m.assignee ?? 'unassigned'].some((s) => s.toLowerCase().includes(q))
  }

  // Most overdue first, then biggest payout.
  const escalated = $derived(
    openCases()
      .filter((m) => isEscalated(m, clock.now) && matches(m))
      .sort((a, b) => daysLeft(a) - daysLeft(b) || (b.payout ?? 0) - (a.payout ?? 0)),
  )
  const approaching = $derived(
    openCases()
      .filter((m) => {
        const d = dayOf(m, clock.now)
        return d > RED_AFTER_DAY && d < DEADLINE_DAYS && matches(m)
      })
      .sort((a, b) => daysLeft(a) - daysLeft(b)),
  )
  const atRisk = $derived(escalated.reduce((s, m) => s + (m.payout ?? 0), 0))
  const mostOverdue = $derived(escalated.length ? Math.max(0, -daysLeft(escalated[0])) : 0)

  function nudge(m: Email) {
    sendNudge(m)
    justNudged = m.id
    setTimeout(() => justNudged === m.id && (justNudged = null), 1800)
  }

  function reassign(m: Email, value: string) {
    m.assignee = value || null
  }
</script>

<div class="page">
  <h1>Manager view</h1>

  <div class="stats">
    <div class="stat red">
      <span class="num">{escalated.length}</span>
      <span class="label">{escalated.length === 1 ? 'case' : 'cases'} at or past day 30</span>
    </div>
    <div class="stat">
      <span class="num">{formatPayout(atRisk)}</span>
      <span class="label">payout at risk</span>
    </div>
    <div class="stat">
      <span class="num">{mostOverdue}</span>
      <span class="label">days, most overdue</span>
    </div>
    <div class="stat amber">
      <span class="num">{approaching.length}</span>
      <span class="label">due in the next 4 days</span>
    </div>
  </div>

  <div class="scroll">
    <h2>Overdue and escalated</h2>
    <div class="table">
      <div class="row head">
        <span>Deadline</span>
        <span>Payout</span>
        <span>Case</span>
        <span>Owner</span>
        <span>Reminders sent</span>
        <span></span>
      </div>
      {#each escalated as m (m.id)}
        <div class="row">
          <span><CountdownChip email={m} /></span>
          <span><Payout amount={m.payout!} /></span>
          <span class="case">
            <span class="subject">{m.subject}</span>
            <span class="client">{m.from} · due {formatDate(new Date(new Date(m.opened + 'T00:00').getTime() + (DEADLINE_DAYS - 1) * 86_400_000))}</span>
          </span>
          <span>
            <select value={m.assignee ?? ''} onchange={(e) => reassign(m, e.currentTarget.value)} aria-label="Owner">
              <option value="">Unassigned</option>
              {#each team as t}<option value={t}>{t === ME ? `${t} (me)` : t}</option>{/each}
            </select>
          </span>
          <span class="log">
            {#each remindersFor(m) as r (r.key)}
              <span class:esc={r.escalation}>{r.day == null ? 'Nudge' : `Day ${r.day}`} · {formatDate(r.date)}</span>
            {/each}
          </span>
          <span class="actions">
            <button class="act" onclick={() => nudge(m)}>{justNudged === m.id ? 'Sent' : 'Nudge owner'}</button>
            <button class="act" onclick={() => (m.resolved = true)}>Resolve</button>
          </span>
        </div>
      {:else}
        <div class="empty">No overdue cases. Nice work.</div>
      {/each}
    </div>

    <h2>Approaching the deadline</h2>
    <div class="table">
      {#each approaching as m (m.id)}
        <div class="row compact">
          <span><CountdownChip email={m} /></span>
          <span><Payout amount={m.payout!} /></span>
          <span class="case">
            <span class="subject">{m.subject}</span>
            <span class="client">{m.from}</span>
          </span>
          <span class="owner">{m.assignee ?? 'Unassigned'}</span>
          <span></span>
          <span class="actions">
            <button class="act" onclick={() => nudge(m)}>{justNudged === m.id ? 'Sent' : 'Nudge owner'}</button>
          </span>
        </div>
      {:else}
        <div class="empty">Nothing due in the next few days.</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    min-height: 0;
  }
  h1 {
    margin: 0 0 clamp(10px, 2vh, 20px);
    font-family: var(--heading);
    font-size: 32px; /* 24pt */
    font-weight: 500;
    text-align: center;
  }
  h2 {
    margin: 20px 0 8px;
    font-family: var(--heading);
    font-size: 18px;
    font-weight: 500;
  }
  h2:first-child {
    margin-top: 0;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-left: 4px solid #c9ccd1;
    background: var(--bg);
  }
  .stat.red {
    border-left-color: var(--orphaned);
  }
  .stat.amber {
    border-left-color: var(--new);
  }
  .num {
    font-family: var(--heading);
    font-size: 26px;
    font-weight: 500;
  }
  .label {
    font-size: 13px;
    color: var(--muted);
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .table {
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .row {
    display: grid;
    grid-template-columns: 116px 84px minmax(0, 1fr) 150px 150px 190px;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  .row:last-child {
    border-bottom: none;
  }
  .row.head {
    padding-top: 8px;
    padding-bottom: 8px;
    background: var(--panel);
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
  }
  .case {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .subject {
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .client {
    font-size: 13px;
    color: var(--muted);
  }
  select {
    width: 100%;
    height: 30px;
    padding: 0 6px;
    border: 1px solid #c9ccd1;
    background: var(--bg);
    font-size: 13px;
  }
  .log {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 12px;
    color: var(--muted);
  }
  .log .esc {
    color: #b42318;
    font-weight: 600;
  }
  .owner {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
  .act {
    height: 28px;
    padding: 0 10px;
    border: 1px solid #c9ccd1;
    background: var(--bg);
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
    transition: transform 0.15s, background-color 0.15s;
  }
  .act:hover {
    transform: scale(1.06);
    background: var(--active);
  }
  .empty {
    padding: 16px 14px;
    color: var(--muted);
    font-size: 14px;
  }

  /* ---- phone: summary tiles 2x2, card rows ---- */
  @media (max-width: 760px) {
    h1 {
      text-align: left;
      font-size: 26px;
    }
    .stats {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .stat:first-child {
      border: none;
      background: #111;
      color: #fff;
    }
    .stat:first-child .label {
      color: #c9ccd1;
    }
    .scroll {
      overflow: visible;
    }
    .row.head {
      display: none;
    }
    .row {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'case pay'
        'chip chip'
        'owner owner'
        'log log'
        'actions actions';
      row-gap: 10px;
      padding: 14px;
    }
    .row > :nth-child(1) {
      grid-area: chip;
    }
    .row > :nth-child(2) {
      grid-area: pay;
    }
    .case {
      grid-area: case;
    }
    .row > :nth-child(4) {
      grid-area: owner;
    }
    .row > :nth-child(5) {
      grid-area: log;
    }
    .log {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px 12px;
    }
    .actions {
      grid-area: actions;
      justify-content: stretch;
    }
    .act {
      flex: 1;
      height: 40px;
    }
    .subject {
      white-space: normal;
    }
    select {
      height: 36px;
    }
  }
</style>
