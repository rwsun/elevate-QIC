<script lang="ts">
  import { pageIcons as icons, type Page } from './data'

  let { active = $bindable('home') }: { active?: Page } = $props()

  const pages: Page[] = ['home', 'inbox', 'follow-ups', 'calendar', 'assigned', 'new', 'orphaned', 'manager']
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
