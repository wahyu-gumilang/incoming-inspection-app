import { Role } from '../../models/user';

export interface NavLink {
  path: string;
  label: string;
  icon: string;
  hint?: string;
  roles?: Role[];
}

export interface NavGroup {
  label: string;
  icon: string;
  children: NavLink[];
}

export type NavEntry = NavLink | NavGroup;

export const isGroup = (e: NavEntry): e is NavGroup => 'children' in e;

// The main menu, as in the approved mockups. `roles` hides an entry from other roles;
// the routes are guarded too.
export const NAV: NavEntry[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { path: '/inspections', label: 'Inspections', icon: 'fact_check' },
  {
    label: 'Master data',
    icon: 'database',
    children: [
      {
        path: '/items',
        label: 'Items & standards',
        hint: 'Parts and their QC standards',
        icon: 'inventory_2',
      },
      { path: '/vendors', label: 'Vendors', hint: 'Suppliers', icon: 'local_shipping' },
      { path: '/aql', label: 'AQL table', hint: 'Sample size and Ac / Re', icon: 'table_chart' },
    ],
  },
  { path: '/users', label: 'Users', icon: 'group', roles: ['ADMIN'] },
];
