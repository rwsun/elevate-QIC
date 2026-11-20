<script lang="ts" module>
  export interface Bar {
    key: string
    label: string
    value: number
    n: number
    /** Replaces the default "n cases" text in the tooltip. */
    note?: string
  }
</script>

<script lang="ts">
  // Single-series horizontal bar chart: label on the left, value labelled at the
  // bar end, optional reference line (e.g. the 32% baseline), hover tooltip.

  let {
    bars,
    max = 1,
    format = (v: number) => `${Math.round(v * 100)}%`,
    reference = null,
    referenceLabel = '',
    unit = 'cases',
    ariaLabel,
  }: {
    bars: Bar[]
    max?: number
    format?: (v: number) => string
    reference?: number | null
    referenceLabel?: string
    unit?: string
    ariaLabel: string
  } = $props()

  let hover = $state<string | null>(null)
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`
</script>

<div class="chart" role="img" aria-label={ariaLabel}>
  {#each bars as b (b.key)}
    <div
      class="row"
      role="presentation"
      onmouseenter={() => (hover = b.key)}
      onmouseleave={() => (hover = null)}
    >
      <span class="label">{b.label}</span>
      <span class="track">
        <span class="bar" class:dim={hover && hover !== b.key} style:width={pct(b.value)}></span>
        {#if reference != null}
          <span class="ref" style:left={pct(reference)} aria-hidden="true"></span>
        {/if}
        <span class="value" style:left={pct(b.value)}>{format(b.value)}</span>
        {#if hover === b.key}
          <span class="tip" style:left={pct(b.value)}>
            <strong>{b.label}</strong>
            {format(b.value)} · {b.note ?? `${b.n} ${unit}`}
            {#if reference != null}
              <br />{b.value >= reference ? '+' : ''}{Math.round((b.value - reference) * 100)} pts vs {referenceLabel}
            {/if}
          </span>
        {/if}
      </span>
    </div>
  {/each}
  {#if reference != null}
    <div class="ref-key"><span class="ref-swatch" aria-hidden="true"></span>{referenceLabel}</div>
  {/if}
</div>

<style>
  .chart {
    display: grid;
    gap: 10px;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(120px, 34%) 1fr;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
  }
  .label {
    font-size: 13px;
    color: var(--text);
  }
  .track {
    position: relative;
    height: 22px;
    margin-right: 48px; /* room for the value label */
  }
  .bar {
    position: absolute;
    left: 0;
    top: 3px;
    bottom: 3px;
    min-width: 2px;
    background: #7d9440;
    transition: opacity 0.12s;
  }
  .bar.dim {
    opacity: 0.45;
  }
  .ref {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 0;
    border-left: 2px dashed #111;
  }
  .value {
    position: absolute;
    top: 50%;
    padding-left: 6px;
    transform: translateY(-50%);
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    white-space: nowrap;
  }
  .tip {
    position: absolute;
    bottom: calc(100% + 8px);
    z-index: 5;
    padding: 6px 10px;
    transform: translateX(-50%);
    border: 1px solid #111;
    background: var(--bg);
    font-size: 12px;
    line-height: 1.4;
    white-space: nowrap;
    pointer-events: none;
  }
  .ref-key {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
  }
  .ref-swatch {
    width: 0;
    height: 14px;
    border-left: 2px dashed #111;
  }
  @media (max-width: 760px) {
    .row {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
