<script lang="ts">
  import { pageIcons, type Page } from './data'

  let { active = $bindable('home') }: { active?: Page } = $props()

  const tabs: { page: Page; label: string }[] = [
    { page: 'home', label: 'Home' },
    { page: 'inbox', label: 'Inbox' },
    { page: 'follow-ups', label: 'Follow-ups' },
    { page: 'calendar', label: 'Calendar' },
  ]
  const more: Page[] = ['assigned', 'new', 'orphaned', 'manager']

  let sheetOpen = $state(false)
  const moreActive = $derived(more.includes(active))

  function go(p: Page) {
    active = p
    sheetOpen = false
  }
</script>

{#snippet glyph(d: string)}
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path {d} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
{/snippet}

{#if sheetOpen}
  <button class="scrim" aria-label="Close menu" onclick={() => (sheetOpen = false)}></button>
  <div class="sheet" role="dialog" aria-label="More pages">
    <div class="grabber" aria-hidden="true"></div>
    {#each more as p}
      <button class="sheet-item" class:active={active === p} onclick={() => go(p)}>
        {@render glyph(pageIcons[p])}
        <span>{p === 'manager' ? 'manager view' : p}</span>
        <svg class="chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
    {/each}
  </div>
{/if}

<nav class="tabbar" aria-label="Main">
  {#each tabs as t}
    <button class:active={active === t.page} aria-current={active === t.page ? 'page' : undefined} onclick={() => go(t.page)}>
      {@render glyph(pageIcons[t.page])}
      <span>{t.label}</span>
    </button>
  {/each}
  <button class:active={moreActive || sheetOpen} aria-expanded={sheetOpen} onclick={() => (sheetOpen = !sheetOpen)}>
    {@render glyph('M4 7h16M4 12h16M4 17h16')}
    <span>More</span>
  </button>
</nav>

<style>
  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding-bottom: env(safe-area-inset-bottom);
    border-top: 1px solid var(--border);
    background: var(--bg);
  }
  .tabbar button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 0 10px;
    border: none;
    border-top: 3px solid transparent;
    background: none;
    color: var(--muted);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
  }
  .tabbar button.active {
    border-top-color: #111;
    color: #111;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 41;
    border: none;
    background: rgba(17, 17, 17, 0.35);
  }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 42;
    padding: 8px 0 calc(16px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--text);
    background: var(--bg);
  }
  .grabber {
    width: 40px;
    height: 4px;
    margin: 0 auto 8px;
    background: #c9ccd1;
  }
  .sheet-item {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 16px 20px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: none;
    font-size: 16px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }
  .sheet-item.active {
    background: var(--active);
  }
  .chev {
    margin-left: auto;
    color: var(--muted);
  }
</style>
