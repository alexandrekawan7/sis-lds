"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useTRPC, useTRPCClient } from "@/trpc/react";

export default function ImprimirSolicitacaoPage() {
  const router = useRouter();
  const params = useParams();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const id = Number(params?.id);

  const [showConcluir, setShowConcluir] = useState(false);
  const [folhasPerdidas, setFolhasPerdidas] = useState("0");
  const [concluirError, setConcluirError] = useState("");

  const meQuery = useQuery(trpc.user.me.queryOptions());

  const solicitacaoQuery = useQuery({
    ...trpc.solicitacao.porId.queryOptions({ id }),
    enabled: !isNaN(id),
  });

  const concluirMutation = useMutation(
    trpc.solicitacao.concluirImpressao.mutationOptions({
      onSuccess: () => {
        router.push("/solicitacao");
      },
      onError: (error) => {
        setConcluirError(error.message);
      },
    })
  );

  const handleDownload = async () => {
    const documentId = solicitacaoQuery.data?.documentId;
    if (!documentId) return;

    try {
      const doc = await trpcClient.document.getDocumentWithBase64.query({ documentId });
      const url = `data:${doc.mimeType};base64,${doc.base64Data}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      alert("Erro ao baixar documento.");
    }
  };

  const handleConcluir = () => {
    setConcluirError("");
    setFolhasPerdidas("0");
    setShowConcluir(true);
  };

  const handleConfirmConcluir = () => {
    const parsed = Number(folhasPerdidas);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setConcluirError("Informe um número inteiro de folhas (0 ou maior).");
      return;
    }
    concluirMutation.mutate({ id, folhasPerdidas: parsed });
  };

  if (solicitacaoQuery.isLoading || meQuery.isLoading) {
    return (
      <main className="flex-1 p-8 md:p-16">
        <p className="text-[15px] font-semibold text-[#7a7a7a]">Carregando detalhes...</p>
      </main>
    );
  }

  if (solicitacaoQuery.isError || !solicitacaoQuery.data) {
    return (
      <main className="flex-1 p-8 md:p-16">
        <p className="text-[15px] font-semibold text-[#d92d2d]">
          Erro ao carregar solicitação. Ela pode não existir ou você não tem permissão.
        </p>
        <button
          type="button"
          onClick={() => router.push("/solicitacao")}
          className="mt-4 rounded-xl bg-[#e9e9e9] px-5 py-2 text-[15px] font-bold text-[#333] transition hover:bg-[#d9d9d9]"
        >
          Voltar
        </button>
      </main>
    );
  }

  const solicitacao = solicitacaoQuery.data;

  return (
    <main className="flex-1 px-8 pb-16 pt-12 md:px-16">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold text-[#1f1f1f]">
          Imprimindo Solicitação #{solicitacao.id}
        </h1>
        <button
          type="button"
          onClick={() => router.push("/solicitacao")}
          className="rounded-xl bg-[#e9e9e9] px-5 py-2 text-[15px] font-bold text-[#333] transition hover:bg-[#d9d9d9]"
        >
          Voltar à Lista
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-black/15 bg-white p-8 shadow-soft">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4 text-[15px] text-[#3a3a3a]">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Solicitante</h3>
              <p>Nome: {solicitacao.solicitante.nome}</p>
              <p>Cargo: {solicitacao.solicitante.cargo}</p>
              <p>Departamento: {solicitacao.solicitante.departamento}</p>
            </div>
          </div>

          <div className="space-y-4 text-[15px] text-[#3a3a3a]">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Sobre o Material</h3>
              <p>Tipo de papel: {solicitacao.tipoPapel}</p>
              <p>Intuito: {solicitacao.intuito}</p>
              <p className="font-semibold text-[#2ea03b]">Quantidade de cópias: {solicitacao.copias}</p>
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Configurações</h3>
              <p>Tamanho: {solicitacao.tamanho}</p>
              <p>Orientação: {solicitacao.orientacao}</p>
              <p>Modelo: {solicitacao.modelo}</p>
              <p>Cor: {solicitacao.cor}</p>
            </div>
          </div>

          <div className="space-y-4 text-[15px] text-[#3a3a3a]">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Acabamento e Anexo</h3>
              <p>Acabamento: {solicitacao.acabamento}</p>
              <div className="mt-3">
                <p className="font-semibold">Arquivo a imprimir:</p>
                {solicitacao.documento && solicitacao.documentId ? (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#3b62d8] px-4 py-2 text-[14px] font-bold text-white shadow-md transition hover:bg-[#3354bd]"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Baixar {solicitacao.documento}
                  </button>
                ) : (
                  <p className="mt-1 text-[#7a7a7a] italic">Nenhum documento anexado</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center border-t border-black/10 pt-8">
          <button
            type="button"
            onClick={handleConcluir}
            disabled={concluirMutation.isPending || solicitacao.status !== "IMPRIMINDO"}
            className="w-full max-w-sm rounded-full bg-[#2ea03b] py-4 text-[18px] font-bold text-white shadow-lg transition hover:bg-[#228d2e] disabled:opacity-50"
          >
            {concluirMutation.isPending ? "Processando..." : "Marcar como Impressa"}
          </button>
        </div>
      </div>

      {showConcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-[20px] font-extrabold text-[#1f1f1f]">Concluir impressão</h2>
            <p className="mt-2 text-[14px] text-[#555]">
              Informe quantas folhas foram perdidas ou desperdiçadas durante esta impressão
              (defeitos, atolamentos, reimpressões). Deixe 0 caso nenhuma tenha sido desperdiçada.
            </p>

            <label className="mt-6 block">
              <span className="mb-1 block text-[14px] font-semibold text-[#3a3a3a]">
                Folhas perdidas/desperdiçadas
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={folhasPerdidas}
                onChange={(event) => setFolhasPerdidas(event.target.value)}
                autoFocus
                className="w-32 rounded-xl border border-black/40 bg-white px-4 py-2.5 text-[15px] text-[#333] outline-none focus:border-[#2ea03b]"
              />
            </label>

            {concluirError && (
              <p className="mt-3 text-[14px] text-[#d92d2d]">{concluirError}</p>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConcluir(false)}
                disabled={concluirMutation.isPending}
                className="rounded-xl bg-[#e9e9e9] px-5 py-2.5 text-[15px] font-bold text-[#333] transition hover:bg-[#d9d9d9] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmConcluir}
                disabled={concluirMutation.isPending}
                className="rounded-xl bg-[#2ea03b] px-5 py-2.5 text-[15px] font-bold text-white transition hover:bg-[#228d2e] disabled:opacity-50"
              >
                {concluirMutation.isPending ? "Salvando..." : "Confirmar conclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
