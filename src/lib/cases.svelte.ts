import { SvelteSet } from 'svelte/reactivity'
import { inbox, team, ME, DEADLINE_DAYS, AMBER_AFTER_DAY, RED_AFTER_DAY, type Email } from './mail.svelte'
import { records } from './records.svelte'

/** Receives day-30 escalations and reminders for unassigned cases. */
export const MANAGER = 'Rhea Manek'
/** Days on which in-app + email reminders go out. Day 30 also flags the manager. */
export const REMINDER_DAYS = [15, 25, 30] as const
/** Payouts at or above this are highlighted as big cases. */
export const BIG_PAYOUT = 500_000

// One shared clock so every page agrees on "today".
export const clock = $state({ now: new Date() })
setInterval(() => (clock.now = new Date()), 60_000)

const DAY = 86_400_000
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const openedAt = (m: Email) => new Date(m.opened + 'T00:00')

/** Day 1 is the day the case opened; day 30 is the deadline. */
export const dayOf = (m: Email, now = clock.now) => Math.round((midnight(now) - openedAt(m).getTime()) / DAY) + 1
export const daysLeft = (m: Email, now = clock.now) => DEADLINE_DAYS - dayOf(m, now)
export const dueDate = (m: Email) => new Date(openedAt(m).getTime() + (DEADLINE_DAYS - 1) * DAY)

export type Phase = 'green' | 'amber' | 'red'
export function phase(m: Email, now = clock.now): Phase {
  const d = dayOf(m, now)
  if (d > RED_AFTER_DAY) return 'red'
  if (d > AMBER_AFTER_DAY) return 'amber'
  return 'green'
}
export const phaseColor: Record<Phase, { tint: string; solid: string }> = {
  green: { tint: '#eef3dc', solid: 'var(--assigned)' },
  amber: { tint: '#fdf1dc', solid: 'var(--new)' },
  red: { tint: '#fbe6e5', solid: 'var(--orphaned)' },
}

export const isCase = (m: Email) => m.payout != null && !m.resolved
/** Day 30 or later: flagged for the manager. */
export const isEscalated = (m: Email, now = clock.now) => isCase(m) && dayOf(m, now) >= DEADLINE_DAYS
export const isOverdue = (m: Email, now = clock.now) => isCase(m) && daysLeft(m, now) < 0

export const openCases = () => inbox.filter(isCase)

/**
 * "Most urgent": overdue first, then the red, amber and green phases.
 * Inside each phase the biggest payout comes first, then fewest days left.
 */
function urgencyTier(m: Email) {
  if (daysLeft(m) < 0) return 0
  return { red: 1, amber: 2, green: 3 }[phase(m)]
}
export const byUrgency = (a: Email, b: Email) =>
  urgencyTier(a) - urgencyTier(b) || (b.payout ?? 0) - (a.payout ?? 0) || daysLeft(a) - daysLeft(b)

