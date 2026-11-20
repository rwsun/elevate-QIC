<script lang="ts">
  import type { Page } from './data'
  import { ME, type Email } from './mail.svelte'
  import { clock, daysLeft, formatPayout, openCases } from './cases.svelte'
  import CountdownChip from './CountdownChip.svelte'
  import Payout from './Payout.svelte'

  let { query = '', onnavigate }: { query?: string; onnavigate: (page: Page) => void } = $props()

  const DUE_SOON_COUNT = 5

  const matches = (m: Email) => {
    const q = query.trim().toLowerCase()
    return !q || [m.from, m.subject, m.assignee ?? 'unassigned'].some((s) => s.toLowerCase().includes(q))
  }

  const cases = $derived.by(() => {
    clock.now
    return openCases()
  })
  // Fewest days left first (overdue at the top), biggest payout breaks ties.
  const dueSoon = $derived(
    cases
      .filter(matches)
      .sort((a, b) => daysLeft(a) - daysLeft(b) || (b.payout ?? 0) - (a.payout ?? 0))
      .slice(0, DUE_SOON_COUNT),
  )
  const dueThisWeek = $derived(cases.filter((m) => daysLeft(m) >= 0 && daysLeft(m) <= 7).length)
  const overdue = $derived(cases.filter((m) => daysLeft(m) < 0).length)
  const openTotal = $derived(cases.reduce((s, m) => s + (m.payout ?? 0), 0))

  const categories: { page: Page; color: string }[] = [
    { page: 'assigned', color: 'var(--assigned)' },
    { page: 'new', color: 'var(--new)' },
    { page: 'orphaned', color: 'var(--orphaned)' },
  ]
</script>

<div class="home">
  <h1>welcome, rhea</h1>

  <div class="stats">
    <button class="stat amber" onclick={() => onnavigate('follow-ups')}>
      <span class="num">{dueThisWeek}</span>
      <span class="label">{dueThisWeek === 1 ? 'case' : 'cases'} due this week</span>
    </button>
    <button class="stat red" onclick={() => onnavigate('manager')}>
      <span class="num">{overdue}</span>
      <span class="label">{overdue === 1 ? 'case' : 'cases'} overdue</span>
    </button>
    <button class="stat" onclick={() => onnavigate('follow-ups')}>
      <span class="num">{formatPayout(openTotal)}</span>
      <span class="label">in open payouts</span>
    </button>
  </div>

  <section class="due">
    <div class="due-head">
      <h2>due soon</h2>
      <button class="link" onclick={() => onnavigate('follow-ups')}>See all follow-ups</button>
    </div>
    <ul>
      {#each dueSoon as m (m.id)}
        <li>
          <button class="item" onclick={() => onnavigate('follow-ups')}>
            <span class="chip"><CountdownChip email={m} /></span>
            <span class="case">
              <span class="subject">{m.subject}</span>
              <span class="client">{m.from} · {m.assignee ? (m.assignee === ME ? 'Me' : m.assignee) : 'Unassigned'}</span>
            </span>
            <span class="pay"><Payout amount={m.payout!} /></span>
          </button>
        </li>
      {:else}
        <li class="empty">{query ? 'No cases match your search.' : 'Nothing due. Enjoy the quiet.'}</li>
      {/each}
    </ul>
  </section>

  <div class="categories">
    {#each categories as c}
      <button class="category" style:background={c.color} onclick={() => onnavigate(c.page)}>{c.page}</button>
    {/each}
  </div>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 960px;
  }
  h1 {
    margin: 0 0 clamp(12px, 3vh, 32px);
    font-family: var(--heading);
    font-size: 32px; /* 24pt */
    font-weight: 500;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
    margin-bottom: clamp(16px, 3vh, 32px);
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-left: 4px solid #c9ccd1;
    background: var(--bg);
    text-align: left;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .stat:hover {
    transform: scale(1.03);
  }
  .stat.amber {
    border-left-color: var(--new);
  }
  .stat.red {
    border-left-color: var(--orphaned);
  }
  .num {
    font-family: var(--heading);
    font-size: clamp(22px, 3.4vh, 28px);
    font-weight: 500;
    line-height: 1.1;
  }
  .label {
    font-size: 13px;
    color: var(--muted);
  }

  .due {
    width: 100%;
  }
  .due-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  h2 {
    margin: 0;
    font-family: var(--heading);
    font-size: 20px;
    font-weight: 500;
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    font-size: 13px;
    text-decoration: underline;
    cursor: pointer;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--border);
    background: var(--bg);
  }
  li + li {
    border-top: 1px solid var(--border);
  }
  .item {
    display: grid;
    grid-template-columns: 116px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: clamp(8px, 1.4vh, 12px) 14px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: #fafbfc;
  }
  .case {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .subject {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .client {
    font-size: 13px;
    color: var(--muted);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .empty {
    padding: 16px 14px;
    color: var(--muted);
    font-size: 14px;
  }

  .categories {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: clamp(16px, 3vh, 32px);
  }
  .category {
    min-width: 120px;
    padding: 10px 24px;
    border: none;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .category:hover {
    transform: scale(1.08);
  }

  /* ---- phone: banking-app style ---- */
  @media (max-width: 760px) {
    .home {
      align-items: stretch;
    }
    h1 {
      margin-bottom: 16px;
      font-size: 26px;
    }
    .stats {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    /* the payout total reads like an account balance: full-width hero card */
    .stat:last-child {
      grid-column: 1 / -1;
      order: -1;
      padding: 18px 16px;
      border: none;
      background: #111;
      color: #fff;
    }
    .stat:last-child .label {
      color: #c9ccd1;
    }
    .stat:last-child .num {
      font-size: 34px;
    }
    .item {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'case pay'
        'chip chip';
      row-gap: 8px;
      padding: 14px;
    }
    .chip {
      grid-area: chip;
    }
    .case {
      grid-area: case;
    }
    .pay {
      grid-area: pay;
    }
    .subject {
      white-space: normal;
    }
    .categories {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .category {
      min-width: 0;
      padding: 14px 8px;
    }
  }
</style>
