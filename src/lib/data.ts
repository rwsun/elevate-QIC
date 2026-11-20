export type Page =
  | 'home'
  | 'inbox'
  | 'follow-ups'
  | 'calendar'
  | 'assigned'
  | 'new'
  | 'orphaned'
  | 'manager'
  | 'analytics'

// 24-unit viewBox line icons, shared by the sidebar and the mobile tab bar.
export const pageIcons: Record<Page, string> = {
  home: 'M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10',
  inbox: 'M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6z',
  'follow-ups': 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4M12 8v4l3 2',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  assigned: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-1a6 6 0 0 1 11-3.3M15 18l2 2 4-4',
  new: 'M12 5v14M5 12h14',
  orphaned: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-1a6 6 0 0 1 11-3.3M16 15l5 5M21 15l-5 5',
  manager: 'M5 21V4M5 4h11l-2 4 2 4H5',
  analytics: 'M5 20V11M12 20V5M19 20v-6M3 20h18',
}
