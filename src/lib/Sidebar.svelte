<script lang="ts">
  import { pageIcons as icons, type Page } from './data'

  let { active = $bindable('home') }: { active?: Page } = $props()

  type Item = { page: Page; label: string; icon: string }
  const item = (page: Page, label: string = page, icon: Page = page): Item => ({ page, label, icon: icons[icon] })

  const groups: { heading: string | null; items: Item[] }[] = [
    {
      heading: null,
      items: (['home', 'inbox', 'follow-ups', 'calendar', 'assigned', 'new', 'orphaned'] as Page[]).map((p) => item(p)),
    },
    // Manager tools: the overdue/escalation view is the manager's "home".
    { heading: 'manager', items: [item('manager', 'home', 'home'), item('analytics')] },
  ]
</script>

<nav>
  {#each groups as g}
    {#if g.heading}<span class="heading">{g.heading}</span>{/if}
    {#each g.items as { page, label, icon }}
    <button class:active={active === page} aria-current={active === page ? 'page' : undefined} onclick={() => (active = page)}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d={icon}
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {label}
    </button>
    {/each}
  {/each}
</nav>

<style>
  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 8px;
  }
  .heading {
    margin: 18px 0 4px;
    padding: 0 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--muted);
  }
  button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 7px 12px;
    border: none;
    border-radius: 0;
    background: transparent;
    text-align: left;
    font-family: var(--body);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transform-origin: left center;
    transition:
      transform 0.15s ease,
      background-color 0.15s ease;
  }
  svg {
    flex-shrink: 0;
    color: var(--muted);
  }
  button:hover {
    transform: scale(1.04);
    background: var(--panel);
  }
  button.active {
    background: var(--active);
  }
  button.active svg {
    color: var(--text);
  }
  button:focus-visible {
    outline: 2px solid #8a9a4f;
    outline-offset: -2px;
  }
</style>
