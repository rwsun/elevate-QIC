<script lang="ts">
  let { value = $bindable('') }: { value?: string } = $props()
  let input: HTMLInputElement

  function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      input.focus()
      input.select()
    } else if (e.key === 'Escape' && document.activeElement === input) {
      value = ''
      input.blur()
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<label class="search">
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
  <input bind:this={input} bind:value type="search" placeholder="Search..." aria-label="Search" />
  <kbd>⌘ K</kbd>
</label>

<style>
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(360px, 100%);
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 0;
    background: var(--bg);
    color: var(--muted);
    transition: border-color 0.2s;
    cursor: text;
  }
  .search:focus-within {
    border-color: var(--text);
  }
  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    font-size: 14px;
    color: var(--text);
  }
  input::placeholder {
    color: var(--muted);
  }
  input::-webkit-search-cancel-button {
    display: none;
  }
  kbd {
    font-family: var(--body);
    font-size: 12px;
    color: var(--muted);
  }

  @media (max-width: 760px) {
    .search {
      width: 100%;
    }
    input {
      font-size: 16px;
    }
    kbd {
      display: none;
    }
  }
</style>
