<script lang="ts">
  import { inbox, team, ME, responseLabels, reasonLabels, type Response, type Reason } from './mail.svelte'
  import {
    ui,
    closeDrawer,
    clock,
    dayOf,
    dueDate,
    formatDate,
    formatPayout,
    ageDays,
    routeOf,
    routeReason,
    routeTargets,
    claim,
    overrideRoute,
    assignTo,
    canMarket,
    recordConsent,
    consentSourceLabels,
    templates,
    sendTemplate,
    sendOffer,
    logOutcome,
    todayIso,
    LEGACY_DESK,
    UNCLAIMED_DAYS,
    DEADLINE_DAYS,
    type Template,
  } from './cases.svelte'
  import CountdownChip from './CountdownChip.svelte'
  import Payout from './Payout.svelte'
  import ConsentBadge from './ConsentBadge.svelte'
  import ClaimFormPreview from './ClaimFormPreview.svelte'
  import PaymentLetterPreview from './PaymentLetterPreview.svelte'

  const m = $derived(ui.drawerId == null ? null : (inbox.find((x) => x.id === ui.drawerId) ?? null))

  let preview = $state<'claim-form' | 'letter' | null>(null)
  let flash = $state<string | null>(null)

  // Outcome form: prefilled so logging takes a few seconds.
  let oDate = $state(todayIso())
  let oResponse = $state<Response>('reached')
  let oReinvested = $state<number | null>(null)
  let oReason = $state<Reason | ''>('')
  let oChosen = $state(true)

  // Reset the form whenever a different case opens.
  $effect(() => {
    ui.drawerId
    oDate = todayIso()
    oResponse = 'reached'
    oReinvested = null
    oReason = ''
    oChosen = true
    preview = null
  })

  // Sensible reason default for the response picked.
  $effect(() => {
    if (oResponse === 'no-answer' && !oReason) oReason = 'no-response'
  })

  function say(text: string) {
    flash = text
    setTimeout(() => flash === text && (flash = null), 2000)
  }

  function send(t: Template) {
    if (m && sendTemplate(m, t)) say(`Sent “${t.name}”`)
  }

  function submitOutcome(e: SubmitEvent) {
    e.preventDefault()
    if (!m) return
    const reinvested = Math.max(0, oReinvested ?? 0)
    const fullyRetained = m.payout != null && reinvested >= m.payout
    logOutcome(
      m,
      { date: oDate, response: oResponse, reinvested, reason: fullyRetained ? null : oReason || 'other' },
      oChosen,
    )
    oReinvested = null
    oReason = ''
    say('Outcome saved')
  }

  const fmtStamp = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && !preview && closeDrawer()} />

