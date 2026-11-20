<script lang="ts">
  import { events, type CalEvent } from './events'
  import { records, categoryColors, type Category } from './records.svelte'

  let { query = '' }: { query?: string } = $props()

  const FIRST_HOUR = 8
  const LAST_HOUR = 19 // grid ends at 7pm
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)
  const categories: Category[] = ['assigned', 'new', 'orphaned']
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // ---- date helpers (all local time) ----
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
  const startOfWeek = (d: Date) => addDays(startOfDay(d), -d.getDay())
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const sameDay = (a: Date, b: Date) => iso(a) === iso(b)

  let now = $state(new Date())
  $effect(() => {
    const t = setInterval(() => (now = new Date()), 60_000)
    return () => clearInterval(t)
  })
  const today = $derived(startOfDay(now))

  let weekStart = $state(startOfWeek(new Date()))
  let miniMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  let hidden = $state(new Set<Category>())

  const days = $derived(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)))

  const title = $derived.by(() => {
    const a = days[0]
    const b = days[6]
    const fmt = (d: Date, withYear: boolean) =>
      d.toLocaleDateString('en-US', { month: 'long', ...(withYear ? { year: 'numeric' } : {}) })
    if (a.getMonth() === b.getMonth()) return fmt(a, true)
    if (a.getFullYear() === b.getFullYear())
      return `${a.toLocaleDateString('en-US', { month: 'short' })} – ${b.toLocaleDateString('en-US', { month: 'short' })} ${b.getFullYear()}`
    return `${fmt(a, true)} – ${fmt(b, true)}`
  })

  const miniDays = $derived.by(() => {
    const start = startOfWeek(miniMonth)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  })

  function categoryOf(person: string): Category {
    for (const c of categories) if (records[c].some((p) => p.name === person)) return c
    return 'new'
  }

  const visible = $derived.by(() => {
    const q = query.trim().toLowerCase()
    return events
      .map((e) => ({ ...e, category: categoryOf(e.person) }))
      .filter((e) => !hidden.has(e.category))
      .map((e) => ({
        ...e,
        dimmed: !!q && ![e.title, e.person, e.where ?? ''].some((s) => s.toLowerCase().includes(q)),
      }))
  })

  const eventsOn = (d: Date, timed: boolean) =>
    visible.filter((e) => e.date === iso(d) && (e.start != null) === timed)

  const hasAllDay = $derived(days.some((d) => eventsOn(d, false).length > 0))

  const nowOffset = $derived(now.getHours() + now.getMinutes() / 60 - FIRST_HOUR)
  const showNow = $derived(nowOffset >= 0 && nowOffset <= LAST_HOUR - FIRST_HOUR)

  function fmtHour(h: number) {
    const hr = h % 12 === 0 ? 12 : h % 12
    return `${hr} ${h < 12 ? 'AM' : 'PM'}`
  }

  function fmtTime(t: number, suffix: boolean) {
    const h = Math.floor(t)
    const m = Math.round((t - h) * 60)
    const hr = h % 12 === 0 ? 12 : h % 12
    return `${hr}${m ? ':' + String(m).padStart(2, '0') : ''}${suffix ? (h < 12 ? 'am' : 'pm') : ''}`
  }

  function fmtRange(e: CalEvent) {
    const s = e.start!
    const en = e.end!
    const samePeriod = s < 12 === en < 12
    return `${fmtTime(s, !samePeriod)} – ${fmtTime(en, true)}`
  }

  function goToday() {
    weekStart = startOfWeek(new Date())
    miniMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  }

  function shiftWeek(n: number) {
    weekStart = addDays(weekStart, 7 * n)
    miniMonth = new Date(weekStart.getFullYear(), addDays(weekStart, 3).getMonth(), 1)
  }

  function pickDay(d: Date) {
    weekStart = startOfWeek(d)
  }

  function toggleCategory(c: Category) {
    const next = new Set(hidden)
    next.has(c) ? next.delete(c) : next.add(c)
    hidden = next
  }
</script>

