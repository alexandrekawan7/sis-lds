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

/**
 * Cargos que podem acessar o menu/página de Solicitações de impressão.
 * O menu e a rota só ficam disponíveis para estes cargos.
 */
export const SOLICITACAO_ROLES = ["Professor", "Convidado", "Coordenador"] as const;

export type SolicitacaoRole = (typeof SOLICITACAO_ROLES)[number];

export function canAccessSolicitacoes(roleName: string | null | undefined): boolean {
  return SOLICITACAO_ROLES.includes((roleName ?? "") as SolicitacaoRole);
}
