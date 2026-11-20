<script lang="ts">
  import type { Category } from './records.svelte'
  import { categoryColors } from './records.svelte'
  import { clock, isAssignedCase, isNewCase, isOrphanedCase, NEW_CASE_DAYS } from './cases.svelte'
  import { inbox } from './mail.svelte'
  import CaseList from './CaseList.svelte'
  import PeopleTable from './PeopleTable.svelte'

  let { category, query = '' }: { category: Category; query?: string } = $props()

  const titles: Record<Category, string> = {
    orphaned: 'Orphaned queue',
    assigned: 'Assigned cases',
    new: 'New cases',
  }
  const blurbs: Record<Category, string> = {
    orphaned: 'Cases with no owner, oldest untouched first. Claim one to make it yours.',
    assigned: 'Every case with an owner, grouped by who owns it.',
    new: `Cases opened in the last ${NEW_CASE_DAYS} days.`,
  }

  const count = $derived.by(() => {
    const now = clock.now
    const test = { orphaned: isOrphanedCase, assigned: isAssignedCase, new: (m: (typeof inbox)[number]) => isNewCase(m, now) }[category]
    return inbox.filter(test).length
  })
</script>

<div class="page">
  <h1><span class="chip" style:background={categoryColors[category]}></span>{titles[category]} <span class="count">({count})</span></h1>
  <p class="blurb">{blurbs[category]}</p>

  <CaseList variant={category} {query} />

  <h2>Clients</h2>
  <PeopleTable {category} {query} />
</div>

<style>
  .page {
    width: 100%;
  }
  h1 {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 4px;
    font-family: var(--heading);
    font-size: 32px; /* 24pt */
    font-weight: 500;
  }
  .chip {
    width: 16px;
    height: 16px;
  }
  .count {
    color: var(--muted);
  }
  .blurb {
    margin: 0 0 14px;
    font-size: 14px;
    color: var(--muted);
  }
  h2 {
    margin: 28px 0 10px;
    font-family: var(--heading);
    font-size: 20px;
    font-weight: 500;
  }
  @media (max-width: 760px) {
    h1 {
      font-size: 26px;
    }
  }
</style>
