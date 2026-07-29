import type { StaffRole } from '@/lib/staff';

/**
 * Single source of truth for role-based navigation & access.
 * Each section lists the roles allowed to reach it. Used by the shell (to build
 * the nav) and by the server guards (to allow/deny routes). Column-level field
 * visibility within a section is a separate concern (E3).
 */
export type NavItem = { key: string; label: string; href: string; roles: StaffRole[] };

export const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', roles: ['receptionist', 'admin'] },
  { key: 'health', label: 'Health', href: '/health', roles: ['health', 'admin'] },
  { key: 'children', label: 'Children', href: '/children', roles: ['admin'] },
  { key: 'reports', label: 'Reports', href: '/reports', roles: ['admin'] },
  { key: 'users', label: 'Users', href: '/users', roles: ['admin'] },
];

export function navFor(role: StaffRole): NavItem[] {
  return NAV.filter((item) => item.roles.includes(role));
}

/** Roles allowed at a given section href (matches the section or a child path). */
export function rolesForHref(href: string): StaffRole[] | null {
  const item = NAV.find((n) => href === n.href || href.startsWith(n.href + '/'));
  return item ? item.roles : null;
}

const DEFAULT_HOME: Record<StaffRole, string> = {
  admin: '/dashboard',
  receptionist: '/dashboard',
  health: '/health',
};

/** Where a role lands after sign-in / when hitting a disallowed route. */
export function defaultHome(role: StaffRole): string {
  return DEFAULT_HOME[role];
}