{#if m}
  {@const day = dayOf(m, clock.now)}
  {@const age = ageDays(m, clock.now)}
  <button class="scrim" aria-label="Close case" onclick={closeDrawer}></button>
  <div class="drawer" role="dialog" aria-modal="true" aria-label="Case {m.policyNo}">
    <header>
      <div class="top">
        <span class="policy">{m.policyNo}</span>
        <button class="close" aria-label="Close" onclick={closeDrawer}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="#111" stroke-width="2" />
          </svg>
        </button>
      </div>
      <h2>{m.subject}</h2>
      <p class="client">{m.from} · opened {formatDate(new Date(m.opened + 'T00:00'))} · due {formatDate(dueDate(m))}</p>
      <div class="chips">
        {#if m.payout != null}<Payout amount={m.payout} />{/if}
        <CountdownChip email={m} mode="day" />
        <ConsentBadge consent={m.consent} />
        {#if m.resolved}<span class="resolved">Resolved</span>{/if}
      </div>
    </header>

    {#if flash}<div class="flash" role="status">{flash}</div>{/if}

    <!-- ownership -->
    <section>
      <h3>Owner</h3>
      {#if m.assignee}
        <p class="owner">
          <strong>{m.assignee === ME ? `${m.assignee} (me)` : m.assignee}</strong> owns this case.
        </p>
      {:else}
        <p class="owner" class:late={age >= UNCLAIMED_DAYS}>
          <strong>Unclaimed</strong> for {age}
          {age === 1 ? 'day' : 'days'}. Routed to <strong>{routeOf(m)}</strong>
          <span class="muted">({routeReason(m)})</span>.
          {#if age >= UNCLAIMED_DAYS}<br />Past {UNCLAIMED_DAYS} days: the manager has been notified.{/if}
        </p>
        <button class="primary" onclick={() => claim(m)}>Claim this case</button>
      {/if}

      <div class="override">
        <span class="override-title">Manager override</span>
        <label>
          <span>Owner</span>
          <select value={m.assignee ?? ''} onchange={(e) => assignTo(m, e.currentTarget.value || null)}>
            <option value="">Unassigned (orphaned queue)</option>
            {#each team as t}<option value={t}>{t === ME ? `${t} (me)` : t}</option>{/each}
          </select>
        </label>
        {#if !m.assignee}
          <label>
            <span>Route to</span>
            <select
              value={m.routeOverride ?? ''}
              onchange={(e) => overrideRoute(m, e.currentTarget.value || null)}
            >
              <option value="">Auto rule ({routeReason({ ...m, routeOverride: null }).replace('auto: ', '')})</option>
              {#each routeTargets as t}
                <option value={t}>{t === LEGACY_DESK ? t : `${t}${t === ME ? ' (me)' : ' (backup advisor)'}`}</option>
              {/each}
            </select>
          </label>
        {/if}
      </div>
    </section>

    <!-- consent -->
    <section>
      <h3>Consent</h3>
      <p>
        <ConsentBadge consent={m.consent} />
        {#if m.consentSource && m.consentAt}
          <span class="muted">via {consentSourceLabels[m.consentSource]} · {fmtStamp(m.consentAt)}{m.consentBy
              ? ` · ${m.consentBy}`
              : ''}</span>
        {:else}
          <span class="muted">Nothing recorded yet.</span>
        {/if}
      </p>
      <div class="row-btns">
        <button onclick={() => recordConsent(m, 'given', 'verbal', ME)}>Record verbal consent</button>
        <button onclick={() => recordConsent(m, 'declined', 'verbal', ME)}>Record verbal decline</button>
      </div>
      <p class="muted small">Verbal consent is saved with today's date and time and your name.</p>
      <div class="capture">
        <button class="link" onclick={() => (preview = 'claim-form')}>Claim form consent checkbox</button>
        <button class="link" onclick={() => (preview = 'letter')}>Payment letter consent link / QR</button>
      </div>
    </section>

    <!-- outreach guardrail -->
    <section>
      <h3>Outreach</h3>
      {#if !canMarket(m)}
        <p class="guard">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z" fill="none" stroke="#111" stroke-width="2" />
          </svg>
          {m.consent === 'declined'
            ? 'The beneficiary declined consent, so marketing outreach and offers are off.'
            : 'Consent isn’t recorded, so marketing outreach and offers are off.'}
          Only claim-support messages can be sent.
        </p>
      {/if}
      <ul class="templates">
        {#each templates as t}
          {@const blocked = t.kind === 'marketing' && !canMarket(m)}
          <li>
            <span>
              {t.name}
              <span class="kind">{t.kind === 'support' ? 'claim support' : 'marketing'}</span>
            </span>
            <button disabled={blocked} title={blocked ? 'Needs recorded consent' : ''} onclick={() => send(t)}>
              Send
            </button>
          </li>
        {/each}
      </ul>
      <button
        class="primary wide"
        disabled={!canMarket(m)}
        onclick={() => m && sendOffer(m) && say('Offer sent')}
      >
        Send offer
      </button>
    </section>

    <!-- outcome -->
    <section>
      <h3>Log outcome</h3>
      <form class="outcome" onsubmit={submitOutcome}>
        <label>
          <span>Contact date</span>
          <input type="date" bind:value={oDate} required />
        </label>
        <label>
          <span>Response</span>
          <select bind:value={oResponse}>
            {#each Object.entries(responseLabels) as [k, v]}<option value={k}>{v}</option>{/each}
          </select>
        </label>
        <label>
          <span>Reinvested</span>
          <input type="number" min="0" step="1000" placeholder="$0" bind:value={oReinvested} />
        </label>
        <label>
          <span>Reason (if not all reinvested)</span>
          <select bind:value={oReason}>
            <option value="">Choose…</option>
            {#each Object.entries(reasonLabels) as [k, v]}<option value={k}>{v}</option>{/each}
          </select>
        </label>
        <label class="check">
          <input type="checkbox" bind:checked={oChosen} />
          <span>I chose to contact this case</span>
        </label>
        <button class="primary" type="submit">Save outcome</button>
      </form>
      <p class="muted small">
        Advisor chose to contact:
        <strong>{m.chosenForContact == null ? 'not recorded yet' : m.chosenForContact ? 'yes' : 'no'}</strong>
      </p>

      {#if m.outcomes.length}
        <ul class="history">
          {#each m.outcomes as o}
            <li>
              <strong>{formatDate(new Date(o.date + 'T00:00'))}</strong> · {responseLabels[o.response]} ·
              {o.reinvested ? `${formatPayout(o.reinvested)} reinvested` : 'nothing reinvested'}
              {#if o.reason}· {reasonLabels[o.reason]}{/if}
              <span class="muted">· day {dayOf(m, new Date(o.date + 'T12:00'))} of {DEADLINE_DAYS}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section>
      <h3>Activity</h3>
      {#if m.activity.length}
        <ul class="history">
          {#each m.activity as a}
            <li><span class="muted">{fmtStamp(a.at)}</span> {a.text}</li>
          {/each}
        </ul>
      {:else}
        <p class="muted small">No activity yet. Day {day} of {DEADLINE_DAYS}.</p>
      {/if}
    </section>
  </div>

  {#if preview === 'claim-form'}
    <ClaimFormPreview email={m} onclose={() => (preview = null)} />
  {:else if preview === 'letter'}
    <PaymentLetterPreview email={m} onclose={() => (preview = null)} />
  {/if}
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    border: none;
    background: rgba(17, 17, 17, 0.3);
  }
  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 61;
    width: min(480px, 100vw);
    overflow-y: auto;
    border-left: 1px solid #111;
    background: var(--bg);
  }
  header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .policy {
    font-size: 12px;
    letter-spacing: 0.5px;
    color: var(--muted);
  }
  .close {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    background: var(--bg);
    cursor: pointer;
  }
  h2 {
    margin: 6px 0 4px;
    font-family: var(--heading);
    font-size: 20px;
    font-weight: 500;
    line-height: 1.3;
  }
  .client {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .resolved {
    padding: 2px 8px;
    border: 1px solid #111;
    font-size: 12px;
  }
  .flash {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 8px 20px;
    background: #111;
    color: #fff;
    font-size: 13px;
  }
  section {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
  }
  h3 {
    margin: 0 0 10px;
    font-family: var(--heading);
    font-size: 16px;
    font-weight: 500;
  }
  p {
    margin: 0 0 10px;
    line-height: 1.5;
  }
  .muted {
    color: var(--muted);
  }
  .small {
    font-size: 12px;
  }
  .owner.late {
    padding: 8px 10px;
    border-left: 4px solid var(--orphaned);
    background: #fbe6e5;
  }
  button {
    font: inherit;
    cursor: pointer;
  }
  .primary {
    height: 40px;
    padding: 0 18px;
    border: 1px solid #111;
    background: #111;
    color: #fff;
    font-weight: 600;
    transition: transform 0.15s;
  }
  .primary:hover:not(:disabled) {
    transform: scale(1.04);
  }
  .primary:disabled {
    border-color: #c9ccd1;
    background: #e5e7eb;
    color: #8b9099;
    cursor: not-allowed;
  }
  .wide {
    width: 100%;
    margin-top: 10px;
  }
  .override {
    display: grid;
    gap: 8px;
    margin-top: 14px;
    padding: 12px;
    border: 1px dashed #c9ccd1;
  }
  .override-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--muted);
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  select,
  input:not([type='checkbox']) {
    height: 38px;
    padding: 0 10px;
    border: 1px solid #c9ccd1;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
  }
  .row-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 6px;
  }
  .row-btns button,
  .templates button {
    height: 34px;
    padding: 0 12px;
    border: 1px solid #c9ccd1;
    background: var(--bg);
    font-size: 13px;
    transition: transform 0.15s, background-color 0.15s;
  }
  .row-btns button:hover,
  .templates button:hover:not(:disabled) {
    transform: scale(1.04);
    background: var(--active);
  }
  .templates button:disabled {
    color: #b0b4ba;
    background: var(--panel);
    cursor: not-allowed;
  }
  .capture {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    margin-top: 6px;
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    font-size: 13px;
    text-decoration: underline;
  }
  .guard {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-left: 4px solid #111;
    background: var(--panel);
    font-size: 13px;
  }
  .guard svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .templates {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--border);
  }
  .templates li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 10px;
  }
  .templates li + li {
    border-top: 1px solid var(--border);
  }
  .kind {
    display: block;
    font-size: 11px;
    color: var(--muted);
  }
  .outcome {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  .outcome .check {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text);
  }
  .outcome .primary {
    grid-column: 1 / -1;
  }
  .history {
    display: grid;
    gap: 6px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    font-size: 13px;
  }

  @media (max-width: 760px) {
    .drawer {
      top: env(safe-area-inset-top);
      border-left: none;
    }
    .outcome {
      grid-template-columns: 1fr;
    }
    select,
    input:not([type='checkbox']) {
      font-size: 16px;
    }
  }
</style>