<div class="cal">
  <div class="toolbar">
    <button class="btn" onclick={goToday}>Today</button>
    <div class="arrows">
      <button class="icon" onclick={() => shiftWeek(-1)} aria-label="Previous week">‹</button>
      <button class="icon" onclick={() => shiftWeek(1)} aria-label="Next week">›</button>
    </div>
    <h2>{title}</h2>
    <span class="view-label">Week</span>
  </div>

  <div class="body">
    <aside class="side">
      <div class="mini">
        <div class="mini-head">
          <span>{miniMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span>
            <button
              class="icon small"
              aria-label="Previous month"
              onclick={() => (miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1))}>‹</button
            >
            <button
              class="icon small"
              aria-label="Next month"
              onclick={() => (miniMonth = new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 1))}>›</button
            >
          </span>
        </div>
        <div class="mini-grid">
          {#each DAY_NAMES as n}<span class="dow">{n[0]}</span>{/each}
          {#each miniDays as d}
            <button
              class="mini-day"
              class:other={d.getMonth() !== miniMonth.getMonth()}
              class:in-week={d >= weekStart && d < addDays(weekStart, 7)}
              class:today={sameDay(d, today)}
              onclick={() => pickDay(d)}
            >
              {d.getDate()}
            </button>
          {/each}
        </div>
      </div>

      <div class="legend">
        <h3>Calendars</h3>
        {#each categories as c}
          <label>
            <input type="checkbox" checked={!hidden.has(c)} onchange={() => toggleCategory(c)} />
            <span class="box" style:--c={categoryColors[c]}></span>
            {c}
          </label>
        {/each}
      </div>
    </aside>

    <div class="week">
      <div class="week-head">
        <div class="gutter tz">GMT-5</div>
        {#each days as d}
          <div class="day-head" class:is-today={sameDay(d, today)}>
            <span class="dname">{DAY_NAMES[d.getDay()]}</span>
            <span class="dnum">{d.getDate()}</span>
          </div>
        {/each}
      </div>

      {#if hasAllDay}
        <div class="allday-row">
          <div class="gutter"></div>
          {#each days as d}
            <div class="allday-cell">
              {#each eventsOn(d, false) as e (e.id)}
                <div
                  class="chip"
                  class:dimmed={e.dimmed}
                  style:background={categoryColors[e.category]}
                  title="{e.title} – {e.person}"
                >
                  {e.title} – {e.person.split(' ')[0]}
                </div>
              {/each}
            </div>
          {/each}
        </div>
      {/if}

      <div class="grid-scroll">
        <div class="grid">
          <div class="gutter hours">
            {#each hours as h, i}
              <span class="hour-label" style:top="calc(var(--h) * {i})">{i === 0 ? '' : fmtHour(h)}</span>
            {/each}
          </div>
          {#each days as d}
            <div class="col" class:is-today={sameDay(d, today)}>
              {#each hours as _}<div class="slot"></div>{/each}
              {#each eventsOn(d, true) as e (e.id)}
                {@const short = e.end! - e.start! <= 0.5}
                <div
                  class="event"
                  class:short
                  class:dimmed={e.dimmed}
                  style:top="calc(var(--h) * {e.start! - FIRST_HOUR})"
                  style:height="calc(var(--h) * {e.end! - e.start!} - 2px)"
                  style:background={categoryColors[e.category]}
                  title="{e.title} – {e.person}, {fmtRange(e)}"
                >
                  {#if short}
                    <span class="ev-title">{e.title}, {fmtTime(e.start!, true)}</span>
                  {:else}
                    <span class="ev-title">{e.title}</span>
                    <span class="ev-line">{e.person}</span>
                    <span class="ev-line meta">{fmtRange(e)}{e.where ? ` · ${e.where}` : ''}</span>
                  {/if}
                </div>
              {/each}
              {#if showNow && sameDay(d, today)}
                <div class="now" style:top="calc(var(--h) * {nowOffset})"></div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Phone: week as an agenda list (a 7-column grid doesn't fit) -->
  <div class="agenda">
    {#each days as d}
      {@const dayEvents = [...eventsOn(d, false), ...eventsOn(d, true)]}
      <section class="agenda-day" class:is-today={sameDay(d, today)}>
        <h3>
          <span class="a-dow">{DAY_NAMES[d.getDay()]}</span>
          <span class="a-num">{d.getDate()}</span>
          {#if sameDay(d, today)}<span class="a-today">Today</span>{/if}
        </h3>
        {#each dayEvents as e (e.id)}
          <div class="a-event" class:dimmed={e.dimmed} style:--c={categoryColors[e.category]}>
            <span class="a-time">{e.start == null ? 'All day' : fmtRange(e)}</span>
            <span class="a-title">{e.title}</span>
            <span class="a-meta">{e.person}{e.where ? ` · ${e.where}` : ''}</span>
          </div>
        {:else}
          <p class="a-none">No meetings</p>
        {/each}
      </section>
    {/each}
  </div>
</div>

<style>
  .cal {
    --h: clamp(40px, 7vh, 64px);
    --line: var(--border);
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    background: var(--bg);
    border: 1px solid var(--line);
  }
  button {
    border-radius: 0;
  }

  /* ---- toolbar ---- */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: clamp(8px, 1.5vh, 14px) 16px;
    border-bottom: 1px solid var(--line);
  }
  .btn {
    padding: 6px 18px;
    border: 1px solid var(--text);
    background: var(--bg);
    font-size: 15px;
    cursor: pointer;
    transition: transform 0.15s, background-color 0.15s;
  }
  .btn:hover {
    transform: scale(1.05);
    background: var(--active);
  }
  .arrows {
    display: flex;
  }
  .icon {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  .icon:hover {
    background: var(--panel);
  }
  .icon.small {
    width: 24px;
    height: 24px;
    font-size: 18px;
  }
  h2 {
    margin: 0;
    font-family: var(--heading);
    font-size: 20px;
    font-weight: 500;
  }
  .view-label {
    margin-left: auto;
    padding: 6px 16px;
    border: 1px solid var(--line);
    font-size: 14px;
  }

  /* ---- layout ---- */
  .body {
    display: grid;
    grid-template-columns: 190px 1fr;
    flex: 1;
    min-height: 0;
  }
  .side {
    padding: 16px;
    border-right: 1px solid var(--line);
    overflow-y: auto;
  }

  /* ---- mini month ---- */
  .mini-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
  .mini-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    font-size: 11px;
    text-align: center;
  }
  .dow {
    padding: 4px 0;
    color: var(--muted);
  }
  .mini-day {
    aspect-ratio: 1;
    padding: 0;
    border: none;
    background: none;
    font-size: 11px;
    cursor: pointer;
  }
  .mini-day:hover {
    background: var(--panel);
  }
  .mini-day.other {
    color: #b0b4ba;
  }
  .mini-day.in-week {
    background: #f1f4e0;
  }
  .mini-day.today {
    background: var(--assigned);
    font-weight: 600;
  }

  /* ---- legend ---- */
  .legend {
    margin-top: 24px;
  }
  .legend h3 {
    margin: 0 0 8px;
    font-family: var(--heading);
    font-size: 14px;
    font-weight: 500;
  }
  .legend label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
    font-size: 14px;
    cursor: pointer;
  }
  .legend input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .box {
    position: relative;
    width: 16px;
    height: 16px;
    border: 2px solid var(--c);
  }
  .legend input:checked + .box {
    background: var(--c);
  }
  .legend input:checked + .box::after {
    content: '';
    position: absolute;
    left: 3px;
    top: 0;
    width: 4px;
    height: 8px;
    border: solid #111;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  .legend input:focus-visible + .box {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }

  /* ---- week grid ---- */
  .week {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .week-head,
  .allday-row,
  .grid {
    display: grid;
    /* weekends get half-width columns so weekday meetings have room */
    grid-template-columns: 56px minmax(0, 0.5fr) repeat(5, minmax(0, 1fr)) minmax(0, 0.5fr);
  }
  .week-head {
    border-bottom: 1px solid var(--line);
    /* keep columns aligned with the scrollbar-carrying grid below */
    scrollbar-gutter: stable;
    overflow: hidden;
  }
  .gutter {
    position: relative;
  }
  .tz {
    align-self: end;
    padding: 0 6px 6px 0;
    font-size: 10px;
    color: var(--muted);
    text-align: right;
  }
  .day-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: clamp(4px, 1vh, 10px) 0;
  }
  .dname {
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .dnum {
    display: grid;
    place-items: center;
    width: clamp(32px, 5vh, 44px);
    height: clamp(32px, 5vh, 44px);
    font-size: clamp(18px, 3vh, 26px);
  }
  .day-head.is-today .dname {
    color: var(--text);
    font-weight: 600;
  }
  .day-head.is-today .dnum {
    background: var(--assigned);
    font-weight: 600;
  }

  .allday-row {
    border-bottom: 1px solid var(--line);
    scrollbar-gutter: stable;
    overflow: hidden;
  }
  .allday-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 3px 2px;
    border-left: 1px solid var(--line);
  }
  .chip {
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .grid-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }
  .grid {
    height: calc(var(--h) * 11);
  }
  .hour-label {
    position: absolute;
    right: 8px;
    transform: translateY(-50%);
    font-size: 10px;
    color: var(--muted);
    white-space: nowrap;
  }
  .col {
    position: relative;
    border-left: 1px solid var(--line);
  }
  .col.is-today {
    background: #fbfcf6;
  }
  .slot {
    height: var(--h);
    border-bottom: 1px solid var(--line);
  }

  .event {
    position: absolute;
    left: 2px;
    right: 4px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px 6px;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.25;
    color: #111;
    border-left: 3px solid rgba(0, 0, 0, 0.18);
    cursor: pointer;
    transition: transform 0.15s ease;
    transform-origin: center;
  }
  .event:hover {
    z-index: 2;
    transform: scale(1.04);
  }
  .ev-title,
  .ev-line {
    flex-shrink: 0;
  }
  .ev-title {
    font-weight: 600;
  }
  .ev-title,
  .ev-line {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ev-line.meta {
    color: rgba(17, 17, 17, 0.7);
  }
  .event.short {
    justify-content: center;
    padding-top: 1px;
    padding-bottom: 1px;
  }
  .dimmed {
    opacity: 0.25;
  }

  .now {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 3;
    height: 2px;
    background: var(--unread);
    pointer-events: none;
  }
  .now::before {
    content: '';
    position: absolute;
    left: -5px;
    top: -4px;
    width: 10px;
    height: 10px;
    background: var(--unread);
  }

  @media (max-width: 1340px) {
    .body {
      grid-template-columns: 1fr;
    }
    .side {
      display: none;
    }
  }

  .agenda {
    display: none;
  }
  @media (max-width: 760px) {
    .cal {
      border: none;
      background: none;
    }
    .toolbar {
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 0 12px;
      border-bottom: none;
    }
    h2 {
      order: -1;
      width: 100%;
      font-size: 22px;
    }
    .view-label {
      display: none;
    }
    .body {
      display: none;
    }
    .agenda {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .agenda-day {
      border: 1px solid var(--border);
      background: var(--bg);
    }
    .agenda-day h3 {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 0;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-family: var(--heading);
      font-size: 16px;
      font-weight: 500;
    }
    .a-dow {
      font-size: 12px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--muted);
    }
    .a-num {
      font-size: 20px;
    }
    .agenda-day.is-today h3 {
      background: var(--active);
    }
    .a-today {
      margin-left: auto;
      font-size: 12px;
      font-weight: 600;
    }
    .a-event {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      gap: 2px 12px;
      padding: 10px 14px;
      border-left: 4px solid var(--c);
      border-bottom: 1px solid var(--border);
    }
    .a-event:last-child {
      border-bottom: none;
    }
    .a-time {
      grid-row: span 2;
      font-size: 13px;
      color: var(--muted);
    }
    .a-title {
      font-weight: 600;
      font-size: 14px;
    }
    .a-meta {
      font-size: 13px;
      color: var(--muted);
    }
    .a-none {
      margin: 0;
      padding: 10px 14px;
      font-size: 13px;
      color: var(--muted);
    }
  }
</style>
