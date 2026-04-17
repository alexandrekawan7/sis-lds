"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  nome: string;
  cargo: string;
  area: string;
  matricula: string;
  telefone: string;
  email: string;
  aprovadas: string;
  rejeitadas: string;
};

const users: User[] = [
  {
    id: 1,
    nome: "Saulo Bezerra Lima",
    cargo: "Professor",
    area: "Sistemas de Informação",
    matricula: "2022103500273",
    telefone: "(88) 94548-5854",
    email: "saulo@email.com",
    aprovadas: "45",
    rejeitadas: "455",
  },
  {
    id: 2,
    nome: "Lívia Pereira Torres",
    cargo: "Professor",
    area: "Português",
    matricula: "2022103500278",
    telefone: "(88) 94548-5854",
    email: "livia@email.com",
    aprovadas: "33",
    rejeitadas: "323",
  },
  {
    id: 3,
    nome: "Mário Ribeiro de Sousa Alcantara",
    cargo: "Técnico",
    area: "Lab. Redes",
    matricula: "2022103500298",
    telefone: "(88) 94548-5854",
    email: "marioribeirosousa29@email.com",
    aprovadas: "03",
    rejeitadas: "12",
  },
  {
    id: 4,
    nome: "Maria Francisca de Lima Mota",
    cargo: "Professor",
    area: "Matemática",
    matricula: "202210350027389",
    telefone: "(88) 94548-5854",
    email: "maria@email.com",
    aprovadas: "69",
    rejeitadas: "869",
  },
  {
    id: 5,
    nome: "Noélia Devanir da Silva Lima",
    cargo: "Professor",
    area: "História",
    matricula: "202210350027378",
    telefone: "(88) 94548-5854",
    email: "noelia@email.com",
    aprovadas: "32",
    rejeitadas: "302",
  },
];

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const handleAddUser = () => {
    alert("Botão Adicionar usuário clicado!");
  };

  const handleEdit = (id: number) => {
    alert(`Editar usuário ID ${id}`);
  };

  const handleDelete = (id: number) => {
    const confirmed = confirm(`Deseja excluir o usuário ID ${id}?`);
    if (confirmed) alert("Usuário removido com sucesso!");
  };

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efefef] font-[Poppins,sans-serif]">
      <style>{`
        .table-grid {
          display: grid;
          grid-template-columns: 52px 1.5fr 0.85fr 1.1fr 1fr 1fr 1.2fr 0.9fr 0.9fr 0.7fr;
          align-items: center;
        }
        @media (max-width: 1200px) {
          .table-grid { min-width: 1050px; }
        }
        .shadow-soft { box-shadow: 0 10px 30px rgba(0,0,0,.08); }
        .shadow-nav { box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`relative flex flex-col overflow-hidden bg-[#2ea03b] py-8 text-white transition-all duration-300 ${
            isSidebarOpen ? "w-75 px-6" : "w-20 px-3"
          }`}
        >
          <div
            className={`mb-12 flex items-start transition-all duration-200 ${
              isSidebarOpen ? "justify-between gap-4" : "flex-col items-center gap-4"
            }`}
          >
            <div className={`flex items-center overflow-hidden transition-all duration-200 ${isSidebarOpen ? "gap-4" : "gap-0"}`}>
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/20 shadow-lg ring-4 ring-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className={`min-w-0 overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                <h2 className="text-[24px] font-semibold leading-none">Augusto</h2>
                <p className="mt-1 text-[22px] leading-tight text-white/75">Professor</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((current) => !current)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white transition hover:bg-white/20"
              aria-label={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
              title={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
            </button>
          </div>

          <nav className="space-y-3 text-[18px] font-medium">
            <a
              href="#"
              className={`shadow-nav flex rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4zm0-3h7v1h-7v-1z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Início
              </span>
            </a>

            <a
              href="#"
              className={`shadow-nav flex rounded-2xl bg-[#228d2e] py-3 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M7 3h8l4 4v14H5V3h2z" />
                <path d="M15 3v5h5" />
                <path d="M8 11h8M8 15h8M8 7h3" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Cadastros
              </span>
            </a>

            <a
              href="#"
              className={`shadow-nav flex rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Perfil
              </span>
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className={`shadow-nav mt-1 flex rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 17v-2H3V9h7V7l4 5-4 5Zm4 4h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3v2h3v14h-3v2Z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Sair
              </span>
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="relative flex-1 px-16 pb-16 pt-20">
          <div className="mx-auto max-w-245 pt-16">
            <div className="mb-8 flex items-center justify-end gap-4">
              <button
                onClick={handleAddUser}
                className="shadow-soft rounded-2xl bg-[#37a93f] px-6 py-3 text-[18px] font-semibold text-white transition hover:bg-[#2f9737]"
              >
                Adicionar usuário
              </button>
            </div>

            <div className="rounded-3xl bg-transparent">
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Header */}
                  <div className="table-grid mb-1 rounded-xl bg-[#f6f6f6] px-5 py-3 text-[12px] font-semibold text-[#222] shadow-sm">
                    <div>ID</div>
                    <div>Nome</div>
                    <div>Cargo</div>
                    <div>Depart./Área</div>
                    <div>Matrícula</div>
                    <div>Telefone</div>
                    <div>Email</div>
                    <div>
                      Solicitações
                      <br />
                      Aprovadas
                    </div>
                    <div>
                      Solicitações
                      <br />
                      Rejeitadas
                    </div>
                    <div className="text-center">OPÇÕES</div>
                  </div>

                  {/* Rows */}
                  <div className="shadow-soft divide-y divide-black/5 rounded-xl bg-white text-[10px] text-[#5b5b5b]">
                    {users.map((user) => (
                      <div key={user.id} className="table-grid px-5 py-4">
                        <div>{user.id}</div>
                        <div>{user.nome}</div>
                        <div>{user.cargo}</div>
                        <div>{user.area}</div>
                        <div>{user.matricula}</div>
                        <div>{user.telefone}</div>
                        <div className="truncate pr-2">{user.email}</div>
                        <div>{user.aprovadas}</div>
                        <div>{user.rejeitadas}</div>
                        <div className="flex items-center justify-center gap-3 text-[14px]">
                          <button
                            onClick={() => handleEdit(user.id)}
                            className="text-blue-600 transition hover:scale-110"
                            title="Editar"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 transition hover:scale-110"
                            title="Excluir"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
