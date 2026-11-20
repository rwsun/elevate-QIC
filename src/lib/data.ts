export type Page = 'home' | 'inbox' | 'follow-ups' | 'calendar' | 'assigned' | 'new' | 'orphaned'

export interface Thread {
  id: number
  from: string
  subject: string
  count: number
  preview: string
  date: string
  unread: boolean
}

export const followUps: Thread[] = [
  {
    id: 1,
    from: 'Victoria Biancaniello',
    subject: 'Re: Term life insurance quote',
    count: 4,
    preview: 'Thanks for sending the 20-year term comparison! Would raising the coverage to $500k change the monthly…',
    date: 'Nov 20',
    unread: true,
  },
  {
    id: 2,
    from: 'Angelina Tang',
    subject: 'Booking a call to discuss whole life vs. term',
    count: 2,
    preview: 'Hi! Would Thursday at 2pm work for a quick call? I want to understand the cash value on a whole life…',
    date: 'Nov 19',
    unread: true,
  },
  {
    id: 3,
    from: 'Ren Sun, Anuththi, Rhea',
    subject: 'Fwd: Updating beneficiaries on a life insurance policy',
    count: 6,
    preview: 'Looping in Rhea — Anuththi wants to add her sister as a beneficiary and asked whether the medical…',
    date: 'Nov 18',
    unread: false,
  },
]
