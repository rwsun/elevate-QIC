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
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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
    gap: 10px;
    width: min(520px, 100%);
    padding: 10px 20px;
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
    font-size: 18px;
    color: var(--text);
  }
  input::placeholder {
    color: var(--muted);
  }
  input::-webkit-search-cancel-button {
    display: none;
  }
  kbd {
    font-family: var(--sans);
    font-size: 15px;
    color: var(--muted);
  }
</style>
