"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import fundo from "@/app/assets/fundo.png";

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      {/* LADO ESQUERDO */}
      <div className="flex w-full items-center justify-center bg-[#00843D] px-4 py-10 md:w-1/2 md:py-0">
        <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-gray-100 p-8 shadow-lg">
          <h1 className="mb-6 text-center text-4xl font-black text-black">
            LOGO
          </h1>
          <h2 className="text-xl font-bold text-black">Bem vindo</h2>
          <p className="mb-8 text-sm text-gray-500">
            Por favor, faça seu login.
          </p>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim() || !senha.trim()) {
                setErrorMsg("Dados não preenchidos");
                return;
              }
              setErrorMsg("");
              router.push("/home");
            }}
          >
            <div>
              <label className="mb-1 block text-sm text-black">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                placeholder="Usuário@email.com"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-sm text-black placeholder-gray-400 outline-none focus:border-[#00843D] focus:ring-1 focus:ring-[#00843D]"
              />
            </div>

            <div className="relative">
              <label className="mb-1 block text-sm text-black">
                Senha
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErrorMsg(""); }}
                placeholder="Usuário123"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 pr-12 text-sm text-black placeholder-gray-400 outline-none focus:border-[#00843D] focus:ring-1 focus:ring-[#00843D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/esqueci-senha")}
                className="text-xs text-gray-500 transition hover:text-[#00843D] hover:underline"
              >
                Esqueci a senha
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[#219EBC] py-4 text-lg font-bold uppercase tracking-wider text-white transition hover:bg-[#35a89f]"
            >
              ENTRAR
            </button>

            {errorMsg && (
              <p className="text-center text-xs text-red-500">
                {errorMsg}
              </p>
            )}
          </form>
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
