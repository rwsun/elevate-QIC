<script lang="ts">
  import type { Consent } from './mail.svelte'
  import { consentLabels } from './cases.svelte'

  let { consent }: { consent: Consent } = $props()

  const paths: Record<Consent, string> = {
    given: 'M5 12.5l4.5 4.5L19 7.5',
    'not-requested': 'M6 12h12',
    declined: 'M7 7l10 10M17 7 7 17',
  }
</script>

<span class="consent {consent}" title="Marketing consent: {consentLabels[consent]}">
  <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
    <path d={paths[consent]} fill="none" stroke="#111" stroke-width="3" stroke-linecap="square" />
  </svg>
  {consentLabels[consent]}
</span>

<style>
  .consent {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 22px;
    padding: 0 8px;
    border: 1px solid;
    color: #111;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }
  .given {
    border-color: var(--assigned);
    background: #eef3dc;
  }
  .not-requested {
    border-color: #c9ccd1;
    background: var(--bg);
  }
  .declined {
    border-color: var(--orphaned);
    background: #fbe6e5;
  }
</style>
