export interface CalEvent {
  id: number
  /** Local date, yyyy-mm-dd. */
  date: string
  /** Hours from midnight, e.g. 9.5 = 9:30am. Omit both for an all-day event. */
  start?: number
  end?: number
  title: string
  /** Placeholder person the meeting is with; colour comes from their category. */
  person: string
  where?: string
}

let id = 1
const ev = (date: string, start: number, end: number, title: string, person: string, where: string): CalEvent => ({
  id: id++,
  date,
  start,
  end,
  title,
  person,
  where,
})
const allDay = (date: string, title: string, person: string): CalEvent => ({ id: id++, date, title, person })

export const events: CalEvent[] = [
  allDay('2026-11-16', 'Application deadline', 'Ren Sun'),
  ev('2026-11-16', 9, 10, 'Coverage needs analysis', 'Victoria Biancaniello', 'Zoom'),
  ev('2026-11-16', 11, 11.5, 'Term life quote review', 'Ren Sun', 'Phone'),
  ev('2026-11-16', 13, 14, 'Beneficiary update', 'Anuththi Nishaharan', 'Office'),
  ev('2026-11-16', 15.5, 16.5, 'Whole life vs. term intro', 'Angelina Tang', 'Zoom'),

  ev('2026-11-17', 9.5, 10.5, 'Annual policy review', 'Rhea Manek', 'Office'),
  ev('2026-11-17', 12, 12.75, 'Medical exam follow-up', 'Victoria Biancaniello', 'Phone'),
  ev('2026-11-17', 14, 15, 'Intro call', 'Angelina Tang', 'Zoom'),

  allDay('2026-11-18', 'Paramedical exam', 'Victoria Biancaniello'),
  ev('2026-11-18', 10, 11, 'Application walkthrough', 'Ren Sun', 'Zoom'),
  ev('2026-11-18', 13.5, 14, 'Re-engagement call', 'Anuththi Nishaharan', 'Phone'),
  ev('2026-11-18', 15, 16, 'Premium payment options', 'Victoria Biancaniello', 'Zoom'),
  ev('2026-11-18', 17, 17.5, 'Underwriting check-in', 'Rhea Manek', 'Phone'),

  ev('2026-11-19', 9, 9.75, 'Riders & add-ons', 'Angelina Tang', 'Zoom'),
  ev('2026-11-19', 11.5, 12.5, 'Policy illustration review', 'Rhea Manek', 'Office'),
  ev('2026-11-19', 14.5, 15.5, 'Coverage needs analysis', 'Anuththi Nishaharan', 'Zoom'),

  allDay('2026-11-20', 'Policy renewal due', 'Rhea Manek'),
  ev('2026-11-20', 9.5, 10, 'Term quote follow-up', 'Victoria Biancaniello', 'Phone'),
  ev('2026-11-20', 11, 12, 'Whole life vs. term call', 'Angelina Tang', 'Zoom'),
  ev('2026-11-20', 13, 13.75, 'Application sign-off', 'Ren Sun', 'Office'),
  ev('2026-11-20', 15, 16, 'Beneficiary paperwork', 'Anuththi Nishaharan', 'Office'),
]
