<script lang="ts">
  import { ME, responseLabels, type Email } from './mail.svelte'
  import {
    clock,
    ageDays,
    byUrgency,
    claim,
    formatDate,
    formatPayout,
    isAssignedCase,
    isNewCase,
    isOrphanedCase,
    openDrawer,
    routeOf,
    routeReason,
    UNCLAIMED_DAYS,
    BACKUP_ADVISOR,
    LEGACY_DESK,
    BACKUP_MIN_PAYOUT,
  } from './cases.svelte'
  import { inbox } from './mail.svelte'
  import CountdownChip from './CountdownChip.svelte'
  import Payout from './Payout.svelte'
  import ConsentBadge from './ConsentBadge.svelte'

  let { variant, query = '' }: { variant: 'orphaned' | 'assigned' | 'new'; query?: string } = $props()

  const matches = (m: Email) => {
    const q = query.trim().toLowerCase()
    return !q || [m.from, m.subject, m.policyNo, m.assignee ?? 'unclaimed'].some((s) => s.toLowerCase().includes(q))
  }

  const rows = $derived.by(() => {
    const now = clock.now
    if (variant === 'orphaned')
      return inbox
        .filter((m) => isOrphanedCase(m) && matches(m))
        .sort((a, b) => ageDays(b, now) - ageDays(a, now) || (b.payout ?? 0) - (a.payout ?? 0))
    if (variant === 'assigned')
      return inbox
        .filter((m) => isAssignedCase(m) && matches(m))
        .sort((a, b) => (a.assignee ?? '').localeCompare(b.assignee ?? '') || byUrgency(a, b))
    return inbox.filter((m) => isNewCase(m, now) && matches(m)).sort((a, b) => b.opened.localeCompare(a.opened))
  })

  let claimed = $state<{ id: number; subject: string } | null>(null)
  function doClaim(m: Email) {
    claim(m)
    claimed = { id: m.id, subject: m.subject }
    setTimeout(() => claimed?.id === m.id && (claimed = null), 3500)
  }

  const ownerText = (m: Email) => (m.assignee === ME ? `${m.assignee} (me)` : m.assignee)
</script>

