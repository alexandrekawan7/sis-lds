export const MANAGE_USERS_PERMISSION = "Gerenciar usuários" as const;

export const SYSTEM_PERMISSIONS = [
  MANAGE_USERS_PERMISSION,
  "Criar solicitações de impressão",
  "Visualizar as próprias solicitações de impressão",
  "Visualizar todas as solicitações de impressão",
  "Aprovar solicitações de impressão",
  "Rejeitar solicitações de impressão",
  "Executar impressão de documentos",
  "Visualizar e exportar relatórios de folhas",
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
