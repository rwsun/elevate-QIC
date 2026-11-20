<script lang="ts">
  import {
    BASELINE_RATE,
    sampleHistory,
    liveClosed,
    rate,
    byPath,
    reasons,
    byChoice,
  } from './retention.svelte'
  import { formatPayout } from './cases.svelte'
  import BarChart, { type Bar } from './BarChart.svelte'

  let includeSample = $state(true)
  let showTables = $state(false)

  const live = $derived(liveClosed())
  const cases = $derived(includeSample ? [...sampleHistory, ...live] : live)
  const overall = $derived(rate(cases))
  const paid = $derived(cases.reduce((s, c) => s + c.payout, 0))
  const kept = $derived(cases.reduce((s, c) => s + c.reinvested, 0))
  const paths = $derived(byPath(cases))
  const why = $derived(reasons(cases))
  const choice = $derived(byChoice(cases))
  const lostCount = $derived(cases.filter((c) => c.reinvested === 0).length)

  const pts = (v: number) => {
    const d = Math.round((v - BASELINE_RATE) * 100)
    return `${d >= 0 ? '+' : ''}${d} pts`
  }
  const pctText = (v: number) => `${Math.round(v * 100)}%`
  const baselineLabel = `${pctText(BASELINE_RATE)} baseline`

  const tables: { title: string; bars: Bar[]; col: string }[] = $derived([
    { title: 'Retention by path', bars: paths, col: 'Retention' },
    { title: 'Reasons for not reinvesting', bars: why, col: 'Share of lost cases' },
    { title: 'Chosen vs assigned', bars: choice, col: 'Retention' },
  ])
</script>

<div class="page">
  <h1>Analytics</h1>

  <div class="controls">
    <label class="toggle">
      <input type="checkbox" bind:checked={includeSample} />
      Include sample history ({sampleHistory.length} illustrative closed cases)
    </label>
    <label class="toggle">
      <input type="checkbox" bind:checked={showTables} />
      Show data tables
    </label>
    <span class="live">{live.length} live {live.length === 1 ? 'case' : 'cases'} with logged outcomes</span>
  </div>

  {#if cases.length === 0}
    <p class="empty">No outcomes logged yet. Log one from a case drawer, or include the sample history.</p>
  {:else}
    <div class="stats">
      <div class="stat hero">
        <span class="num">{pctText(overall)}</span>
        <span class="label">retention rate · {pts(overall)} vs the {baselineLabel}</span>
      </div>
      <div class="stat">
        <span class="num">{formatPayout(kept)}</span>
        <span class="label">reinvested of {formatPayout(paid)} paid out</span>
      </div>
      <div class="stat">
        <span class="num">{cases.length}</span>
        <span class="label">closed cases tracked</span>
      </div>
    </div>

    <div class="grid">
      <section class="card">
        <h2>Retention rate by path</h2>
        <p class="sub">Share of closed cases where any of the payout was reinvested.</p>
        <BarChart
          bars={paths}
          reference={BASELINE_RATE}
          referenceLabel={baselineLabel}
          ariaLabel="Retention rate by contact path"
        />
      </section>

      <section class="card">
        <h2>Why money wasn’t reinvested</h2>
        <p class="sub">Reason codes across {lostCount} cases that reinvested nothing.</p>
        <BarChart bars={why} ariaLabel="Reasons for not reinvesting" />
      </section>

      <section class="card wide">
        <h2>Did contact cause it? Chosen vs assigned</h2>
        <p class="sub">
          Every case keeps a flag for whether the advisor chose to contact it. If chosen cases retain far better than
          assigned ones, part of the lift over {pctText(BASELINE_RATE)} is advisors picking likelier wins, not contact
          itself. A fair test compares like with like, such as randomly assigning some contacts.
        </p>
        <BarChart
          bars={choice}
          reference={BASELINE_RATE}
          referenceLabel={baselineLabel}
          ariaLabel="Retention rate for advisor-chosen versus assigned contacts"
        />
      </section>
    </div>

    {#if showTables}
      <div class="tables">
        {#each tables as t}
          <table>
            <caption>{t.title}</caption>
            <thead><tr><th>Group</th><th>{t.col}</th><th>Cases</th></tr></thead>
            <tbody>
              {#each t.bars as b}
                <tr><td>{b.label}</td><td>{pctText(b.value)}</td><td>{b.n}</td></tr>
              {/each}
            </tbody>
          </table>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page {
    width: 100%;
    max-width: 1100px;
  }
  h1 {
    margin: 0 0 12px;
    font-family: var(--heading);
    font-size: 32px; /* 24pt */
    font-weight: 400;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 20px;
    margin-bottom: 16px;
    font-size: 13px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .live {
    margin-left: auto;
    color: var(--muted);
  }
  .stats {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .stat.hero {
    border-color: #111;
    background: #111;
    color: #fff;
  }
  .stat.hero .label {
    color: #c9ccd1;
  }
  .num {
    font-family: var(--heading);
    font-size: 30px;
    font-weight: 400;
    line-height: 1.1;
  }
  .label {
    font-size: 13px;
    color: var(--muted);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .card {
    padding: 16px;
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .card.wide {
    grid-column: 1 / -1;
  }
  h2 {
    margin: 0 0 4px;
    font-family: var(--heading);
    font-size: 18px;
    font-weight: 400;
  }
  .sub {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
  }
  .empty {
    color: var(--muted);
  }
  .tables {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  table {
    border-collapse: collapse;
    background: var(--bg);
    font-size: 13px;
  }
  caption {
    padding: 8px 0;
    font-weight: 600;
    text-align: left;
  }
  th,
  td {
    padding: 6px 10px;
    border: 1px solid var(--border);
    text-align: left;
  }
  th {
    background: var(--panel);
    font-weight: 600;
  }
  @media (max-width: 900px) {
    .grid,
    .stats {
      grid-template-columns: 1fr;
    }
    .live {
      margin-left: 0;
    }
  }
  @media (max-width: 760px) {
    h1 {
      font-size: 26px;
    }
  }
</style>