{#if variant === 'orphaned'}
  <p class="rule">
    <strong>Auto-assignment:</strong> payouts of {formatPayout(BACKUP_MIN_PAYOUT)} or more route to backup advisor
    {BACKUP_ADVISOR}; everything else routes to the {LEGACY_DESK}. Unclaimed after {UNCLAIMED_DAYS} days, a case turns
    red and the manager is notified. Managers can override routing in the case drawer.
  </p>
{/if}

{#if claimed}
  <div class="toast" role="status">Claimed “{claimed.subject}”. It’s now under assigned, owned by you.</div>
{/if}

<div class="list {variant}">
  <div class="row head">
    {#if variant === 'orphaned'}
      <span>Age</span><span>Payout</span><span>Case</span><span>Routed to</span><span>Consent</span><span>Deadline</span><span></span>
    {:else if variant === 'assigned'}
      <span>Owner</span><span>Payout</span><span>Case</span><span>Deadline</span><span>Consent</span><span>Last outcome</span>
    {:else}
      <span>Deadline</span><span>Payout</span><span>Case</span><span>Owner</span><span>Consent</span>
    {/if}
  </div>

  {#each rows as m (m.id)}
    {@const age = ageDays(m, clock.now)}
    {@const late = variant === 'orphaned' && age >= UNCLAIMED_DAYS}
    <div class="row" class:late>
      {#if variant === 'orphaned'}
        <span class="age" class:late>
          <strong>{age}</strong>
          {age === 1 ? 'day' : 'days'}
          {#if late}<span class="notified">Manager notified</span>{/if}
        </span>
      {:else if variant === 'assigned'}
        <span class="owner-cell">{ownerText(m)}</span>
      {:else}
        <span><CountdownChip email={m} /></span>
      {/if}

      <span><Payout amount={m.payout!} /></span>

      <span class="case">
        <button class="open" onclick={() => openDrawer(m)}>{m.subject}</button>
        <span class="client">{m.from} · {m.policyNo}</span>
      </span>

      {#if variant === 'orphaned'}
        <span class="route" title={routeReason(m)}>
          {routeOf(m)}
          <span class="why">{m.routeOverride ? 'override' : 'auto'}</span>
        </span>
        <span><ConsentBadge consent={m.consent} /></span>
        <span><CountdownChip email={m} /></span>
        <span class="claim-cell">
          <button class="claim" onclick={() => doClaim(m)}>Claim this case</button>
        </span>
      {:else if variant === 'assigned'}
        <span><CountdownChip email={m} /></span>
        <span><ConsentBadge consent={m.consent} /></span>
        <span class="outcome">
          {#if m.outcomes[0]}
            {responseLabels[m.outcomes[0].response]} · {formatDate(new Date(m.outcomes[0].date + 'T00:00'))}
          {:else}
            <span class="muted">None logged</span>
          {/if}
        </span>
      {:else}
        <span class="owner-cell" class:muted={!m.assignee}>{m.assignee ? ownerText(m) : `Unclaimed · ${routeOf(m)}`}</span>
        <span><ConsentBadge consent={m.consent} /></span>
      {/if}
    </div>
  {:else}
    <div class="empty">
      {query
        ? 'No cases match your search.'
        : variant === 'orphaned'
          ? 'The orphaned queue is empty. Every case has an owner.'
          : 'No cases here.'}
    </div>
  {/each}
</div>

<style>
  .rule {
    margin: 0 0 12px;
    padding: 10px 14px;
    border-left: 4px solid #111;
    background: var(--bg);
    font-size: 13px;
    line-height: 1.5;
  }
  .toast {
    margin-bottom: 12px;
    padding: 10px 14px;
    background: #111;
    color: #fff;
    font-size: 13px;
  }
  .list {
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .row {
    position: relative;
    display: grid;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  .orphaned .row {
    grid-template-columns: 96px 84px minmax(0, 1fr) 120px 128px 116px 150px;
  }
  .assigned .row {
    grid-template-columns: 130px 84px minmax(0, 1fr) 116px 128px 130px;
  }
  .new .row {
    grid-template-columns: 116px 84px minmax(0, 1fr) 170px 128px;
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
  .row:not(.head):hover {
    background: #fafbfc;
  }
  .row.late {
    background: #fdf2f1;
  }
  .row.late:hover {
    background: #fbe9e7;
  }
  .case {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  /* the subject opens the drawer; its hit area stretches over the whole row */
  .open {
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    font-weight: 600;
    text-align: left;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
  }
  .open::after {
    content: '';
    position: absolute;
    inset: 0;
  }
  .open:focus-visible {
    outline: 2px solid #111;
    outline-offset: 2px;
  }
  .client {
    font-size: 13px;
    color: var(--muted);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .age {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 4px;
    font-size: 13px;
  }
  .age strong {
    font-family: var(--heading);
    font-size: 20px;
    font-weight: 400;
  }
  .age.late strong {
    color: #b42318;
  }
  .notified {
    width: 100%;
    font-size: 11px;
    font-weight: 600;
    color: #b42318;
  }
  .route {
    display: flex;
    flex-direction: column;
    font-size: 13px;
  }
  .why {
    font-size: 11px;
    color: var(--muted);
  }
  .claim-cell {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: flex-end;
  }
  .claim {
    height: 38px;
    padding: 0 14px;
    border: 1px solid #111;
    background: #111;
    color: #fff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .claim:hover {
    transform: scale(1.06);
  }
  .owner-cell {
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .owner-cell.muted {
    font-weight: 400;
  }
  .outcome {
    font-size: 13px;
  }
  .muted {
    color: var(--muted);
  }
  .empty {
    padding: 18px 14px;
    color: var(--muted);
    font-size: 14px;
  }

  @media (max-width: 1100px) {
    .orphaned .row {
      grid-template-columns: 80px 84px minmax(0, 1fr) 110px 150px;
    }
    .orphaned .row > :nth-child(5),
    .orphaned .row > :nth-child(6) {
      display: none;
    }
  }

  /* ---- phone: cards ---- */
  @media (max-width: 760px) {
    .row.head {
      display: none;
    }
    .orphaned .row,
    .assigned .row,
    .new .row {
      grid-template-columns: minmax(0, 1fr) auto;
      row-gap: 8px;
      padding: 14px;
    }
    .orphaned .row > :nth-child(5),
    .orphaned .row > :nth-child(6) {
      display: block;
    }
    .case {
      grid-column: 1;
      grid-row: 1;
    }
    .row > :nth-child(2) {
      grid-column: 2;
      grid-row: 1;
    }
    .open {
      white-space: normal;
    }
    .claim-cell {
      grid-column: 1 / -1;
    }
    .claim {
      width: 100%;
      height: 44px;
      font-size: 15px;
    }
  }
</style>
