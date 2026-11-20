<script lang="ts">
  import type { Page } from './data'
  import { allReminders, clock, emailOf, formatDate, readReminders, type Reminder } from './cases.svelte'

  let { onnavigate }: { onnavigate: (page: Page) => void } = $props()

  let open = $state(false)

  const reminders = $derived(allReminders(clock.now))
  const unread = $derived(reminders.filter((r) => !readReminders.has(r.key)).length)

  function when(d: Date) {
    const today = clock.now.toDateString() === d.toDateString()
    return today ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : formatDate(d)
  }

  function go(r: Reminder) {
    readReminders.add(r.key)
    open = false
    onnavigate(r.escalation ? 'manager' : 'follow-ups')
  }

  function markAllRead() {
    for (const r of reminders) readReminders.add(r.key)
  }
</script>

<svelte:window onclick={() => (open = false)} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="wrap" role="presentation" onclick={(e) => e.stopPropagation()}>
  <button
    class="bell"
    aria-label="Reminders{unread ? `, ${unread} unread` : ''}"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" fill="#111" />
    </svg>
    {#if unread}<span class="badge">{unread > 99 ? '99+' : unread}</span>{/if}
  </button>

  {#if open}
    <div class="panel">
      <div class="panel-head">
        <span>Reminders</span>
        {#if unread}<button class="link" onclick={markAllRead}>Mark all read</button>{/if}
      </div>
      <p class="note">Sent in-app and by email on day 15, 25 and 30. Day 30 also flags the manager.</p>
      <ul>
        {#each reminders as r (r.key)}
          <li>
            <button class="item" class:unread={!readReminders.has(r.key)} onclick={() => go(r)}>
              <span class="tag" class:esc={r.escalation} class:nudge={r.day == null}>
                {r.day == null ? 'Nudge' : `Day ${r.day}`}
              </span>
              <span class="text">
                <span class="msg">{r.text}</span>
                <span class="meta">
                  In-app + email to {r.recipients.map((n) => emailOf(n) ?? n).join(', ')}
                </span>
              </span>
              <span class="when">{when(r.date)}</span>
            </button>
          </li>
        {:else}
          <li class="empty">No reminders yet.</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
  }
  .bell {
    position: relative;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    background: var(--bg);
    cursor: pointer;
    transition: transform 0.15s;
  }
  .bell:hover {
    transform: scale(1.08);
  }
  .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    background: var(--unread);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    text-align: center;
  }
  .panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    width: min(420px, 90vw);
    max-height: 70vh;
    border: 1px solid var(--text);
    background: var(--bg);
  }
  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 4px;
    font-family: var(--heading);
    font-size: 18px;
    font-weight: 400;
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    font-family: var(--body);
    font-size: 13px;
    text-decoration: underline;
    cursor: pointer;
  }
  .note {
    margin: 0;
    padding: 0 14px 10px;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    color: var(--muted);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
  }
  .item {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
    text-align: left;
    cursor: pointer;
  }
  .item.unread {
    background: var(--bg);
  }
  .item:hover {
    background: #eef0f3;
  }
  .tag {
    align-self: start;
    padding: 2px 0;
    background: #111;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
  }
  .tag.esc {
    background: #b42318;
  }
  .tag.nudge {
    background: var(--bg);
    color: #111;
    outline: 1px solid #111;
    outline-offset: -1px;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .msg {
    font-size: 13px;
  }
  .item.unread .msg {
    font-weight: 600;
  }
  .meta {
    overflow: hidden;
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .when {
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
  }
  .empty {
    padding: 16px 14px;
    color: var(--muted);
    font-size: 13px;
  }

  @media (max-width: 760px) {
    .panel {
      position: fixed;
      top: 64px;
      left: 8px;
      right: 8px;
      width: auto;
      max-height: calc(100dvh - 160px);
    }
  }
</style>
