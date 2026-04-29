export const roles = [
  'SOLICITANTE',
  'IMPRESSOR',
  'ADMINISTRADOR'
] as const;

export type DefaultRoleCode = (typeof roles)[number];
export type Role = string;

export const defaultRoleCode = 'SOLICITANTE' satisfies DefaultRoleCode;
