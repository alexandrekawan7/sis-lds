"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import checkCircle from "@/imagens/Check circle.png";

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

const initialUsers: User[] = [
  {
    id: 1,
    nome: "Saulo Bezerra Lima",
    cargo: "Solicitante",
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
    cargo: "Solicitante",
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
    cargo: "Impressor",
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
    cargo: "Coordenador",
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
    cargo: "Solicitante",
    area: "História",
    matricula: "202210350027378",
    telefone: "(88) 94548-5854",
    email: "noelia@email.com",
    aprovadas: "32",
    rejeitadas: "302",
  },
];

type NewUserForm = {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  area: string;
  matricula: string;
  senha: string;
};

const emptyForm: NewUserForm = {
  nome: "",
  email: "",
  telefone: "",
  cargo: "Solicitante",
  area: "Laboratório de Redes",
  matricula: "",
  senha: "",
};

type ModalMode = "create" | "edit";

const cargoOptions = ["Administrador", "Solicitante", "Impressor", "Coordenador"];
const areaOptions = [
  "Laboratório de Redes",
  "Lab. Redes",
  "Sistemas de Informação",
  "Matemática",
  "Português",
  "História",
];

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState<NewUserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [filterCargo, setFilterCargo] = useState("");
  const router = useRouter();

  const filteredUsers = filterCargo
    ? users.filter((user) => user.cargo === filterCargo)
    : users;

  const handleAddUser = () => {
    setModalMode("create");
    setEditingUserId(null);
    setForm(emptyForm);
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmitUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modalMode === "edit") {
      alert(`Usuário ${form.nome} (ID ${editingUserId}) atualizado com sucesso!`);
    } else {
      alert(`Usuário ${form.nome} cadastrado com sucesso!`);
    }
    setIsUserModalOpen(false);
  };

  const handleEdit = (id: number) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    setModalMode("edit");
    setEditingUserId(id);
    setForm({
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      cargo: user.cargo,
      area: user.area,
      matricula: user.matricula,
      senha: "",
    });
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const handleDelete = (id: number) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    setDeleteTarget(user);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setUsers((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    setSuccessMsg("Cadastro excluído com sucesso!");
  };

  const closeSuccess = () => setSuccessMsg("");

  const handleLogout = () => {
    router.push("/");
  };

  useEffect(() => {
    if (!deleteTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelDelete();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efefef] font-[Poppins,sans-serif]">
      <style>{`
        .table-grid {
          display: grid;
          grid-template-columns: 70px 1.6fr 0.9fr 1.2fr 1.1fr 1.1fr 1.3fr 1fr 1fr 0.9fr;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 1400px) {
          .table-grid { min-width: 1300px; }
        }
        .shadow-soft { box-shadow: 0 10px 30px rgba(0,0,0,.08); }
        .shadow-nav { box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
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
                <p className="mt-1 text-[22px] leading-tight text-white/75">Administrador</p>
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

            <button
              type="button"
              onClick={() => router.push("/perfil")}
              className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-left text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Perfil
              </span>
            </button>

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
          <div className="mx-auto max-w-350 pt-16">
            <div className="mb-8 flex items-center justify-end gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base">👤</span>
                <select
                  value={filterCargo}
                  onChange={(e) => setFilterCargo(e.target.value)}
                  className="h-[41px] w-[243px] rounded-[15px] border pl-9 pr-4 text-sm text-[#333] outline-none"
                  style={{ border: "1px solid #999" }}
                >
                  <option value="">Todos os tipos</option>
                  {cargoOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddUser}
                className="h-[41px] w-[243px] rounded-[15px] bg-[#28a745] text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#218838]"
                style={{ cursor: "pointer", border: "none" }}
              >
                Adicionar usuário
              </button>
            </div>

            <div className="rounded-3xl bg-transparent">
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Header */}
                  <div className="table-grid mb-2 rounded-xl bg-[#f6f6f6] px-6 py-4 text-[14px] font-semibold text-[#222] shadow-sm">
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
                  <div className="shadow-soft divide-y divide-black/5 rounded-xl bg-white text-[13px] text-[#5b5b5b]">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="table-grid px-6 py-5">
                        <div>{user.id}</div>
                        <div>{user.nome}</div>
                        <div>{user.cargo}</div>
                        <div>{user.area}</div>
                        <div>{user.matricula}</div>
                        <div>{user.telefone}</div>
                        <div className="truncate pr-2">{user.email}</div>
                        <div>{user.aprovadas}</div>
                        <div>{user.rejeitadas}</div>
                        <div className="flex items-center justify-center gap-4 text-[16px]">
                          <button
                            onClick={() => handleEdit(user.id)}
                            className="text-blue-600 transition hover:scale-110"
                            title="Editar"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 transition hover:scale-110"
                            title="Excluir"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
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

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="shadow-soft max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-3xl bg-white p-10">
            <h2 className="border-b border-black/20 pb-4 text-center text-[26px] font-bold text-[#1f1f1f]">
              {modalMode === "edit" ? "Editar Usuário" : "Cadastrar Usuário"}
            </h2>

            <form onSubmit={handleSubmitUser} className="mt-6 space-y-4">
              <div>
                <label htmlFor="nome" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Nome Completo
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="nome e sobrenome"
                  value={form.nome}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="augusto@email.com"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              <div>
                <label htmlFor="telefone" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Telefone
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  placeholder="(88) 99222 - 29292"
                  value={form.telefone}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              <div>
                <label htmlFor="cargo" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Cargo
                </label>
                <select
                  id="cargo"
                  name="cargo"
                  value={form.cargo}
                  onChange={handleFormChange}
                  className="w-full appearance-none rounded-full border border-black/30 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23333%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[right_1.25rem_center] bg-no-repeat px-5 py-2.5 pr-10 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                >
                  {cargoOptions.includes(form.cargo) ? null : (
                    <option value={form.cargo}>{form.cargo}</option>
                  )}
                  {cargoOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="area" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Departamento/Área
                </label>
                <select
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={handleFormChange}
                  className="w-full appearance-none rounded-full border border-black/30 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23333%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[right_1.25rem_center] bg-no-repeat px-5 py-2.5 pr-10 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                >
                  {areaOptions.includes(form.area) ? null : (
                    <option value={form.area}>{form.area}</option>
                  )}
                  {areaOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="matricula" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Matrícula no SUAP
                </label>
                <input
                  id="matricula"
                  name="matricula"
                  type="text"
                  placeholder="123456"
                  value={form.matricula}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              <div>
                <label htmlFor="senha" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    name="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder={modalMode === "edit" ? "deixe em branco para manter" : "••••••••"}
                    value={form.senha}
                    onChange={handleFormChange}
                    required={modalMode === "create"}
                    className="w-full rounded-full border border-black/30 px-5 py-2.5 pr-12 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute inset-y-0 right-4 flex items-center text-[#555] transition hover:text-[#2ea03b]"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.77 21.77 0 0 1-3.17 4.19" />
                        <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-6 pt-4">
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="rounded-xl bg-[#d92d2d] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#bf2525]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2ea03b] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#258a31]"
                >
                  {modalMode === "edit" ? "Editar" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex animate-[fadeIn_0.2s_ease] items-center justify-center bg-black/50">
          <div
            className="flex animate-[scaleIn_0.2s_ease] flex-col items-center rounded-[14px] bg-white text-center"
            style={{
              width: "420px",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            <h2 className="text-[22px] font-bold text-[#111]">
              Tem certeza que deseja excluir?
            </h2>

            <div className="mt-7 flex gap-4">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-[10px] border border-[#d1d5db] bg-white px-7 py-3 text-[15px] font-semibold text-[#111] transition-all duration-200 hover:bg-[#f3f4f6]"
                style={{ cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-[10px] bg-[#dc2626] px-7 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#b91c1c]"
                style={{ cursor: "pointer", border: "none" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div
          className="fixed inset-0 z-50 flex animate-[fadeIn_0.2s_ease] items-center justify-center bg-black/50"
          onClick={closeSuccess}
        >
          <div
            className="flex animate-[scaleIn_0.2s_ease] flex-col items-center rounded-[14px] bg-white text-center"
            style={{
              width: "420px",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-6 text-lg font-bold text-[#111]">
              {successMsg}
            </h2>
            <div className="flex h-20 w-20 items-center justify-center">
              <Image src={checkCircle} alt="" width={80} height={80} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
