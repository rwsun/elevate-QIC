<script lang="ts">
  import { inbox, ME, type Email } from './mail.svelte'
  import {
    REMINDER_DAYS,
    byUrgency,
    clock,
    dayOf,
    daysLeft,
    formatPayout,
    isEscalated,
    openCases,
    sendNudge,
    openDrawer,
  } from './cases.svelte'
  import ConsentBadge from './ConsentBadge.svelte'
  import CountdownChip from './CountdownChip.svelte'
  import Payout from './Payout.svelte'

  let { query = '' }: { query?: string } = $props()

  type SortKey = 'urgent' | 'daysLeft' | 'payout' | 'newest'
  const sortLabels: Record<SortKey, string> = {
    urgent: 'Most urgent',
    daysLeft: 'Fewest days left',
    payout: 'Largest payout',
    newest: 'Newest case',
  }
  const sorters: Record<SortKey, (a: Email, b: Email) => number> = {
    urgent: byUrgency,
    daysLeft: (a, b) => daysLeft(a) - daysLeft(b) || (b.payout ?? 0) - (a.payout ?? 0),
    payout: (a, b) => (b.payout ?? 0) - (a.payout ?? 0) || daysLeft(a) - daysLeft(b),
    newest: (a, b) => b.opened.localeCompare(a.opened),
  }

  let sortKey = $state<SortKey>('urgent')
  let sortOpen = $state(false)
  let showResolved = $state(false)
  let justNudged = $state<number | null>(null)

  const matches = (m: Email) => {
    const q = query.trim().toLowerCase()
    return !q || [m.from, m.subject, m.assignee ?? 'unassigned', ...m.labels].some((s) => s.toLowerCase().includes(q))
  }

  const rows = $derived.by(() => {
    clock.now // re-sort when the day changes
    return openCases().filter(matches).sort(sorters[sortKey])
  })
  const resolved = $derived(inbox.filter((m) => m.payout != null && m.resolved && matches(m)))
  const totalPayout = $derived(rows.reduce((s, m) => s + (m.payout ?? 0), 0))

  function nudge(m: Email) {
    sendNudge(m)
    justNudged = m.id
    setTimeout(() => justNudged === m.id && (justNudged = null), 1800)
  }
</script>

<svelte:window onclick={() => (sortOpen = false)} />

