<script lang="ts">
  import type { Email } from './mail.svelte'
  import { DEADLINE_DAYS, clock, dayOf, dueDate, formatDate, phase, phaseColor } from './cases.svelte'

  let { email, mode = 'left' }: { email: Email; mode?: 'day' | 'left' } = $props()

  const day = $derived(dayOf(email, clock.now))
  const left = $derived(DEADLINE_DAYS - day)
  const colors = $derived(phaseColor[phase(email, clock.now)])
  const text = $derived.by(() => {
    if (left < 0) return `${-left} ${-left === 1 ? 'day' : 'days'} overdue`
    if (mode === 'day') return `Day ${day} of ${DEADLINE_DAYS}`
    return left === 0 ? 'Due today' : `${left} ${left === 1 ? 'day' : 'days'} left`
  })
</script>

<span
  class="countdown"
  class:overdue={left < 0}
  style:background={colors.tint}
  title="Day {day} of {DEADLINE_DAYS} · due {formatDate(dueDate(email))}"
>
  {text}
</span>

<style>
  .countdown {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    color: #111;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }
  .overdue {
    font-weight: 700;
  }
</style>
