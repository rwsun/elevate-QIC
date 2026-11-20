export const ME = 'Rhea Manek'
/** People an email can be assigned to. */
export const team = ['Rhea Manek', 'Ren Sun']

/** Every thread has this many days to be resolved, counted from when it opened. */
export const DEADLINE_DAYS = 30
/** Countdown chip turns amber after this day, and red after RED_AFTER_DAY. */
export const AMBER_AFTER_DAY = 15
export const RED_AFTER_DAY = 25

/** Consent to contact the beneficiary about anything beyond claim support. */
export type Consent = 'given' | 'not-requested' | 'declined'
export type ConsentSource = 'claim-form' | 'payment-letter' | 'verbal'

export type Response = 'reached' | 'no-answer' | 'declined'
export const responseLabels: Record<Response, string> = {
  reached: 'Reached',
  'no-answer': 'No answer',
  declined: 'Declined',
}
export type Reason = 'needed-cash' | 'own-advisor' | 'no-response' | 'other'
export const reasonLabels: Record<Reason, string> = {
  'needed-cash': 'Needed the cash',
  'own-advisor': 'Moved to own advisor',
  'no-response': 'No response',
  other: 'Other',
}

export interface Outcome {
  /** yyyy-mm-dd */
  date: string
  response: Response
  /** Dollars reinvested with us; 0 if none. */
  reinvested: number
  /** Why the payout (or part of it) was not reinvested. null when fully retained. */
  reason: Reason | null
  by: string
  loggedAt: string
}

export interface ActivityEntry {
  at: string
  text: string
}

export const labels = ['Term life', 'Whole life', 'Beneficiary', 'Billing', 'Underwriting', 'Claims', 'Renewal'] as const
export type Label = (typeof labels)[number]

export interface Email {
  id: number
  from: string
  /** Number of messages in the thread; shown after the subject when > 1. */
  count: number
  subject: string
  preview: string
  /** Local ISO date-time of the latest incoming message. */
  received: string
  /** Local ISO date the thread was opened; the deadline countdown starts here. */
  opened: string
  unread: boolean
  following: boolean
  /** null = brand new, nobody has picked it up yet. */
  assignee: string | null
  labels: Label[]
  /** false once someone has replied to the latest message. */
  awaitingReply: boolean
  /** Flags the thread red no matter how long it has waited. */
  urgent: boolean
  /** Optional black line icon shown after the subject. */
  icon?: 'cake'
  /** Policy payout in dollars. null = not a case (internal notes, billing notices). */
  payout: number | null
  /** Closed cases drop out of follow-ups, reminders and the manager view. */
  resolved: boolean
  policyNo: string
  consent: Consent
  consentSource: ConsentSource | null
  /** ISO date-time consent was recorded (given or declined). */
  consentAt: string | null
  consentBy: string | null
  /** ISO date-time of the last action anyone took on the case; drives "age" in the orphaned queue. */
  touched: string
  /** Manager override for orphaned routing. null = use the auto-assignment rule. */
  routeOverride: string | null
  /** True if the case ever sat in the orphaned queue (an analytics path). */
  wasOrphaned: boolean
  /** Did the advisor choose to contact this case? Kept to test whether contact is causal. */
  chosenForContact: boolean | null
  outcomes: Outcome[]
  activity: ActivityEntry[]
}

let id = 1
interface Opts {
  opened: string
  consent?: Consent
  consentSource?: ConsentSource
  consentAt?: string
  consentBy?: string
  wasOrphaned?: boolean
  payout?: number
  icon?: 'cake'
  unread?: boolean
  count?: number
  following?: boolean
  labels?: Label[]
  replied?: boolean
  urgent?: boolean
}
const mail = (
  from: string,
  subject: string,
  preview: string,
  received: string,
  assignee: string | null,
  { opened, consent = 'not-requested', consentSource, consentAt, consentBy, wasOrphaned, payout, icon, unread = false, count = 1, following = false, labels = [], replied = false, urgent = false }: Opts,
): Email => ({
  id: id++,
  from,
  count,
  subject,
  preview,
  received,
  opened,
  unread,
  following,
  assignee,
  labels,
  awaitingReply: !replied,
  urgent,
  icon,
  payout: payout ?? null,
  resolved: false,
  policyNo: `LP-${20400 + id}`,
  consent,
  consentSource: consentSource ?? null,
  consentAt: consentAt ?? null,
  consentBy: consentBy ?? null,
  touched: received,
  routeOverride: null,
  wasOrphaned: wasOrphaned ?? assignee === null,
  chosenForContact: null,
  outcomes: [],
  activity: [],
})

