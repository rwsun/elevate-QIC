<script lang="ts">
  import {
    inbox,
    team,
    labels,
    ME,
    DEADLINE_DAYS,
    AMBER_AFTER_DAY,
    RED_AFTER_DAY,
    type Email,
    type Label,
  } from './mail.svelte'

  let { query = '' }: { query?: string } = $props()

  type SectionKey = 'brandNew' | 'mine' | 'others'
  type Status = 'ok' | 'warn' | 'late' | 'replied'
  type SortKey = 'newest' | 'oldest' | 'waiting' | 'deadline'

  const DAY = 86_400_000
  const statusColor: Record<Status, string> = {
    ok: 'var(--assigned)',
    warn: 'var(--new)',
    late: 'var(--orphaned)',
    replied: '#e5e7eb',
  }
  const labelColor: Record<Label, [string, string]> = {
    'Term life': ['#eef3dc', '#4d5c1f'],
    'Whole life': ['#e8f0ec', '#285a43'],
    Beneficiary: ['#f3e8f7', '#6b2f86'],
    Billing: ['#fdf1dc', '#8a5a00'],
    Underwriting: ['#e6eef8', '#24508a'],
    Claims: ['#fbe6e5', '#9b2c26'],
    Renewal: ['#e3f3f3', '#1f6767'],
  }
  const sortLabels: Record<SortKey, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    waiting: 'Longest waiting',
    deadline: 'Deadline soonest',
  }
  type Phase = 'green' | 'amber' | 'red'
  const phaseColor: Record<Phase, [string, string]> = {
    green: ['#eef3dc', 'var(--assigned)'],
    amber: ['#fdf1dc', 'var(--new)'],
    red: ['#fbe6e5', 'var(--orphaned)'],
  }

  let now = $state(new Date())
  $effect(() => {
    const t = setInterval(() => (now = new Date()), 60_000)
    return () => clearInterval(t)
  })

  let collapsed = $state<Record<SectionKey, boolean>>({ brandNew: true, mine: false, others: false })
  let openMenu = $state<string | null>(null)
  let selected = $state(new Set<number>())

  let assignedFilter = $state<'all' | 'unassigned' | string>('all')
  let followingOnly = $state(false)
  let unreadOnly = $state(false)
  let labelFilter = $state<Label | null>(null)
  let sortKey = $state<SortKey>('newest')
  /** Countdown chips show "Day 12 of 30" or "18 days left"; clicking any chip flips all of them. */
  let countdownMode = $state<'day' | 'left'>('day')

  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  // Calendar days since the latest message arrived (yesterday = 1 day).
  const daysWaiting = (m: Email) => Math.max(0, Math.round((midnight(now) - midnight(new Date(m.received))) / DAY))

  function status(m: Email): Status {
    if (!m.awaitingReply) return 'replied'
    const d = daysWaiting(m)
    if (m.urgent || d >= 4) return 'late'
    if (d >= 2) return 'warn'
    return 'ok'
  }

  /** Day 1 is the day the thread opened. */
  const dayOf = (m: Email) => Math.round((midnight(now) - midnight(new Date(m.opened + 'T00:00'))) / DAY) + 1

  function phase(m: Email): Phase {
    const d = dayOf(m)
    if (d > RED_AFTER_DAY) return 'red'
    if (d > AMBER_AFTER_DAY) return 'amber'
    return 'green'
  }

  function countdownText(m: Email) {
    const d = dayOf(m)
    const left = DEADLINE_DAYS - d
    if (left < 0) return `${-left} ${-left === 1 ? 'day' : 'days'} overdue`
    if (countdownMode === 'day') return `Day ${d} of ${DEADLINE_DAYS}`
    return left === 0 ? 'Due today' : `${left} ${left === 1 ? 'day' : 'days'} left`
  }

  function countdownTitle(m: Email) {
    const d = dayOf(m)
    const left = DEADLINE_DAYS - d
    const due = new Date(new Date(m.opened + 'T00:00').getTime() + (DEADLINE_DAYS - 1) * DAY)
    const dueText = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const state = left < 0 ? `${-left} days overdue` : `Day ${d} of ${DEADLINE_DAYS}, ${left} days left`
    return `${state} · due ${dueText} · click to switch format`
  }

  function waitText(m: Email) {
    if (!m.awaitingReply) return 'replied'
    const d = daysWaiting(m)
    return d === 0 ? 'today' : d === 1 ? '1 day' : `${d} days`
  }

  const shortName = (name: string) => {
    const [first, last] = name.split(' ')
    return last ? `${first} ${last[0]}.` : first
  }

  function whenText(iso: string) {
    const d = new Date(iso)
    const sameDay = d.toDateString() === now.toDateString()
    return sameDay
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase()
    let list = inbox.filter((m) => {
      if (q && ![m.from, m.subject, m.preview, ...m.labels].some((s) => s.toLowerCase().includes(q))) return false
      if (followingOnly && !m.following) return false
      if (unreadOnly && !m.unread) return false
      if (labelFilter && !m.labels.includes(labelFilter)) return false
      if (assignedFilter === 'unassigned' && m.assignee) return false
      if (assignedFilter !== 'all' && assignedFilter !== 'unassigned' && m.assignee !== assignedFilter) return false
      return true
    })
    const t = (m: Email) => new Date(m.received).getTime()
    list = [...list].sort((a, b) => {
      if (sortKey === 'oldest') return t(a) - t(b)
      if (sortKey === 'deadline') return dayOf(b) - dayOf(a)
      if (sortKey === 'waiting') {
        // Threads still awaiting a reply first, longest wait at the top.
        if (a.awaitingReply !== b.awaitingReply) return a.awaitingReply ? -1 : 1
        return t(a) - t(b)
      }
      return t(b) - t(a)
    })
    return list
  })

  const sections = $derived([
    { key: 'brandNew' as const, title: 'Brand new', rows: filtered.filter((m) => !m.assignee) },
    { key: 'mine' as const, title: 'Mine', rows: filtered.filter((m) => m.assignee === ME) },
    {
      key: 'others' as const,
      title: 'Assigned to someone else',
      rows: filtered.filter((m) => m.assignee && m.assignee !== ME),
    },
  ])

  const allSelected = $derived(filtered.length > 0 && filtered.every((m) => selected.has(m.id)))

  function toggleMenu(key: string) {
    openMenu = openMenu === key ? null : key
  }

  function toggleSelect(id: number) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    selected = next
  }

  function toggleAll() {
    selected = allSelected ? new Set() : new Set(filtered.map((m) => m.id))
  }

  function assign(m: Email, who: string | null) {
    m.assignee = who
    openMenu = null
  }

  function bulk(action: 'me' | 'read' | 'archive') {
    for (let i = inbox.length - 1; i >= 0; i--) {
      const m = inbox[i]
      if (!selected.has(m.id)) continue
      if (action === 'me') m.assignee = ME
      else if (action === 'read') m.unread = false
      else inbox.splice(i, 1)
    }
    selected = new Set()
  }

  function archive(m: Email) {
    const i = inbox.indexOf(m)
    if (i >= 0) inbox.splice(i, 1)
    openMenu = null
  }
