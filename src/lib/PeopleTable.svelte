<script lang="ts">
  import { tick } from 'svelte'
  import { records, addPerson, removePeople, categoryColors, type Category, type Person } from './records.svelte'

  let { category, query = '' }: { category: Category; query?: string } = $props()

  type SortKey = 'name' | 'email' | 'age' | 'country' | 'lastContact'
  const columns: { key: SortKey; label: string; icon: string }[] = [
    { key: 'name', label: 'Name', icon: 'A' },
    { key: 'email', label: 'Email', icon: '@' },
    { key: 'age', label: 'Age', icon: '#' },
    { key: 'country', label: 'Country', icon: '◎' },
    { key: 'lastContact', label: 'Last call / follow-up', icon: '▦' },
  ]

  let sortKey = $state<SortKey | null>(null)
  let sortDir = $state<1 | -1>(1)
  let selected = $state(new Set<number>())
  let table: HTMLTableElement

  // Reset selection when switching category.
  $effect(() => {
    category
    selected = new Set()
  })

  const rows = $derived.by(() => {
    const q = query.trim().toLowerCase()
    let list = records[category].filter(
      (p) => !q || [p.name, p.email, p.country, String(p.age ?? '')].some((s) => s.toLowerCase().includes(q)),
    )
    if (sortKey) {
      const k = sortKey
      list = [...list].sort((a, b) => {
        const av = a[k] ?? ''
        const bv = b[k] ?? ''
        // Empty values always sink to the bottom.
        if (av === '' && bv !== '') return 1
        if (bv === '' && av !== '') return -1
        return (av < bv ? -1 : av > bv ? 1 : 0) * sortDir
      })
    }
    return list
  })

  const avgAge = $derived.by(() => {
    const ages = rows.map((p) => p.age).filter((a): a is number => a != null)
    return ages.length ? (ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(1) : '—'
  })

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      sortKey = key
      sortDir = 1
    } else if (sortDir === 1) {
      sortDir = -1
    } else {
      sortKey = null
    }
  }

  function toggle(id: number) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    selected = next
  }

  function toggleAll() {
    selected = selected.size === rows.length ? new Set() : new Set(rows.map((p) => p.id))
  }

  function deleteSelected() {
    removePeople(category, selected)
    selected = new Set()
  }

  async function add() {
    const p = addPerson(category)
    await tick()
    table.querySelector<HTMLInputElement>(`[data-row="${p.id}"] input[name="name"]`)?.focus()
  }

  function daysSince(iso: string): number | null {
    if (!iso) return null
    const then = new Date(iso + 'T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return Math.round((now.getTime() - then.getTime()) / 86_400_000)
  }

  function ageLabel(days: number) {
    if (days <= 0) return 'today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  function setAge(p: Person, value: string) {
    p.age = value === '' ? null : Number(value)
  }
</script>

<div class="view">
  <div class="toolbar">
    <h2>
      <span class="chip" style:background={categoryColors[category]}></span>
      {category}
    </h2>
    <div class="actions">
      {#if selected.size}
        <button class="danger" onclick={deleteSelected}>Delete {selected.size}</button>
      {/if}
      <button onclick={add}>+ Add person</button>
    </div>
  </div>

  <div class="scroll">
    <table bind:this={table}>
      <thead>
        <tr>
          <th class="check">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={rows.length > 0 && selected.size === rows.length}
              onchange={toggleAll}
            />
          </th>
          {#each columns as col}
            <th>
              <button class="sort" onclick={() => toggleSort(col.key)}>
                <span class="icon">{col.icon}</span>
                {col.label}
                {#if sortKey === col.key}<span class="dir">{sortDir === 1 ? '↑' : '↓'}</span>{/if}
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as p, i (p.id)}
          {@const days = daysSince(p.lastContact)}
          <tr data-row={p.id} class:selected={selected.has(p.id)}>
            <td class="check">
              <span class="num">{i + 1}</span>
              <input type="checkbox" aria-label="Select row" checked={selected.has(p.id)} onchange={() => toggle(p.id)} />
            </td>
            <td><input name="name" bind:value={p.name} placeholder="Name" /></td>
            <td class="email-cell"><input type="email" bind:value={p.email} placeholder="name@queensu.ca" /></td>
            <td>
              <input
                type="number"
                min="0"
                class="numeric"
                value={p.age ?? ''}
                oninput={(e) => setAge(p, e.currentTarget.value)}
              />
            </td>
            <td><input bind:value={p.country} /></td>
            <td>
              <div class="date">
                <input type="date" bind:value={p.lastContact} />
                {#if days != null}
                  <span class="since" class:stale={days > 30}>{ageLabel(days)}</span>
                {:else}
                  <span class="since none">never</span>
                {/if}
              </div>
            </td>
          </tr>
        {:else}
          <tr><td class="empty" colspan="6">{query ? 'No matches.' : 'No one here yet.'}</td></tr>
        {/each}
        <tr class="add-row">
          <td colspan="6"><button onclick={add} aria-label="Add person">+</button></td>
        </tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>{rows.length} {rows.length === 1 ? 'person' : 'people'}</span>
    <span>Avg age {avgAge}</span>
  </footer>
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 0;
    background: var(--bg);
    overflow: hidden;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-family: var(--heading);
    font-weight: 500;
    font-size: 20px;
  }
  .chip {
    width: 14px;
    height: 14px;
    border-radius: 0;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .actions button {
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 0;
    background: var(--bg);
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.15s, background-color 0.15s;
  }
  .actions button:hover {
    transform: scale(1.05);
    background: var(--panel);
  }
  .actions .danger {
    color: #b42318;
    border-color: #f3c3bf;
  }
  .scroll {
    overflow-x: auto;
  }
  table {
    width: 100%;
    min-width: 900px;
    border-collapse: collapse;
    font-size: 14px;
  }
  th,
  td {
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 0;
    text-align: left;
  }
  th:last-child,
  td:last-child {
    border-right: none;
  }
  th {
    background: var(--panel);
    font-weight: 500;
  }
  .sort {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 9px 12px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .sort:hover {
    background: #eef0f3;
  }
  .icon {
    width: 14px;
    color: var(--muted);
    font-size: 12px;
    text-align: center;
  }
  .dir {
    margin-left: auto;
    color: var(--muted);
  }
  .check {
    width: 56px;
    text-align: center;
  }
  td.check {
    position: relative;
  }
  .num {
    color: var(--muted);
    font-size: 12px;
  }
  td.check input {
    position: absolute;
    inset: 0;
    margin: auto;
    opacity: 0;
  }
  tr:hover td.check input,
  tr.selected td.check input {
    opacity: 1;
  }
  tr:hover td.check .num,
  tr.selected td.check .num {
    visibility: hidden;
  }
  tbody tr:hover {
    background: #fafbfc;
  }
  tr.selected {
    background: #f4f7e6;
  }
  td input:not([type='checkbox']) {
    width: 100%;
    padding: 9px 12px;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
  }
  td input:not([type='checkbox']):focus {
    outline: 2px solid #8a9a4f;
    outline-offset: -2px;
    background: var(--bg);
  }
  .email-cell {
    width: 30%;
    min-width: 260px;
  }
  .numeric {
    text-align: right;
  }
  .date {
    display: flex;
    align-items: center;
  }
  .date input {
    flex: 1;
  }
  .since {
    flex-shrink: 0;
    padding: 0 12px;
    color: var(--muted);
    font-size: 12px;
  }
  .since.stale {
    color: #b42318;
  }
  .empty {
    padding: 16px;
    color: var(--muted);
  }
  .add-row button {
    width: 56px;
    padding: 6px 0;
    border: none;
    background: none;
    color: var(--muted);
    font-size: 18px;
    cursor: pointer;
  }
  .add-row button:hover {
    color: var(--text);
  }
  footer {
    display: flex;
    gap: 24px;
    padding: 8px 16px;
    background: var(--panel);
    color: var(--muted);
    font-size: 12px;
  }
</style>
