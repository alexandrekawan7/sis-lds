export const permissions = [
  'USERS_VIEW',
  'USERS_CREATE',
  'USERS_UPDATE',
  'USERS_DELETE',
  'ROLES_VIEW',
  'ROLES_CREATE',
  'ROLES_UPDATE',
  'ROLES_DELETE',
  'PERMISSIONS_VIEW',
  'PRINT_REQUESTS_VIEW',
  'PRINT_REQUESTS_VIEW_OWN',
  'PRINT_REQUESTS_CREATE',
  'PRINT_REQUESTS_UPDATE_STATUS',
  'APPROVALS_CREATE',
  'EXECUTIONS_CREATE',
  'REPORTS_VIEW'
] as const;

export type Permission = (typeof permissions)[number] | string;

export const defaultRolePermissions: Record<string, Permission[]> = {
  SOLICITANTE: ['PRINT_REQUESTS_VIEW_OWN', 'PRINT_REQUESTS_CREATE'],
  IMPRESSOR: ['PRINT_REQUESTS_VIEW', 'EXECUTIONS_CREATE'],
  ADMINISTRADOR: [...permissions]
};
