export interface NavLink {
  type: 'link';
  label: string;
  path: string;
  icon: string;
  hint?: string;
  roles?: string[]; // empty or undefined = all roles
}

export interface NavGroup {
  type: 'group';
  label: string;
  icon: string;
  children: NavLink[];
}

export type NavEntry = NavLink | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return entry.type === 'group';
}

export const NAV: NavEntry[] = [
  {
    type: 'link',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    type: 'link',
    label: 'Inspections',
    path: '/inspections',
    icon: 'fact_check',
  },
  {
    type: 'group',
    label: 'Master data',
    icon: 'database',
    children: [
      { type: 'link', label: 'Items', path: '/items', icon: 'inventory_2' },
      { type: 'link', label: 'Vendors', path: '/vendors', icon: 'business' },
      { type: 'link', label: 'AQL', path: '/aql', icon: 'table_chart' },
      { type: 'link', label: 'Users', path: '/users', icon: 'people', roles: ['ADMIN'] },
    ],
  },
];