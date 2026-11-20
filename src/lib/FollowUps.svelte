<script lang="ts">
  import type { Thread } from './data'

  let { threads }: { threads: Thread[] } = $props()
  let open = $state(true)
</script>

<section>
  <button class="heading" onclick={() => (open = !open)} aria-expanded={open}>
    <svg class:closed={!open} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    follow up with
  </button>

  {#if open}
    <ul>
      {#each threads as t (t.id)}
        <li>
          <span class="dot" class:unread={t.unread}></span>
          <span class="from">{t.from}</span>
          <span class="body">
            <span class="subject">{t.subject} <span class="count">{t.count}</span></span>
            <span class="preview">{t.preview}</span>
          </span>
          <span class="date">{t.date}</span>
          <span class="icons" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="15" height="15">
              <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 24 24" width="15" height="15">
              <circle cx="5" cy="12" r="1.8" fill="currentColor" />
              <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              <circle cx="19" cy="12" r="1.8" fill="currentColor" />
            </svg>
          </span>
        </li>
      {:else}
        <li class="empty">No matching threads.</li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  section {
    width: 100%;
  }
  .heading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    border: none;
    background: none;
    font-family: var(--heading);
    font-size: 20px;
    cursor: pointer;
  }
  .heading svg {
    transition: transform 0.15s;
  }
  .heading svg.closed {
    transform: rotate(-90deg);
  }
  ul {
    list-style: none;
    margin: clamp(4px, 1vh, 12px) 0 0;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: 14px clamp(120px, 14vw, 220px) minmax(0, 1fr) auto auto;
    align-items: start;
    gap: 12px;
    padding: clamp(5px, 1.1vh, 12px) 8px;
    border-radius: 0;
    font-size: clamp(13px, 1.8vh, 15px);
    cursor: pointer;
    transition: background-color 0.15s;
  }
  li:hover {
    background: #eef0f3;
  }
  .dot {
    width: 10px;
    height: 10px;
    margin-top: 5px;
    border-radius: 0;
  }
  .dot.unread {
    background: var(--unread);
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .subject {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .count {
    display: inline-block;
    padding: 0 4px;
    border: 1px solid var(--border);
    border-radius: 0;
    font-size: 11px;
    font-weight: 400;
    color: var(--muted);
  }
  .preview,
  .date {
    color: var(--muted);
    font-size: 0.87em;
  }
  .preview {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .icons {
    display: flex;
    gap: 10px;
    padding-top: 2px;
    color: #111;
  }
  .empty {
    display: block;
    color: var(--muted);
    cursor: default;
  }
  .empty:hover {
    background: none;
  }
  @media (max-width: 860px) {
    li {
      grid-template-columns: 14px 1fr auto;
    }
    .from {
      grid-column: 2;
      font-weight: 500;
    }
    .body {
      grid-column: 2 / -1;
    }
    .icons {
      display: none;
    }
  }
</style>
