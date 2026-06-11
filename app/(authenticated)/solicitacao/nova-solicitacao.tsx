"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/react";

type Step = 1 | 2 | 3 | 4;

export type SolicitacaoFormValues = {
  // Etapa 1
  tipoPapel: string;
  intuito: string;
  copias: number;
  // Etapa 2
  tamanho: string;
  orientacao: string;
  modelo: string;
  cor: string;
  acabamento: string;
  // Etapa 3
  documento: string | null;
  dataRetirada: string;
  horarioRetirada: string;
};

type FormState = SolicitacaoFormValues;

const INITIAL_FORM: FormState = {
  tipoPapel: "Comum",
  intuito: "Prova",
  copias: 10,
  tamanho: "A4",
  orientacao: "Retrato",
  modelo: "Frente e Verso",
  cor: "Preto e Branco",
  acabamento: "Grampeado",
  documento: null,
  dataRetirada: "",
  horarioRetirada: "12:00",
};

const TIPO_PAPEL_OPTIONS = ["Comum", "Reciclado", "Couché", "Cartão"];
const INTUITO_OPTIONS = ["Prova", "Trabalho", "Material de Aula", "Comunicado", "Outro"];
const TAMANHO_OPTIONS = ["A4", "A3", "Carta", "Ofício"];
const ORIENTACAO_OPTIONS = ["Retrato", "Paisagem"];
const MODELO_OPTIONS = ["Frente e Verso", "Só Frente"];
const COR_OPTIONS = ["Preto e Branco", "Colorido"];
const ACABAMENTO_OPTIONS = ["Grampeado", "Encadernado", "Nenhum"];

