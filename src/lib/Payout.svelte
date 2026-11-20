<script lang="ts">
  import { BIG_PAYOUT, formatPayout } from './cases.svelte'

  let { amount }: { amount: number } = $props()
</script>

<span class="payout" class:big={amount >= BIG_PAYOUT} title="${amount.toLocaleString('en-US')} payout">
  {formatPayout(amount)}
</span>

<style>
  .payout {
    display: inline-block;
    min-width: 64px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  /* big cases stand out: solid black block */
  .big {
    border-color: #111;
    background: #111;
    color: #fff;
  }
</style>
