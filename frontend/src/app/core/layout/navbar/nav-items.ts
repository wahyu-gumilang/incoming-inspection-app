export interface NavLink {
  type: 'link';
  label: string;
  route: string;
  icon: string;
  roles?: string[]; // empty or undefined = all roles
}

export interface NavGroup {
  type: 'group';
  label: string;
  icon: string;
  children: NavLink[];
  roles?: string[];
}

export type NavEntry = NavLink | NavGroup;

export const NAV_ITEMS: NavEntry[] = [
  {
    type: 'link',
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'dashboard',
  },
  {
    type: 'link',
    label: 'Inspections',
    route: '/inspections',
    icon: 'fact_check',
  },
  {
    type: 'group',
    label: 'Master Data',
    icon: 'database',
    children: [
      { type: 'link', label: 'Items', route: '/items', icon: 'inventory_2' },
      { type: 'link', label: 'Vendors', route: '/vendors', icon: 'business' },
      { type: 'link', label: 'AQL Table', route: '/aql', icon: 'table_chart' },
      { type: 'link', label: 'Users', route: '/users', icon: 'people', roles: ['ADMIN'] },
    ],
  },
];