const STEPS: Step[] = [1, 2, 3, 4];

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-4">
      {STEPS.map((step) => {
        const isActive = step === current;
        return (
          <div
            key={step}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-[18px] font-bold transition ${
              isActive
                ? "border-[#2ea03b] bg-[#cfe9d2] text-[#1f1f1f]"
                : "border-black/30 bg-white text-[#1f1f1f]"
            }`}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 border-b border-black/20 pb-3 text-[22px] font-extrabold text-[#1f1f1f]">
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[14px] text-[#3a3a3a]">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full max-w-72 rounded-xl border border-black/40 bg-white px-4 py-2.5 text-[14px] text-[#555] outline-none focus:border-[#2ea03b]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

const PRIMARY_BUTTON =
  "rounded-xl border border-black/30 bg-white px-6 py-2.5 text-[16px] font-bold text-[#1f1f1f] shadow-sm transition hover:bg-gray-50";

export default function NovaSolicitacao({
  solicitacaoId,
  initialValues,
  onCancel,
  onCreated,
}: {
  solicitacaoId?: number;
  initialValues?: SolicitacaoFormValues;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const trpc = useTRPC();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = typeof solicitacaoId === "number";

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialValues ?? INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState("");

  const criarMutation = useMutation(
    trpc.solicitacao.criar.mutationOptions({
      onSuccess: () => {
        onCreated();
      },
      onError: (error) => {
        setErrorMessage(error.message);
      },
    })
  );

  const atualizarMutation = useMutation(
    trpc.solicitacao.atualizar.mutationOptions({
      onSuccess: () => {
        onCreated();
      },
      onError: (error) => {
        setErrorMessage(error.message);
      },
    })
  );

  const isSaving = criarMutation.isPending || atualizarMutation.isPending;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const goNext = () => {
    setErrorMessage("");
    setStep((current) => (current < 4 ? ((current + 1) as Step) : current));
  };

  const goTo = (target: Step) => {
    setErrorMessage("");
    setStep(target);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    update("documento", file ? file.name : null);
    event.target.value = "";
  };

  const handleConfirm = async () => {
    setErrorMessage("");

    if (!form.dataRetirada) {
      setErrorMessage("Informe a data da retirada (etapa 3).");
      setStep(3);
      return;
    }

    const payload = {
      tipoPapel: form.tipoPapel,
      intuito: form.intuito,
      copias: form.copias,
      tamanho: form.tamanho,
      orientacao: form.orientacao,
      modelo: form.modelo,
      cor: form.cor,
      acabamento: form.acabamento,
      documento: form.documento,
      dataRetirada: form.dataRetirada,
      horarioRetirada: form.horarioRetirada,
    };

    if (isEditing) {
      await atualizarMutation.mutateAsync({ id: solicitacaoId, ...payload });
    } else {
      await criarMutation.mutateAsync(payload);
    }
  };

  return (
    <div className="max-w-2xl">
      <Stepper current={step} />

      {step === 1 && (
        <div>
          <SectionTitle>Material</SectionTitle>
          <div className="mt-6 space-y-5">
            <Field label="Tipo de Papel">
              <Select
                value={form.tipoPapel}
                onChange={(value) => update("tipoPapel", value)}
                options={TIPO_PAPEL_OPTIONS}
              />
            </Field>
            <Field label="Intuito">
              <Select
                value={form.intuito}
                onChange={(value) => update("intuito", value)}
                options={INTUITO_OPTIONS}
              />
            </Field>
            <Field label="Quantidade de Cópias">
              <input
                type="number"
                min={1}
                value={form.copias}
                onChange={(event) =>
                  update("copias", Math.max(1, Number(event.target.value) || 1))
                }
                className="w-24 rounded-xl border border-black/40 bg-white px-4 py-2.5 text-[14px] text-[#555] outline-none focus:border-[#2ea03b]"
              />
            </Field>
          </div>
          <div className="mt-8">
            <button type="button" onClick={goNext} className={PRIMARY_BUTTON}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <SectionTitle>Configurações da Impressão</SectionTitle>
          <div className="mt-6 space-y-5">
            <Field label="Tamanho da Folha">
              <Select
                value={form.tamanho}
                onChange={(value) => update("tamanho", value)}
                options={TAMANHO_OPTIONS}
              />
            </Field>
            <Field label="Orientação">
              <Select
                value={form.orientacao}
                onChange={(value) => update("orientacao", value)}
                options={ORIENTACAO_OPTIONS}
              />
            </Field>
            <Field label="Modelo">
              <Select
                value={form.modelo}
                onChange={(value) => update("modelo", value)}
                options={MODELO_OPTIONS}
              />
            </Field>
            <Field label="Cor">
              <Select
                value={form.cor}
                onChange={(value) => update("cor", value)}
                options={COR_OPTIONS}
              />
            </Field>
            <Field label="Acabamento">
              <Select
                value={form.acabamento}
                onChange={(value) => update("acabamento", value)}
                options={ACABAMENTO_OPTIONS}
              />
            </Field>
          </div>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={() => goTo(1)} className={PRIMARY_BUTTON}>
              Voltar
            </button>
            <button type="button" onClick={goNext} className={PRIMARY_BUTTON}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <SectionTitle>Anexo</SectionTitle>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="text-[14px] text-[#3a3a3a]">Importar Documento</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-black/30 bg-white px-6 py-2.5 text-[#1f1f1f] shadow-sm transition hover:bg-gray-50"
              aria-label="Importar documento"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {form.documento && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[14px] text-[#2563c9] underline">{form.documento}</span>
              <button
                type="button"
                onClick={() => update("documento", null)}
                className="text-[#d92d2d]"
                aria-label="Remover documento"
                title="Remover documento"
              >
                ✕
              </button>
            </div>
          )}

          <SectionTitle>Retirada</SectionTitle>
          <div className="mt-5 flex flex-wrap gap-8">
            <Field label="Data da Retirada">
              <input
                type="date"
                value={form.dataRetirada}
                onChange={(event) => update("dataRetirada", event.target.value)}
                className="rounded-xl border border-black/40 bg-white px-4 py-2.5 text-[14px] text-[#555] outline-none focus:border-[#2ea03b]"
              />
            </Field>
            <Field label="Horário da Retirada">
              <input
                type="time"
                value={form.horarioRetirada}
                onChange={(event) => update("horarioRetirada", event.target.value)}
                className="rounded-xl border border-black/40 bg-white px-4 py-2.5 text-[14px] text-[#555] outline-none focus:border-[#2ea03b]"
              />
            </Field>
          </div>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={() => goTo(2)} className={PRIMARY_BUTTON}>
              Voltar
            </button>
            <button type="button" onClick={goNext} className={PRIMARY_BUTTON}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <SectionTitle>Informações da Impressão</SectionTitle>

          <div className="mt-6 space-y-6 text-[15px] text-[#3a3a3a]">
            <div>
              <h3 className="text-[18px] font-extrabold text-[#1f1f1f]">Sobre o Material</h3>
              <p>Tipo de papel: {form.tipoPapel}</p>
              <p>Intuito: {form.intuito}</p>
              <p>Quantidade de cópias: {form.copias}</p>
            </div>

            <div>
              <h3 className="text-[18px] font-extrabold text-[#1f1f1f]">Configurações da Impressão</h3>
              <p>Tamanho: {form.tamanho}</p>
              <p>Orientação: {form.orientacao}</p>
              <p>Modelo: {form.modelo}</p>
              <p>Cor: {form.cor}</p>
            </div>

            <div>
              <h3 className="text-[18px] font-extrabold text-[#1f1f1f]">Acabamento e Anexagem</h3>
              <p>Acabamento: {form.acabamento}</p>
              <p>
                Retirada: {form.dataRetirada || "—"}
                {form.horarioRetirada ? ` às ${form.horarioRetirada}` : ""}
              </p>
              <p>
                Anexos:{" "}
                {form.documento ? (
                  <span className="text-[#2563c9] underline">{form.documento}</span>
                ) : (
                  "nenhum"
                )}
              </p>
            </div>
          </div>

          {errorMessage && (
            <p className="mt-4 text-[14px] text-[#d92d2d]">{errorMessage}</p>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-xl bg-[#d92d2d] px-7 py-2.5 text-[16px] font-bold text-white transition hover:bg-[#bd2626] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="rounded-xl bg-[#2ea03b] px-7 py-2.5 text-[16px] font-bold text-white transition hover:bg-[#228d2e] disabled:opacity-60"
            >
              {isSaving ? "Enviando..." : isEditing ? "Salvar alterações" : "Confirmar"}
            </button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => goTo(3)}
              disabled={isSaving}
              className="text-[14px] text-[#7a7a7a] underline disabled:opacity-60"
            >
              Voltar para editar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
