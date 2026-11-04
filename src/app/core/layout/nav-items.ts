import type { IconName } from '../../shared/ui/icon/icon';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: IconName;
  permission: string;
  soon?: boolean;
  separatorBefore?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.overview', icon: 'home', permission: 'dashboard.read' },
  { path: '/etablissements', labelKey: 'nav.establishments', icon: 'school', permission: 'schools.read' },
  { path: '/users', labelKey: 'nav.users', icon: 'users', permission: 'users.read' },
  { path: '/roles', labelKey: 'nav.roles', icon: 'shield', permission: 'roles.read' },
  { path: '/assignments', labelKey: 'nav.assignments', icon: 'userCheck', permission: 'assignments.read' },
  { path: '/spaces', labelKey: 'nav.spaces', icon: 'folder', permission: 'documents.read', soon: true },
  { path: '/documents', labelKey: 'nav.documents', icon: 'file', permission: 'documents.read' },
  { path: '/conversations', labelKey: 'nav.conversations', icon: 'message', permission: 'conversations.read' },
  { path: '/processing', labelKey: 'nav.processing', icon: 'activity', permission: 'documents.read', soon: true },
  { path: '/audit', labelKey: 'nav.audit', icon: 'clipboard', permission: 'audit.read' },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    permission: 'dashboard.read',
    soon: true,
    separatorBefore: true,
  },
];