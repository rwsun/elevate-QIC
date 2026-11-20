<script lang="ts">
  import type { Email } from './mail.svelte'
  import { beneficiaryName, logActivity, recordConsent } from './cases.svelte'

  let { email, onclose }: { email: Email; onclose: () => void } = $props()

  // The form edits its own copy of the name, prefilled from the case when it opens.
  let name = $state('')
  $effect.pre(() => {
    if (!name) name = beneficiaryName(email) ?? ''
  })
  let agree = $state(false)
  let submitted = $state(false)

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (agree) recordConsent(email, 'given', 'claim-form', name || 'beneficiary')
    else logActivity(email, 'Claim form submitted without the contact consent box ticked')
    submitted = true
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<button class="scrim" aria-label="Close preview" onclick={onclose}></button>
<div class="modal" role="dialog" aria-modal="true" aria-label="Beneficiary claim form">
  <div class="bar">
    <span>Beneficiary view · claim form</span>
    <button class="x" onclick={onclose} aria-label="Close">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="#111" stroke-width="2" /></svg>
    </button>
  </div>

  {#if submitted}
    <div class="done">
      <h3>Claim submitted</h3>
      <p>{agree ? 'Consent was recorded on the case.' : 'No consent was given; the case still allows claim-support messages only.'}</p>
      <button class="primary" onclick={onclose}>Back to case</button>
    </div>
  {:else}
    <form onsubmit={submit}>
      <h3>Life insurance claim</h3>
      <label><span>Your full name</span><input bind:value={name} required /></label>
      <label><span>Policy number</span><input value={email.policyNo} readonly /></label>
      <label><span>Relationship to the policyholder</span>
        <select><option>Spouse or partner</option><option>Child</option><option>Parent</option><option>Other</option></select>
      </label>
      <label class="consent">
        <input type="checkbox" bind:checked={agree} />
        <span>
          You may contact me about options for my payout, such as reinvesting it. This is optional, does not affect my
          claim, and I can withdraw it at any time.
        </span>
      </label>
      <button class="primary" type="submit">Submit claim</button>
    </form>
  {/if}
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
    width: min(440px, calc(100vw - 32px));
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
  form,
  .done {
    display: grid;
    gap: 12px;
    padding: 16px;
  }
  h3 {
    margin: 0;
    font-family: var(--heading);
    font-size: 20px;
    font-weight: 400;
  }
  p {
    margin: 0;
    font-size: 14px;
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  input:not([type='checkbox']),
  select {
    height: 40px;
    padding: 0 10px;
    border: 1px solid #c9ccd1;
    background: var(--bg);
    color: var(--text);
    font-size: 16px;
  }
  .consent {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--border);
    font-size: 13px;
    color: var(--text);
    line-height: 1.45;
  }
  .consent input {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .primary {
    height: 42px;
    border: 1px solid #111;
    background: #111;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
</style>
