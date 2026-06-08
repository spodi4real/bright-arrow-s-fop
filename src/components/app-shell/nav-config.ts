import type { Role } from '@prisma/client';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  FolderOpen,
  Target as TargetIcon,
  Trophy,
  Wallet,
  Users as UsersIcon,
  FileBarChart,
  Settings as SettingsIcon,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'iskra', 'engineer', 'accountant'] },
  { label: 'Missions', href: '/missions', icon: Briefcase, roles: ['admin', 'supervisor', 'iskra', 'engineer'] },
  { label: 'Agenda', href: '/agenda', icon: Calendar, roles: ['admin', 'supervisor', 'iskra', 'engineer', 'accountant'] },
  { label: 'Files', href: '/files', icon: FolderOpen, roles: ['admin', 'supervisor', 'iskra', 'engineer', 'accountant'] },
  { label: 'Violations', href: '/violations', icon: AlertTriangle, roles: ['admin', 'supervisor', 'iskra', 'engineer'] },
  { label: 'Contractors', href: '/contractors', icon: Building2, roles: ['admin', 'supervisor'] },
  { label: 'Targets', href: '/targets', icon: TargetIcon, roles: ['admin', 'engineer'] },
  { label: 'Bonus Scores', href: '/bonus-scores', icon: Trophy, roles: ['admin', 'supervisor'] },
  { label: 'Expenses', href: '/expenses', icon: Wallet, roles: ['admin', 'supervisor', 'iskra', 'engineer', 'accountant'] },
  { label: 'Users', href: '/users', icon: UsersIcon, roles: ['admin'] },
  { label: 'Reports', href: '/reports', icon: FileBarChart, roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: SettingsIcon, roles: ['admin', 'supervisor', 'iskra', 'engineer', 'accountant'] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
