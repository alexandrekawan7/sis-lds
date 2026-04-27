"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import fundo from "@/app/assets/fundo.png";

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      {/* LADO ESQUERDO */}
      <div className="flex w-full items-center justify-center bg-[#00843D] px-4 py-10 md:w-1/2 md:py-0">
        <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-gray-100 p-8 shadow-lg">
          <h1 className="mb-6 text-center text-4xl font-black text-black">
            LOGO
          </h1>
          <h2 className="text-xl font-bold text-black">Esqueci a senha!</h2>
          <p className="mb-8 text-sm text-gray-500">
            Informe seu e-mail para recuperar a senha.
          </p>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) {
                setErrorMsg("Dados não preenchidos");
                setSuccessMsg("");
                return;
              }
              setErrorMsg("");
              setSuccessMsg(
                "Enviamos um link de recuperação para o seu e-mail."
              );
            }}
          >
            <div>
              <label className="mb-1 block text-sm text-black">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                placeholder="Usuário@email.com"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-sm text-black placeholder-gray-400 outline-none focus:border-[#00843D] focus:ring-1 focus:ring-[#00843D]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[#219EBC] py-4 text-lg font-bold uppercase tracking-wider text-white transition hover:bg-[#35a89f]"
            >
              ENVIAR
            </button>

            {errorMsg && (
              <p className="text-center text-xs text-red-500">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-center text-xs text-[#00843D]">
                {successMsg}
              </p>
            )}
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 transition hover:text-black"
            >
              ← Voltar para o login
            </button>
          </div>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="relative hidden md:block md:w-1/2">
        <Image
          src={fundo}
          alt="Fundo"
          fill
          className="object-cover"
          quality={90}
          priority
        />
        {/* Overlay verde com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00843D] via-[#00843D]/20 to-transparent" />
      </div>
    </div>
  );
}
