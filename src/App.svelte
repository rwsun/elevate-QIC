<script lang="ts">
  import SearchBar from './lib/SearchBar.svelte'
  import Sidebar from './lib/Sidebar.svelte'
  import FollowUps from './lib/FollowUps.svelte'
  import PeopleTable from './lib/PeopleTable.svelte'
  import Calendar from './lib/Calendar.svelte'
  import Inbox from './lib/Inbox.svelte'
  import { followUps, type Page } from './lib/data'

  let active = $state<Page>('home')
  let query = $state('')

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return followUps
    return followUps.filter((t) =>
      [t.from, t.subject, t.preview].some((s) => s.toLowerCase().includes(q)),
    )
  })

  const tiles: { page: Page; color: string }[] = [
    { page: 'assigned', color: 'var(--assigned)' },
    { page: 'new', color: 'var(--new)' },
    { page: 'orphaned', color: 'var(--orphaned)' },
  ]
</script>

<header>
  <SearchBar bind:value={query} />
</header>

<div class="layout">
  <aside>
    <Sidebar bind:active />
  </aside>

  <main class:wide={active !== 'home'}>
    {#if active === 'home'}
      <h1>welcome, rhea</h1>
      <FollowUps threads={filtered} />
      <div class="tiles">
        {#each tiles as tile}
          <button class="tile" style:background={tile.color} onclick={() => (active = tile.page)}>
            {tile.page}
          </button>
        {/each}
      </div>
    {:else if active === 'inbox'}
      <Inbox {query} />
    {:else if active === 'calendar'}
      <Calendar {query} />
    {:else if active === 'assigned' || active === 'new' || active === 'orphaned'}
      <PeopleTable category={active} {query} />
    {:else}
      <h1>{active}</h1>
      <p class="placeholder">Nothing here yet.</p>
    {/if}
  </main>
</div>

<style>
  /* Fluid sizing: every dimension scales with the viewport (mostly height, the
     tighter constraint on laptops) so the whole landing page fits on screen. */
  :global(#app) {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
  }
  header {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    padding: clamp(12px, 3vh, 36px) 16px clamp(8px, 1.5vh, 16px);
    background: var(--bg);
  }
  .layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 200px 1fr;
  }
  aside {
    border-right: 1px solid var(--border);
    overflow-y: auto;
  }
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 0;
    overflow-y: auto;
    padding: clamp(12px, 4vh, 100px) clamp(24px, 5vw, 120px) clamp(12px, 3vh, 60px);
    background: var(--panel);
  }
  main > :global(section) {
    max-width: 1100px;
  }
  main.wide {
    padding: clamp(16px, 4vh, 48px) clamp(16px, 3vw, 48px);
  }
  h1 {
    flex-shrink: 0;
    margin: 0 0 clamp(6px, 2.5vh, 40px);
    font-family: var(--heading);
    font-weight: 500;
    font-size: 32px; /* 24pt */
    line-height: 1.1;
    letter-spacing: -0.5px;
  }
  .tiles {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: clamp(16px, 4vh, 48px);
  }
  .tile {
    min-width: 120px;
    padding: 10px 24px;
    border: none;
    border-radius: 0;
    font-family: var(--sans);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  .tile:hover {
    transform: scale(1.08);
  }
  .tile:active {
    transform: scale(1.02);
  }
  .tile:focus-visible {
    outline: 2px solid var(--text);
    outline-offset: 3px;
  }
  .placeholder {
    color: var(--muted);
  }

  @media (max-width: 860px) {
    :global(#app) {
      height: auto;
    }
    .layout {
      grid-template-columns: 1fr;
    }
    aside {
      padding: 8px 16px;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
    aside :global(nav) {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px;
      padding: 0;
    }
    aside :global(nav button) {
      width: auto;
      transform-origin: center;
    }
    main,
    main.wide {
      padding: 24px 16px;
    }
  }
</style>
