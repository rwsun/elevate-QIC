<script lang="ts">
  import type { Email } from './mail.svelte'
  import { formatPayout, recordConsent } from './cases.svelte'

  let { email, onclose }: { email: Email; onclose: () => void } = $props()

  const url = $derived(`https://elevate.example/consent/${email.policyNo}`)
  const firstName = $derived(email.from.split(/[ ,]/)[0])

  // Placeholder QR pattern (not scannable): three finder squares plus a
  // deterministic pattern from the policy number. Swap in a real QR library later.
  const N = 21
  const cells = $derived.by(() => {
    let h = 0
    for (const ch of email.policyNo) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    const out: [number, number][] = []
    const finder = (x: number, y: number) => x < 7 && y < 7
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (finder(x, y) || finder(N - 1 - x, y) || finder(x, N - 1 - y)) continue
        h = (h * 1103515245 + 12345) >>> 0
        if (h & 0x10000) out.push([x, y])
      }
    return out
  })
  const finders = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ]

  let done = $state(false)
  function simulate() {
    recordConsent(email, 'given', 'payment-letter', 'beneficiary')
    done = true
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<button class="scrim" aria-label="Close preview" onclick={onclose}></button>
<div class="modal" role="dialog" aria-modal="true" aria-label="Payment letter">
  <div class="bar">
    <span>Payment letter preview</span>
    <button class="x" onclick={onclose} aria-label="Close">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="#111" stroke-width="2" /></svg>
    </button>
  </div>
  <div class="letter">
    <p class="meta">Policy {email.policyNo}</p>
    <p>Dear {firstName},</p>
    <p>
      Your life insurance claim has been approved. A payment of
      <strong>{email.payout != null ? formatPayout(email.payout) : 'the policy benefit'}</strong> is on its way.
    </p>
    <p>
      If you would like us to talk you through options for this money, such as reinvesting it, let us know. This is
      optional and has no effect on your payment.
    </p>
    <div class="consent-box">
      <svg viewBox="0 0 {N} {N}" width="92" height="92" aria-label="QR code placeholder" shape-rendering="crispEdges">
        <rect width={N} height={N} fill="#fff" />
        {#each finders as [fx, fy]}
          <rect x={fx} y={fy} width="7" height="7" fill="#111" />
          <rect x={fx + 1} y={fy + 1} width="5" height="5" fill="#fff" />
          <rect x={fx + 2} y={fy + 2} width="3" height="3" fill="#111" />
        {/each}
        {#each cells as [x, y]}<rect {x} {y} width="1" height="1" fill="#111" />{/each}
      </svg>
      <div>
        <strong>Give consent online</strong>
        <span class="url">{url}</span>
        <span class="note">Placeholder QR, not scannable yet.</span>
      </div>
    </div>
  </div>
  <div class="actions">
    {#if done}
      <span>Consent recorded from the letter link.</span>
    {:else}
      <button class="primary" onclick={simulate}>Simulate: beneficiary opens the link and consents</button>
    {/if}
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 70;
    border: none;
    background: rgba(17, 17, 17, 0.45);
  }
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 71;
    width: min(480px, calc(100vw - 32px));
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    transform: translate(-50%, -50%);
    border: 1px solid #111;
    background: var(--bg);
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 8px 8px 16px;
    background: var(--panel);
    font-size: 12px;
    color: var(--muted);
  }
  .x {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    cursor: pointer;
  }
  .letter {
    padding: 20px;
    font-size: 14px;
    line-height: 1.55;
  }
  .letter p {
    margin: 0 0 12px;
  }
  .meta {
    font-size: 12px;
    color: var(--muted);
  }
  .consent-box {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    border: 1px solid #111;
  }
  .consent-box div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .url {
    font-size: 12px;
    word-break: break-all;
  }
  .note {
    font-size: 11px;
    color: var(--muted);
  }
  .actions {
    padding: 0 20px 20px;
    font-size: 13px;
  }
  .primary {
    width: 100%;
    min-height: 42px;
    padding: 8px 12px;
    border: 1px solid #111;
    background: #111;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
</style>
