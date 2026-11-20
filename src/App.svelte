<script lang="ts">
  import SearchBar from './lib/SearchBar.svelte'
  import Sidebar from './lib/Sidebar.svelte'
  import MobileNav from './lib/MobileNav.svelte'
  import NotificationBell from './lib/NotificationBell.svelte'
  import Home from './lib/Home.svelte'
  import Inbox from './lib/Inbox.svelte'
  import FollowUpsPage from './lib/FollowUpsPage.svelte'
  import Calendar from './lib/Calendar.svelte'
  import CategoryPage from './lib/CategoryPage.svelte'
  import Analytics from './lib/Analytics.svelte'
  import CaseDrawer from './lib/CaseDrawer.svelte'
  import ManagerView from './lib/ManagerView.svelte'
  import type { Page } from './lib/data'

  let active = $state<Page>('home')
  let query = $state('')
  let main: HTMLElement

  function navigate(page: Page) {
    active = page
  }

  // New page starts at the top (matters on phones, where the page itself scrolls).
  $effect(() => {
    active
    main?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  })
</script>

<header>
  <span class="brand">elevate</span>
  <div class="search"><SearchBar bind:value={query} /></div>
  <div class="header-right"><NotificationBell onnavigate={navigate} /></div>
</header>

<div class="layout">
  <aside>
    <Sidebar bind:active />
  </aside>

  <main bind:this={main} class:wide={active !== 'home'}>
    {#if active === 'home'}
      <Home {query} onnavigate={navigate} />
    {:else if active === 'inbox'}
      <Inbox {query} />
    {:else if active === 'follow-ups'}
      <FollowUpsPage {query} />
    {:else if active === 'calendar'}
      <Calendar {query} />
    {:else if active === 'manager'}
      <ManagerView {query} />
    {:else if active === 'analytics'}
      <Analytics />
    {:else}
      <CategoryPage category={active} {query} />
    {/if}
  </main>
</div>

<div class="mobile-nav"><MobileNav bind:active /></div>

<CaseDrawer />

<style>
  /* Desktop: everything fits in the viewport; each page scrolls inside itself. */
  :global(#app) {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
  }
  header {
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(10px, 2vh, 24px) 16px clamp(8px, 1.2vh, 12px);
    background: var(--bg);
  }
  .search {
    display: flex;
    justify-content: center;
    width: min(360px, 100%);
  }
  .brand {
    display: none;
  }
  .header-right {
    position: absolute;
    right: 24px;
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
    padding: clamp(12px, 4vh, 72px) clamp(24px, 5vw, 120px) clamp(12px, 3vh, 48px);
    background: var(--panel);
  }
  main.wide {
    padding: clamp(16px, 4vh, 48px) clamp(16px, 3vw, 48px);
  }
  .mobile-nav {
    display: none;
  }

  /* Tablet: keep the sidebar but tighten spacing. */
  @media (max-width: 1100px) and (min-width: 761px) {
    .layout {
      grid-template-columns: 170px 1fr;
    }
    .header-right {
      right: 16px;
    }
  }

  /* Phone: banking-app layout. Sticky top bar, page scrolls, bottom tab bar. */
  @media (max-width: 760px) {
    :global(#app) {
      height: auto;
      min-height: 100dvh;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 30;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      padding: calc(10px + env(safe-area-inset-top)) 16px 10px;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: block;
      font-family: var(--heading);
      font-size: 22px;
      font-weight: 400;
    }
    .header-right {
      position: static;
    }
    .search {
      order: 3;
      width: 100%;
    }
    .layout {
      display: block;
    }
    aside {
      display: none;
    }
    main,
    main.wide {
      display: block;
      overflow: visible;
      padding: 16px 16px calc(88px + env(safe-area-inset-bottom));
    }
    .mobile-nav {
      display: block;
    }
  }
</style>