// Placeholder mail only. Two birthday notes for Rhea are tucked in among the
// policy threads: one in a subject, one in a preview line.
export const inbox: Email[] = $state([
  mail(
    'Victoria Biancaniello',
    'Re: Term life insurance quote',
    'Thanks for sending the 20-year term comparison! Would raising the coverage to $500k change the monthly premium much?',
    '2026-11-20T09:36',
    ME,
    { opened: '2026-11-09', consent: 'given', consentSource: 'claim-form', consentAt: '2026-11-10T10:05', consentBy: 'Victoria Biancaniello', payout: 500_000, unread: true, count: 4, following: true, labels: ['Term life'] },
  ),
  mail(
    'Policy Desk',
    'Your life insurance policy documents are ready',
    'Policy LP-20418 has been issued. Download your contract, schedule of benefits and beneficiary summary from the portal.',
    '2026-11-20T09:11',
    null,
    { opened: '2026-11-20', payout: 250_000, unread: true, labels: ['Underwriting'] },
  ),
  mail(
    'Angelina Tang',
    'Booking a call to discuss whole life vs. term',
    'Hi! Would Thursday at 2pm work for a quick call? I want to understand the cash value on a whole life policy first.',
    '2026-11-20T08:42',
    null,
    { opened: '2026-11-18', payout: 300_000, unread: true, count: 2, labels: ['Whole life'] },
  ),
  mail(
    'Ren Sun',
    'happy birthday rhea!',
    'Hope you have the best day. Cake in the office at 3, act surprised!',
    '2026-11-20T08:05',
    ME,
    { opened: '2026-11-20', unread: true, icon: 'cake' },
  ),
  mail(
    'Underwriting Team',
    'Medical exam results received for life insurance application',
    "Victoria Biancaniello's paramedical results are in and the file has moved to final underwriting review.",
    '2026-11-19T07:29',
    'Ren Sun',
    { opened: '2026-11-03', consent: 'given', consentSource: 'verbal', consentAt: '2026-11-12T14:20', consentBy: 'Ren Sun', payout: 350_000, labels: ['Underwriting'] },
  ),
  mail(
    'Anuththi Nishaharan',
    'Beneficiary change form for my life insurance policy',
    'Attached is the signed form adding my sister as a secondary beneficiary. Let me know if anything else is needed.',
    '2026-11-17T07:13',
    ME,
    { opened: '2026-10-25', consent: 'declined', consentSource: 'claim-form', consentAt: '2026-10-27T09:40', consentBy: 'Anuththi Nishaharan', payout: 400_000, count: 3, labels: ['Beneficiary'] },
  ),
  mail(
    'Premium Billing',
    'Life insurance premium reminder: due Dec 1',
    'Your monthly premium of $42.18 for policy LP-19877 is due on December 1. Set up autopay to avoid a lapse in coverage.',
    '2026-11-19T16:20',
    null,
    { opened: '2026-11-11', labels: ['Billing'] },
  ),
  mail(
    'Ren Sun',
    'Whole life policy illustration for your review',
    'Here is the updated illustration with cash value projections at 20, 30 and 40 years. Flagged two assumptions to double-check.',
    '2026-11-19T14:02',
    ME,
    { opened: '2026-11-05', consent: 'given', consentSource: 'payment-letter', consentAt: '2026-11-08T18:12', consentBy: 'beneficiary', payout: 750_000, following: true, labels: ['Whole life'] },
  ),
  mail(
    'Claims Support',
    'Life insurance claim checklist for beneficiaries',
    'A quick reference for the documents beneficiaries need when filing a claim, plus typical processing times.',
    '2026-11-19T10:45',
    'Ren Sun',
    { opened: '2026-11-15', payout: 1_000_000, labels: ['Claims'], replied: true },
  ),
  mail(
    'Angelina Tang',
    'Re: Riders & add-ons on my life insurance policy',
    'Is the critical illness rider worth it if I already have some coverage through school? Also curious about the waiver of premium.',
    '2026-11-16T11:30',
    'Ren Sun',
    { opened: '2026-10-30', consent: 'given', consentSource: 'claim-form', consentAt: '2026-11-01T11:30', consentBy: 'Angelina Tang', payout: 300_000, count: 2, labels: ['Term life'] },
  ),
  mail(
    'Victoria Biancaniello, Anuththi',
    'Life insurance policy renewal checklist',
    'Renewal list attached: updated health questions, beneficiary confirmation, payment method. PS happy birthday rhea! We signed the card first',
    '2026-11-18T15:10',
    null,
    { opened: '2026-10-26', payout: 200_000, count: 5, labels: ['Renewal'] },
  ),
  mail(
    'Policy Desk',
    'Annual life insurance policy statement',
    'Your 2026 statement is ready. Coverage amount $250,000, premiums paid to date and current beneficiary details inside.',
    '2026-11-18T09:00',
    'Ren Sun',
    { opened: '2026-11-17', consent: 'given', consentSource: 'payment-letter', consentAt: '2026-11-18T08:55', consentBy: 'beneficiary', payout: 250_000, labels: ['Billing'], replied: true },
  ),
  mail(
    'Underwriting Team',
    'Application received: term life insurance policy',
    "We've received Angelina Tang's application. Next step is a 20-minute phone interview to confirm health history.",
    '2026-11-18T08:15',
    'Ren Sun',
    { opened: '2026-11-12', consent: 'declined', consentSource: 'verbal', consentAt: '2026-11-13T15:02', consentBy: 'Ren Sun', payout: 300_000, labels: ['Underwriting'] },
  ),
  mail(
    'Beneficiary Services',
    'Please confirm your life insurance beneficiary designation',
    'Our records show one primary beneficiary and no contingent beneficiary. Review and confirm within 30 days.',
    '2026-11-17T13:40',
    null,
    { opened: '2026-10-23', payout: 150_000, labels: ['Beneficiary'], urgent: true },
  ),
  mail(
    'Anuththi Nishaharan',
    'Picking my life insurance policy back up',
    "Sorry for going quiet! I'm ready to restart the application. Can we go over the coverage amount again?",
    '2026-11-13T17:05',
    'Ren Sun',
    { opened: '2026-10-19', consent: 'not-requested', wasOrphaned: true, payout: 400_000, following: true, labels: ['Term life'] },
  ),
  mail(
    'Premium Billing',
    'Payment received: life insurance policy LP-20418',
    'Thank you, your premium payment of $38.50 has been applied. Your coverage remains active through December 17.',
    '2026-11-17T08:30',
    'Ren Sun',
    { opened: '2026-11-16', labels: ['Billing'], replied: true },
  ),
  mail(
    'Angelina Tang',
    'Quick question on term life policy length',
    "Is a 20-year term long enough if I'm planning to buy a house in the next five years, or should I look at 30?",
    '2026-11-16T19:22',
    ME,
    { opened: '2026-11-07', consent: 'given', consentSource: 'verbal', consentAt: '2026-11-09T16:45', consentBy: 'Rhea Manek', payout: 600_000, labels: ['Term life'] },
  ),
  mail(
    'Policy Desk',
    'Term conversion option on your life insurance policy',
    'Your term policy can be converted to permanent coverage without a new medical exam until age 65. Here is how it works.',
    '2026-11-16T10:00',
    null,
    { opened: '2026-11-01', payout: 250_000, labels: ['Term life'] },
  ),
  mail(
    'Victoria Biancaniello',
    'Is life insurance worth it as a student?',
    'A few friends said I am too young to need a policy. What would you tell someone in their first year of university?',
    '2026-11-15T12:48',
    'Ren Sun',
    { opened: '2026-11-13', consent: 'given', consentSource: 'claim-form', consentAt: '2026-11-14T13:10', consentBy: 'Victoria Biancaniello', payout: 100_000, labels: ['Term life'], replied: true },
  ),
  mail(
    'Ren Sun',
    'Weekly life insurance pipeline',
    'Four new leads, two applications in underwriting, one policy issued. The orphaned list still needs an owner for Anuththi.',
    '2026-11-15T09:00',
    ME,
    { opened: '2026-11-14', replied: true },
  ),
])
