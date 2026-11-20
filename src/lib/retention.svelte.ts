import { inbox, reasonLabels, type Reason } from './mail.svelte'
import { dayOf, DEADLINE_DAYS } from './cases.svelte'

/** Retention rate the team is benchmarked against. */
export const BASELINE_RATE = 0.32

export type Path = 'on-time' | 'late' | 'orphaned'
export const pathLabels: Record<Path, string> = {
  'on-time': 'Contacted within 30 days',
  late: 'Contacted after day 30',
  orphaned: 'Orphaned first',
}

/** One closed case, reduced to what analytics needs. */
export interface ClosedCase {
  path: Path
  payout: number
  reinvested: number
  reason: Reason | null
  chosen: boolean | null
  sample: boolean
}

// ---- sample history ----
// Illustrative closed cases so the page has something to show before real
// outcomes are logged. Deterministic (seeded), clearly marked as sample.
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const SAMPLE_PLAN: { path: Path; n: number; p: number }[] = [
  { path: 'on-time', n: 42, p: 0.45 },
  { path: 'late', n: 22, p: 0.27 },
  { path: 'orphaned', n: 16, p: 0.13 },
]
const REASON_WEIGHTS: [Reason, number][] = [
  ['needed-cash', 0.42],
  ['own-advisor', 0.27],
  ['no-response', 0.21],
  ['other', 0.1],
]

export const sampleHistory: ClosedCase[] = (() => {
  const rnd = seeded(2026)
  const out: ClosedCase[] = []
  for (const { path, n, p } of SAMPLE_PLAN) {
    for (let i = 0; i < n; i++) {
      const payout = Math.round((50_000 + rnd() * 750_000) / 10_000) * 10_000
      const chosen = path === 'orphaned' ? rnd() < 0.35 : rnd() < 0.65
      // advisors pick likelier wins: a small bump for chosen cases (the selection effect to test for)
      const retained = rnd() < p + (chosen ? 0.06 : -0.05)
      let reason: Reason | null = null
      if (!retained) {
        let r = rnd()
        reason = REASON_WEIGHTS.find(([, w]) => (r -= w) < 0)?.[0] ?? 'other'
      }
      const reinvested = retained ? Math.round((payout * (0.35 + rnd() * 0.65)) / 1000) * 1000 : 0
      out.push({ path, payout, reinvested, reason, chosen, sample: true })
    }
  }
  return out
})()

// ---- live cases ----

/** Cases with at least one logged outcome, classified by path. */
export function liveClosed(): ClosedCase[] {
  return inbox
    .filter((m) => m.payout != null && m.outcomes.length)
    .map((m) => {
      const first = m.outcomes[m.outcomes.length - 1]
      const firstDay = dayOf(m, new Date(first.date + 'T12:00'))
      const path: Path = m.wasOrphaned ? 'orphaned' : firstDay <= DEADLINE_DAYS ? 'on-time' : 'late'
      const reinvested = m.outcomes.reduce((s, o) => s + o.reinvested, 0)
      return {
        path,
        payout: m.payout!,
        reinvested,
        reason: reinvested > 0 ? null : (m.outcomes[0].reason ?? 'other'),
        chosen: m.chosenForContact,
        sample: false,
      }
    })
}

// ---- metrics ----

export const rate = (cases: ClosedCase[]) =>
  cases.length ? cases.filter((c) => c.reinvested > 0).length / cases.length : 0

export function byPath(cases: ClosedCase[]) {
  return (Object.keys(pathLabels) as Path[]).map((p) => {
    const group = cases.filter((c) => c.path === p)
    return { key: p, label: pathLabels[p], n: group.length, value: rate(group) }
  })
}

export function reasons(cases: ClosedCase[]) {
  const lost = cases.filter((c) => c.reinvested === 0)
  return (Object.keys(reasonLabels) as Reason[])
    .map((r) => ({
      key: r,
      label: reasonLabels[r],
      n: lost.filter((c) => c.reason === r).length,
      value: lost.length ? lost.filter((c) => c.reason === r).length / lost.length : 0,
    }))
    .sort((a, b) => b.n - a.n)
}

export function byChoice(cases: ClosedCase[]) {
  const contacted = cases.filter((c) => c.path !== 'orphaned' || c.chosen != null)
  return [
    { key: 'chosen', label: 'Advisor chose to contact', group: contacted.filter((c) => c.chosen === true) },
    { key: 'not', label: 'Assigned, not chosen', group: contacted.filter((c) => c.chosen === false) },
  ].map(({ key, label, group }) => ({ key, label, n: group.length, value: rate(group) }))
}

