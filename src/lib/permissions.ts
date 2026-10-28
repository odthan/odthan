export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EDITOR', 'SUPPORT', 'CLIENT'] as const;
export type Role = (typeof ROLES)[number];
export const PERMISSIONS = [
  'services.manage', 'categories.manage', 'requests.view', 'requests.manage', 'messages.reply',
  'clients.view', 'analytics.view', 'users.manage', 'settings.manage', 'contact.manage', 'logs.view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Miroir lisible de la table role_permissions (la source de vérité reste la base de données). */
export const ROLE_MATRIX: Record<Role, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: ['services.manage', 'categories.manage', 'requests.view', 'requests.manage', 'messages.reply', 'clients.view', 'analytics.view', 'users.manage', 'contact.manage', 'logs.view'],
  MANAGER: ['services.manage', 'requests.view', 'requests.manage', 'messages.reply', 'analytics.view', 'contact.manage'],
  EDITOR: ['services.manage', 'categories.manage'],
  SUPPORT: ['requests.view', 'messages.reply', 'contact.manage'],
  CLIENT: [],
};
/** Rôles qu'un ADMIN (non super) peut attribuer. */
export const ASSIGNABLE_BY_ADMIN: Role[] = ['MANAGER', 'EDITOR', 'SUPPORT'];
