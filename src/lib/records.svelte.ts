export type Category = 'assigned' | 'new' | 'orphaned'

export interface Person {
  id: number
  name: string
  email: string
  age: number | null
  country: string
  /** ISO date (yyyy-mm-dd) of the last call or follow-up, or '' if none yet. */
  lastContact: string
}

export const categoryColors: Record<Category, string> = {
  assigned: 'var(--assigned)',
  new: 'var(--new)',
  orphaned: 'var(--orphaned)',
}

let nextId = 1
const person = (
  name: string,
  email: string,
  age: number | null,
  country: string,
  lastContact: string,
): Person => ({
  id: nextId++,
  name,
  email,
  age,
  country,
  lastContact,
})

// Kept in module state so edits survive switching between pages.
export const records: Record<Category, Person[]> = $state({
  assigned: [
    person('Rhea Manek', 'rhea.manek@queensu.ca', 20, 'Canada', '2026-11-14'),
    person('Ren Sun', 'renran.sun@queensu.ca', 20, 'Canada', '2026-11-02'),
  ],
  new: [
    person('Victoria Biancaniello', '25bbhw1@queensu.ca', 19, 'Canada', ''),
    person('Angelina Tang', 'angelina.tang@queensu.ca', 19, 'Canada', ''),
  ],
  orphaned: [
    person('Anuththi Nishaharan', 'anuththi.t.nishaharan@queensu.ca', 20, 'Canada', '2026-09-18'),
  ],
})

export function addPerson(category: Category): Person {
  const p = person('', '', null, '', '')
  records[category].push(p)
  return p
}

export function removePeople(category: Category, ids: Set<number>) {
  records[category] = records[category].filter((p) => !ids.has(p.id))
}