<div class="page">
  <h1>Follow-ups</h1>

  <div class="bar">
    <div class="menu-wrap" role="presentation" onclick={(e) => e.stopPropagation()}>
      <button class="pill" onclick={() => (sortOpen = !sortOpen)} aria-haspopup="menu" aria-expanded={sortOpen}>
        <span class="muted">Sort:</span>
        {sortLabels[sortKey]}
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      {#if sortOpen}
        <div class="menu" role="menu">
          {#each Object.entries(sortLabels) as [k, label]}
            <button
              role="menuitemradio"
              aria-checked={sortKey === k}
              class:current={sortKey === k}
              onclick={() => {
                sortKey = k as SortKey
                sortOpen = false
              }}
            >
              {label}
              {#if k === 'urgent'}<span class="hint">days left, then payout</span>{/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    <span class="summary">{rows.length} open cases · {formatPayout(totalPayout)} in payouts</span>
  </div>

  <div class="table" role="table" aria-label="Open cases">
    <div class="row head" role="row">
      <span role="columnheader">Deadline</span>
      <span role="columnheader">Payout</span>
      <span role="columnheader">Case</span>
      <span role="columnheader">Owner</span>
      <span role="columnheader" title="In-app and email reminders on day 15, 25 and 30">Reminders · in-app + email</span>
      <span role="columnheader"></span>
    </div>

    <div class="body">
      {#each rows as m (m.id)}
        {@const day = dayOf(m, clock.now)}
        {@const next = REMINDER_DAYS.find((r) => day < r)}
        <div class="row" role="row" class:flagged={isEscalated(m, clock.now)}>
          <span role="cell"><CountdownChip email={m} /></span>
          <span role="cell"><Payout amount={m.payout!} /></span>
          <span role="cell" class="case">
            <button class="subject open" onclick={() => openDrawer(m)}>{m.subject}</button>
            <span class="client">
              {m.from}
              <ConsentBadge consent={m.consent} />
              {#if isEscalated(m, clock.now)}<span class="flag">Flagged for manager</span>{/if}
            </span>
          </span>
          <span role="cell" class="owner" class:none={!m.assignee}>
            {m.assignee ? (m.assignee === ME ? 'Me' : m.assignee) : 'Unassigned'}
          </span>
          <span role="cell" class="trail" aria-label="Reminders">
            {#each REMINDER_DAYS as r}
              {@const sent = day >= r}
              <span
                class="step"
                class:sent
                class:next={r === next}
                title="Day {r} reminder (in-app + email{r === 30 ? ', flags manager' : ''}): {sent
                  ? 'sent'
                  : `goes out in ${r - day} ${r - day === 1 ? 'day' : 'days'}`}"
              >
                <span class="step-day">
                  {#if sent}
                    <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" />
                    </svg>
                  {/if}
                  Day {r}
                </span>
                <span class="step-state">{sent ? 'Sent' : r - day === 1 ? 'in 1 day' : `in ${r - day} days`}</span>
              </span>
            {/each}
          </span>
          <span role="cell" class="actions">
            <button class="act" onclick={() => nudge(m)}>{justNudged === m.id ? 'Sent' : 'Remind'}</button>
            <button class="act" onclick={() => (m.resolved = true)}>Resolve</button>
          </span>
        </div>
      {:else}
        <div class="empty">{query ? 'No cases match your search.' : 'No open cases.'}</div>
      {/each}

      {#if resolved.length}
        <button class="toggle-resolved" onclick={() => (showResolved = !showResolved)}>
          {showResolved ? 'Hide' : 'Show'} resolved ({resolved.length})
        </button>
        {#if showResolved}
          {#each resolved as m (m.id)}
            <div class="row resolved" role="row">
              <span role="cell" class="done">Resolved</span>
              <span role="cell"><Payout amount={m.payout!} /></span>
              <span role="cell" class="case">
                <span class="subject">{m.subject}</span>
                <span class="client">{m.from}</span>
              </span>
              <span role="cell" class="owner">{m.assignee ?? 'Unassigned'}</span>
              <span role="cell"></span>
              <span role="cell" class="actions">
                <button class="act" onclick={() => (m.resolved = false)}>Reopen</button>
              </span>
            </div>
          {/each}
        {/if}
      {/if}
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
    font-weight: 400;
    text-align: center;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
  }
  .summary {
    margin-left: auto;
    font-size: 13px;
    color: var(--muted);
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid #c9ccd1;
    background: var(--bg);
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .pill:hover {
    transform: scale(1.05);
  }
  .muted {
    color: var(--muted);
  }
  .menu-wrap {
    position: relative;
  }
  .menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    min-width: 220px;
    padding: 4px 0;
    border: 1px solid var(--text);
    background: var(--bg);
  }
  .menu button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 7px 14px;
    border: none;
    background: none;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--panel);
  }
  .menu button.current {
    font-weight: 600;
  }
  .hint {
    font-size: 11px;
    font-weight: 400;
    color: var(--muted);
  }

  .table {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .row {
    display: grid;
    grid-template-columns: 116px 84px minmax(0, 1fr) 110px 240px 150px;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  .row.head {
    padding-top: 8px;
    padding-bottom: 8px;
    background: var(--panel);
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
  }
  .body .row:hover {
    background: #fafbfc;
  }
  .row.flagged {
    background: #fdf6f5;
  }
  .case {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .body .row {
    position: relative;
  }
  /* subject opens the case drawer; its hit area covers the row */
  .open {
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .open::after {
    content: '';
    position: absolute;
    inset: 0;
  }
  .actions,
  .trail {
    position: relative;
    z-index: 1;
  }
  .subject {
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .client {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    font-size: 13px;
    color: var(--muted);
  }
  .flag {
    white-space: nowrap;
    padding: 1px 6px;
    background: #111;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
  }
  .owner {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .owner.none {
    color: var(--muted);
    font-style: normal;
  }
  .trail {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  /* upcoming: faint dashed outline */
  .step {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    height: 40px;
    padding: 0 8px;
    border: 1px dashed #c9ccd1;
    background: var(--bg);
    color: var(--muted);
    line-height: 1.2;
  }
  .step-day {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .step-state {
    font-size: 11px;
    white-space: nowrap;
  }
  /* the next reminder to go out: solid, dark outline so it reads first */
  .step.next {
    border: 2px solid #111;
    color: #111;
  }
  /* already sent: grey, done */
  .step.sent {
    border: 1px solid #d5d8dc;
    background: #e5e7eb;
    color: #5f6570;
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
    cursor: pointer;
    transition: transform 0.15s, background-color 0.15s;
  }
  .act:hover {
    transform: scale(1.06);
    background: var(--active);
  }
  .empty {
    padding: 20px 14px;
    color: var(--muted);
  }
  .toggle-resolved {
    width: 100%;
    padding: 10px 14px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
    font-size: 13px;
    text-align: left;
    color: var(--muted);
    cursor: pointer;
  }
  .row.resolved {
    color: var(--muted);
  }
  .done {
    font-size: 12px;
  }

  /* ---- phone: card rows ---- */
  @media (max-width: 760px) {
    h1 {
      text-align: left;
      font-size: 26px;
    }
    .bar {
      flex-wrap: wrap;
      gap: 8px;
    }
    .summary {
      width: 100%;
      margin-left: 0;
    }
    .row.head {
      display: none;
    }
    .row {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'case pay'
        'chip owner'
        'trail trail'
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
    .owner {
      grid-area: owner;
      justify-self: end;
      font-size: 13px;
      color: var(--muted);
    }
    .trail {
      grid-area: trail;
    }
    .actions {
      grid-area: actions;
    }
    .subject {
      white-space: normal;
    }
    .client {
      flex-wrap: wrap;
    }
    .act {
      flex: 1;
      height: 40px;
      padding: 0 14px;
    }
  }
</style>