</script>

<svelte:window onclick={() => (openMenu = null)} onkeydown={(e) => e.key === 'Escape' && (openMenu = null)} />

{#snippet chevron()}
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
{/snippet}

{#snippet bell(on: boolean)}
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path
      d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"
      fill={on ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
  </svg>
{/snippet}

<div class="mail">
  <h1>
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6z"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
    Inbox
  </h1>

  <div class="filters">
    <label class="pill check-pill" title="Select all">
      <input type="checkbox" checked={allSelected} onchange={toggleAll} aria-label="Select all" />
    </label>

    {#if selected.size}
      <span class="sel-count">{selected.size} selected</span>
      <button class="pill" onclick={() => bulk('me')}>Assign to me</button>
      <button class="pill" onclick={() => bulk('read')}>Mark read</button>
      <button class="pill" onclick={() => bulk('archive')}>Archive</button>
    {:else}
      <div class="menu-wrap" role="presentation" onclick={(e) => e.stopPropagation()}>
        <button class="pill" class:on={assignedFilter !== 'all'} onclick={() => toggleMenu('assigned')}>
          {assignedFilter === 'all'
            ? 'Assigned to'
            : assignedFilter === 'unassigned'
              ? 'Unassigned'
              : assignedFilter === ME
                ? 'Assigned to me'
                : `Assigned to ${shortName(assignedFilter)}`}
          {@render chevron()}
        </button>
        {#if openMenu === 'assigned'}
          <div class="menu">
            {#each [['all', 'Anyone'], ['unassigned', 'Unassigned'], ...team.map((t) => [t, t === ME ? `${t} (me)` : t])] as [value, text]}
              <button
                class:current={assignedFilter === value}
                onclick={() => {
                  assignedFilter = value
                  openMenu = null
                }}>{text}</button
              >
            {/each}
          </div>
        {/if}
      </div>

      <button class="pill" class:on={followingOnly} aria-pressed={followingOnly} onclick={() => (followingOnly = !followingOnly)}>
        Following
      </button>
      <button class="pill" class:on={unreadOnly} aria-pressed={unreadOnly} onclick={() => (unreadOnly = !unreadOnly)}>
        Unread
      </button>

      <div class="menu-wrap" role="presentation" onclick={(e) => e.stopPropagation()}>
        <button class="pill" class:on={labelFilter} onclick={() => toggleMenu('label')}>
          {labelFilter ?? 'Label'}
          {@render chevron()}
        </button>
        {#if openMenu === 'label'}
          <div class="menu">
            <button
              class:current={!labelFilter}
              onclick={() => {
                labelFilter = null
                openMenu = null
              }}>All labels</button
            >
            {#each labels as l}
              <button
                class:current={labelFilter === l}
                onclick={() => {
                  labelFilter = l
                  openMenu = null
                }}
              >
                <span class="swatch" style:background={labelColor[l][0]} style:border-color={labelColor[l][1]}></span>
                {l}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="menu-wrap" role="presentation" onclick={(e) => e.stopPropagation()}>
        <button class="pill" class:on={sortKey !== 'newest'} onclick={() => toggleMenu('sort')}>
          {sortKey === 'newest' ? 'Sort' : sortLabels[sortKey]}
          {@render chevron()}
        </button>
        {#if openMenu === 'sort'}
          <div class="menu">
            {#each Object.entries(sortLabels) as [k, text]}
              <button
                class:current={sortKey === k}
                onclick={() => {
                  sortKey = k as SortKey
                  openMenu = null
                }}>{text}</button
              >
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <div class="legend" aria-label="Assignee colour key">
      <span><i style:background={statusColor.ok}></i>≤1 day</span>
      <span><i style:background={statusColor.warn}></i>2–3 days</span>
      <span><i style:background={statusColor.late}></i>4+ days / urgent</span>
      <span><i style:background={statusColor.replied}></i>replied</span>
    </div>
  </div>

  <div class="list">
    {#each sections as sec (sec.key)}
      <button
        class="section"
        class:brand-new={sec.key === 'brandNew'}
        aria-expanded={!collapsed[sec.key]}
        onclick={() => (collapsed[sec.key] = !collapsed[sec.key])}
      >
        <svg class:closed={collapsed[sec.key]} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        {#if sec.key === 'mine'}
          <svg class="hand" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path
              d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V12V8.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15a1.6 1.6 0 0 1 2.5-2z"
              fill="#111"
            />
          </svg>
        {/if}
        {sec.title} ({sec.rows.length})
      </button>

      {#if !collapsed[sec.key]}
        {#each sec.rows as m (m.id)}
          {@const st = status(m)}
          {@const ph = phase(m)}
          <div class="row" class:unread={m.unread} class:selected={selected.has(m.id)}>
            <label class="lead">
              <span class="dot" class:on={m.unread}></span>
              <input type="checkbox" checked={selected.has(m.id)} onchange={() => toggleSelect(m.id)} aria-label="Select" />
            </label>

            <button class="sender" onclick={() => (m.unread = false)}>{m.from}</button>

            <div class="main">
              <div class="line1">
                <button class="subject" onclick={() => (m.unread = false)}>{m.subject}</button>
                {#if m.icon === 'cake'}
                  <svg class="subject-icon" viewBox="0 0 24 24" width="16" height="16" aria-label="birthday">
                    <path
                      d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 5 0M12 12V8M12 5.5c.8-.6 1-1.5 0-2.5-1 1-.8 1.9 0 2.5"
                      fill="none"
                      stroke="#111"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                {/if}
                {#if m.count > 1}<span class="count">{m.count}</span>{/if}

                <div class="menu-wrap" role="presentation" onclick={(e) => e.stopPropagation()}>
                  <button
                    class="assignee"
                    style:background={statusColor[st]}
                    title="{m.assignee ?? 'Unassigned'} · {m.awaitingReply ? `waiting ${waitText(m)}` : 'replied'}{m.urgent
                      ? ' · urgent'
                      : ''}"
                    onclick={() => toggleMenu(`assign-${m.id}`)}
                  >
                    {m.assignee ? (m.assignee === ME ? 'Me' : shortName(m.assignee)) : 'Unassigned'}
                    <span class="wait">· {waitText(m)}</span>
                    {#if m.urgent}<span class="urgent">!</span>{/if}
                  </button>
                  {#if openMenu === `assign-${m.id}`}
                    <div class="menu">
                      <span class="menu-title">Assign to</span>
                      {#each team as t}
                        <button class:current={m.assignee === t} onclick={() => assign(m, t)}>
                          {t === ME ? `${t} (me)` : t}
                        </button>
                      {/each}
                      <button class:current={!m.assignee} onclick={() => assign(m, null)}>Unassigned</button>
                    </div>
                  {/if}
                </div>

                {#each m.labels as l}
                  <span class="label" style:background={labelColor[l][0]} style:color={labelColor[l][1]}>{l}</span>
                {/each}
              </div>
              <div class="preview">{m.preview}</div>
            </div>

            <span class="when">{whenText(m.received)}</span>

            <button
              class="countdown"
              class:overdue={dayOf(m) > DEADLINE_DAYS}
              style:background={phaseColor[ph][0]}
              title={countdownTitle(m)}
              onclick={() => (countdownMode = countdownMode === 'day' ? 'left' : 'day')}
            >
              {countdownText(m)}
            </button>

            <button
              class="icon-btn"
              class:on={m.following}
              aria-label={m.following ? 'Unfollow' : 'Follow'}
              aria-pressed={m.following}
              onclick={() => (m.following = !m.following)}
            >
              {@render bell(m.following)}
            </button>

            <div class="menu-wrap" role="presentation" onclick={(e) => e.stopPropagation()}>
              <button class="icon-btn" aria-label="More" onclick={() => toggleMenu(`more-${m.id}`)}>•••</button>
              {#if openMenu === `more-${m.id}`}
                <div class="menu right">
                  <button
                    onclick={() => {
                      m.unread = !m.unread
                      openMenu = null
                    }}>Mark as {m.unread ? 'read' : 'unread'}</button
                  >
                  <button
                    onclick={() => {
                      m.awaitingReply = !m.awaitingReply
                      openMenu = null
                    }}>{m.awaitingReply ? 'Mark as replied' : 'Mark as waiting'}</button
                  >
                  <button
                    onclick={() => {
                      m.urgent = !m.urgent
                      openMenu = null
                    }}>{m.urgent ? 'Remove urgent flag' : 'Flag as urgent'}</button
                  >
                  <button onclick={() => archive(m)}>Archive</button>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="empty">Nothing here.</div>
        {/each}
      {/if}
    {/each}
  </div>
</div>

<style>
  .mail {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    min-height: 0;
  }
  button {
    border-radius: 0;
    font: inherit;
  }

  h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 0 0 clamp(10px, 2vh, 20px);
    font-family: var(--heading);
    font-size: 32px; /* 24pt */
    font-weight: 500;
  }

  /* ---- filter bar ---- */
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
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
    transition: transform 0.15s, background-color 0.15s;
  }
  .pill:hover {
    transform: scale(1.05);
  }
  .pill.on {
    background: var(--active);
    border-color: #a9b36a;
  }
  .check-pill {
    padding: 0 10px;
  }
  .sel-count {
    font-size: 13px;
    color: var(--muted);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-left: auto;
    font-size: 12px;
    color: var(--muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .legend i {
    width: 10px;
    height: 10px;
  }

  /* ---- menus ---- */
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
    min-width: 180px;
    padding: 4px 0;
    border: 1px solid var(--text);
    background: var(--bg);
  }
  .menu.right {
    left: auto;
    right: 0;
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border: none;
    background: none;
    text-align: left;
    font-size: 14px;
    white-space: nowrap;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--panel);
  }
  .menu button.current {
    font-weight: 600;
  }
  .menu-title {
    padding: 4px 14px;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .swatch {
    width: 12px;
    height: 12px;
    border: 1px solid;
  }

  /* ---- list ---- */
  .list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }
  .section {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 16px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: #f1f2f4;
    font-size: 15px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .section.brand-new {
    margin-bottom: 12px;
    border-top: 1px solid #e3c88f;
    border-bottom: 1px solid #e3c88f;
    background: #fbefd6;
    color: #7a4f00;
  }
  .section svg:not(.hand) {
    transition: transform 0.15s;
  }
  .subject-icon {
    flex-shrink: 0;
  }
  .section svg.closed {
    transform: rotate(-90deg);
  }

  .row {
    display: grid;
    grid-template-columns: 32px clamp(120px, 13vw, 200px) minmax(0, 1fr) 56px 112px 32px 32px;
    align-items: start;
    gap: 8px;
    padding: 12px 12px 12px 8px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
    transition: background-color 0.12s;
  }
  .row:hover {
    background: #fafbfc;
  }
  .row.selected {
    background: #f4f7e6;
  }
  .lead {
    position: relative;
    display: grid;
    place-items: center;
    height: 22px;
    cursor: pointer;
  }
  .dot {
    width: 10px;
    height: 10px;
    background: #c4c7cc;
  }
  .dot.on {
    background: var(--unread);
  }
  .lead input {
    position: absolute;
    opacity: 0;
  }
  .row:hover .lead input,
  .row.selected .lead input {
    opacity: 1;
  }
  .row:hover .dot,
  .row.selected .dot {
    visibility: hidden;
  }
  .sender,
  .subject {
    padding: 0;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .sender {
    line-height: 22px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .main {
    min-width: 0;
  }
  .line1 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 22px;
  }
  .subject {
    font-size: 15px;
  }
  .row.unread .subject {
    font-weight: 600;
  }
  .count {
    padding: 0 5px;
    border: 1px solid var(--border);
    font-size: 11px;
    color: var(--muted);
  }
  .assignee {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 8px;
    border: none;
    color: #111;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .assignee:hover {
    transform: scale(1.08);
  }
  .wait {
    font-weight: 400;
  }
  .urgent {
    display: grid;
    place-items: center;
    width: 14px;
    height: 14px;
    margin-left: 2px;
    background: #111;
    color: #fff;
    font-size: 10px;
  }
  .label {
    height: 22px;
    padding: 0 7px;
    font-size: 12px;
    line-height: 22px;
    white-space: nowrap;
  }
  .preview {
    margin-top: 4px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--muted);
  }
  .when {
    line-height: 22px;
    text-align: right;
    font-size: 13px;
    color: var(--muted);
  }
  .row.unread .when {
    color: var(--text);
    font-weight: 600;
  }
  .countdown {
    position: relative;
    height: 22px;
    padding: 0 8px;
    border: none;
    color: #111;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .countdown:hover {
    transform: scale(1.08);
  }
  .countdown.overdue {
    font-weight: 700;
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 32px;
    height: 22px;
    padding: 0;
    border: none;
    background: none;
    color: #b0b4ba;
    font-size: 11px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .icon-btn:hover,
  .icon-btn.on {
    color: var(--text);
  }
  .icon-btn:hover {
    transform: scale(1.15);
  }
  .empty {
    padding: 14px 52px;
    border-bottom: 1px solid var(--border);
    color: var(--muted);
    font-size: 14px;
  }

  /* ---- phone: each email becomes a stacked card row ---- */
  @media (max-width: 760px) {
    h1 {
      justify-content: flex-start;
      font-size: 26px;
    }
    .legend {
      width: 100%;
      margin-left: 0;
    }
    .pill {
      height: 38px;
    }
    .row {
      grid-template-columns: 18px minmax(0, 1fr) auto auto;
      grid-template-areas:
        'lead sender sender when'
        '. main main main'
        '. cd bell more';
      row-gap: 6px;
      padding: 14px 12px 12px 8px;
    }
    .lead {
      grid-area: lead;
    }
    .sender {
      grid-area: sender;
      font-weight: 500;
    }
    .main {
      grid-area: main;
    }
    .when {
      grid-area: when;
    }
    .row > .countdown {
      grid-area: cd;
      justify-self: start;
    }
    .row > .icon-btn {
      grid-area: bell;
      width: 40px;
      height: 32px;
    }
    .row > .menu-wrap {
      grid-area: more;
    }
    .row > .menu-wrap .icon-btn {
      width: 40px;
      height: 32px;
    }
    /* no hover on touch: always show the checkbox instead of the dot */
    .lead input {
      opacity: 1;
    }
    .dot {
      display: none;
    }
    .section {
      padding: 12px;
    }
  }
</style>
