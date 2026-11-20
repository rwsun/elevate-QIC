<script lang="ts">
  import type { Page } from './data'

  let { active = $bindable('home') }: { active?: Page } = $props()

  // 16px stroke icons (24-unit viewBox).
  const icons: Record<Page, string> = {
    home: 'M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10',
    inbox: 'M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6z',
    'follow-ups': 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4M12 8v4l3 2',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
    assigned: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-1a6 6 0 0 1 11-3.3M15 18l2 2 4-4',
    new: 'M12 5v14M5 12h14',
    orphaned: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-1a6 6 0 0 1 11-3.3M16 15l5 5M21 15l-5 5',
  }

  const pages: Page[] = ['home', 'inbox', 'follow-ups', 'calendar', 'assigned', 'new', 'orphaned']
</script>

<nav>
  {#each pages as page}
    <button class:active={active === page} onclick={() => (active = page)}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d={icons[page]}
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {page}
    </button>
  {/each}
</nav>

<style>
  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 8px;
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
    font-family: var(--sans);
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
