export const MANAGE_USERS_PERMISSION = "Gerenciar usuarios" as const;

export const SYSTEM_PERMISSIONS = [
  MANAGE_USERS_PERMISSION,
  "Criar solicitacoes de impressao",
  "Visualizar as proprias solicitacoes de impressao",
  "Visualizar todas as solicitacoes de impressao",
  "Aprovar solicitacoes de impressao",
  "Rejeitar solicitacoes de impressao",
  "Executar impressao de documentos",
  "Visualizar e exportar relatorios de folhas",
] as const;

export type PermissionName = (typeof SYSTEM_PERMISSIONS)[number];