export function formatPayout(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`
  return `$${Math.round(n / 1000)}K`
}
export const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** The beneficiary's name if the case is from a known person (not a department), else null. */
export function beneficiaryName(m: Email) {
  for (const list of Object.values(records)) {
    const p = list.find((x) => x.name && m.from.includes(x.name.split(' ')[0]))
    if (p) return p.name
  }
  return null
}

export function emailOf(name: string) {
  for (const list of Object.values(records)) {
    const p = list.find((x) => x.name === name)
    if (p?.email) return p.email
  }
  return null
}

// ---- reminders ----

export interface Reminder {
  key: string
  caseId: number
  subject: string
  /** 15, 25 or 30 for scheduled reminders; null for a manual nudge. */
  day: number | null
  date: Date
  recipients: string[]
  text: string
  escalation: boolean
}

/** Manual "nudge" reminders sent from the follow-ups or manager pages. */
export const nudges: Reminder[] = $state([])
/** Reminder keys the viewer has already seen in the in-app bell. */
export const readReminders = new SvelteSet<string>()

function scheduledText(day: number, subject: string) {
  if (day === 15) return `Day 15 of 30: halfway to the deadline on “${subject}”`
  if (day === 25) return `Day 25 of 30: 5 days left on “${subject}”`
  return `Day 30: “${subject}” is due and has been flagged for the manager`
}

/** Every reminder that has gone out so far, newest first. */
export function allReminders(now = clock.now): Reminder[] {
  const open = openCases()
  const out: Reminder[] = []
  for (const m of open) {
    const d = dayOf(m, now)
    for (const r of REMINDER_DAYS) {
      if (d < r) continue
      const owner = m.assignee ?? MANAGER
      const recipients = r === 30 ? [...new Set([owner, MANAGER])] : [owner]
      out.push({
        key: `${m.id}-d${r}`,
        caseId: m.id,
        subject: m.subject,
        day: r,
        date: new Date(openedAt(m).getTime() + (r - 1) * DAY + 9 * 3_600_000), // 9am that day
        recipients,
        text: scheduledText(r, m.subject),
        escalation: r === 30,
      })
    }
  }
  // Orphaned cases nobody claims within UNCLAIMED_DAYS notify the manager.
  for (const m of open) {
    if (m.assignee || ageDays(m, now) < UNCLAIMED_DAYS) continue
    out.push({
      key: `${m.id}-unclaimed-${m.touched}`,
      caseId: m.id,
      subject: m.subject,
      day: null,
      date: new Date(midnight(new Date(m.touched)) + UNCLAIMED_DAYS * DAY + 9 * 3_600_000),
      recipients: [MANAGER],
      text: `Unclaimed for ${UNCLAIMED_DAYS}+ days: “${m.subject}” is still in the orphaned queue`,
      escalation: true,
    })
  }
  out.push(...nudges.filter((n) => open.some((m) => m.id === n.caseId)))
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const remindersFor = (m: Email) => allReminders().filter((r) => r.caseId === m.id)

export function sendNudge(m: Email) {
  const to = m.assignee ?? MANAGER
  nudges.push({
    key: `${m.id}-nudge-${Date.now()}`,
    caseId: m.id,
    subject: m.subject,
    day: null,
    date: new Date(),
    recipients: [to],
    text: `Reminder: please follow up on “${m.subject}” (${Math.max(0, daysLeft(m))} days left)`,
    escalation: false,
  })
}

export { DEADLINE_DAYS, AMBER_AFTER_DAY, RED_AFTER_DAY }

// ---- case drawer ----

export const ui = $state({ drawerId: null as number | null })
export const openDrawer = (m: Email) => (ui.drawerId = m.id)
export const closeDrawer = () => (ui.drawerId = null)

// ---- activity ----

const nowIso = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export const todayIso = () => nowIso().slice(0, 10)

/** Record an action on the case and reset its "untouched" age. */
export function logActivity(m: Email, text: string) {
  const at = nowIso()
  m.activity.unshift({ at, text })
  m.touched = at
}

// ---- orphaned routing ----

export const LEGACY_DESK = 'Legacy Desk'
export const BACKUP_ADVISOR = 'Ren Sun'
/** Orphaned cases at or above this payout auto-route to the backup advisor; the rest go to the Legacy Desk. */
export const BACKUP_MIN_PAYOUT = 300_000
/** Unclaimed this many days: row turns red and the manager is notified. */
export const UNCLAIMED_DAYS = 3
/** "New" cases opened within this many days. */
export const NEW_CASE_DAYS = 7

export const routeTargets = [LEGACY_DESK, ...team.filter((t) => t !== ME), ME]

export const autoRoute = (m: Email) => ((m.payout ?? 0) >= BACKUP_MIN_PAYOUT ? BACKUP_ADVISOR : LEGACY_DESK)
export const routeOf = (m: Email) => m.routeOverride ?? autoRoute(m)
export const routeReason = (m: Email) =>
  m.routeOverride
    ? 'manager override'
    : (m.payout ?? 0) >= BACKUP_MIN_PAYOUT
      ? `auto: payout ${formatPayout(BACKUP_MIN_PAYOUT)}+ goes to backup advisor`
      : `auto: payout under ${formatPayout(BACKUP_MIN_PAYOUT)} goes to the Legacy Desk`

/** Calendar days since anyone last acted on the case. */
export const ageDays = (m: Email, now = clock.now) =>
  Math.max(0, Math.round((midnight(now) - midnight(new Date(m.touched))) / DAY))

export const isOrphanedCase = (m: Email) => isCase(m) && !m.assignee
export const isAssignedCase = (m: Email) => isCase(m) && !!m.assignee
export const isNewCase = (m: Email, now = clock.now) => isCase(m) && dayOf(m, now) <= NEW_CASE_DAYS

export function claim(m: Email, who = ME) {
  m.assignee = who
  logActivity(m, `Claimed by ${who}`)
}

/** Manager override: send an orphaned case to a desk, or assign it to a person outright. */
export function overrideRoute(m: Email, target: string | null) {
  if (target === null) {
    m.routeOverride = null
    logActivity(m, `Routing reset to auto rule (${autoRoute(m)})`)
  } else if (target === LEGACY_DESK) {
    m.routeOverride = LEGACY_DESK
    logActivity(m, `Manager routed to ${LEGACY_DESK}`)
  } else {
    m.routeOverride = target
    logActivity(m, `Manager routed to ${target}`)
  }
}

export function assignTo(m: Email, who: string | null) {
  if (!who) m.wasOrphaned = true
  m.assignee = who
  logActivity(m, who ? `Assigned to ${who} by manager` : 'Unassigned, back to the orphaned queue')
}

// ---- consent ----

export const consentLabels: Record<Email['consent'], string> = {
  given: 'Consent given',
  'not-requested': 'Not requested',
  declined: 'Declined',
}
export const consentSourceLabels = {
  'claim-form': 'claim form checkbox',
  'payment-letter': 'payment letter link',
  verbal: 'verbal, recorded by advisor',
} as const

export const canMarket = (m: Email) => m.consent === 'given'

export function recordConsent(
  m: Email,
  value: 'given' | 'declined',
  source: 'claim-form' | 'payment-letter' | 'verbal',
  by: string,
) {
  m.consent = value
  m.consentSource = source
  m.consentAt = nowIso()
  m.consentBy = by
  logActivity(m, `Consent ${value === 'given' ? 'given' : 'declined'} via ${consentSourceLabels[source]}`)
}

export const templates = [
  { id: 'docs', name: 'Claim documents checklist', kind: 'support' },
  { id: 'status', name: 'Payment status update', kind: 'support' },
  { id: 'help', name: 'Beneficiary paperwork help', kind: 'support' },
  { id: 'options', name: 'Options for your payout', kind: 'marketing' },
  { id: 'review', name: 'Book a planning review', kind: 'marketing' },
  { id: 'term', name: 'Term life offer for beneficiaries', kind: 'marketing' },
] as const
export type Template = (typeof templates)[number]

export function sendTemplate(m: Email, t: Template) {
  if (t.kind === 'marketing' && !canMarket(m)) return false
  logActivity(m, `Sent “${t.name}” to ${m.from}`)
  return true
}

export function sendOffer(m: Email) {
  if (!canMarket(m)) return false
  logActivity(m, `Sent reinvestment offer to ${m.from}`)
  return true
}

// ---- outcomes ----

export function logOutcome(m: Email, o: Omit<Email['outcomes'][number], 'by' | 'loggedAt'>, chosen: boolean) {
  m.outcomes.unshift({ ...o, by: ME, loggedAt: nowIso() })
  if (m.chosenForContact === null) m.chosenForContact = chosen
  logActivity(m, `Outcome logged: ${o.response}${o.reinvested ? `, ${formatPayout(o.reinvested)} reinvested` : ''}`)
}
