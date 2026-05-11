export const roles = [
  'Administrador',
  'Solicitante',
  'Impressor',
  'Coordenador'
] as const;

export type DefaultRoleCode = (typeof roles)[number];
export type Role = string;

export const defaultRoleCode = 'Solicitante' satisfies DefaultRoleCode;
