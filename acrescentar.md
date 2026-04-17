<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Página de Cadastros</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Poppins', sans-serif; }
    .shadow-soft { box-shadow: 0 10px 30px rgba(0,0,0,.08); }
    .shadow-nav { box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
    .table-grid {
      display: grid;
      grid-template-columns: 52px 1.5fr 0.85fr 1.1fr 1fr 1fr 1.2fr 0.9fr 0.9fr 0.7fr;
      align-items: center;
    }
    @media (max-width: 1200px) {
      .table-grid { min-width: 1050px; }
    }
  </style>
</head>
<body class="bg-[#efefef] min-h-screen overflow-x-hidden">
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-[300px] bg-[#2ea03b] text-white flex flex-col px-6 py-8 relative">
      <div class="flex items-center gap-4 mb-12">
        <div class="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/15 shadow-lg bg-white/20">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" alt="Avatar" class="w-full h-full object-cover">
        </div>
        <div>
          <h2 class="text-[24px] font-semibold leading-none">Augusto</h2>
          <p class="text-white/75 text-[22px] leading-tight mt-1">Professor</p>
        </div>
      </div>

      <nav class="space-y-3 text-[18px] font-medium">
        <a href="#" class="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/10 transition shadow-nav">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4zm0-3h7v1h-7v-1z"/></svg>
          <span class="text-[17px]">Início</span>
        </a>

        <a href="#" class="flex items-center gap-4 px-3 py-3 rounded-2xl bg-[#228d2e] shadow-nav">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h8l4 4v14H5V3h2z"/><path d="M15 3v5h5"/><path d="M8 11h8M8 15h8M8 7h3"/></svg>
          <span class="text-[17px]">Cadastros</span>
        </a>

        <a href="#" class="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/10 transition shadow-nav">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z"/></svg>
          <span class="text-[17px]">Perfil</span>
        </a>

        <a href="#" class="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/10 transition shadow-nav mt-1">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M10 17v-2H3V9h7V7l4 5-4 5Zm4 4h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3v2h3v14h-3v2Z"/></svg>
          <span class="text-[17px]">Sair</span>
        </a>
      </nav>
    </aside>

    <!-- Main -->
    <main class="flex-1 relative px-16 pt-20 pb-16">
      <!-- Fullscreen message -->
      <div class="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[960px] max-w-[calc(100%-60px)] bg-[#1f1f1f] text-white rounded-xl border-2 border-white/80 shadow-2xl px-12 py-5 flex items-center justify-between">
        <p class="text-[18px] md:text-[20px] tracking-[0.01em] text-center flex-1 pr-6">
          Para sair da tela inteira, mova o mouse para a parte superior da tela ou pressione e segure
        </p>
        <div class="shrink-0 border border-white/70 rounded-md px-4 py-2 text-[18px] font-semibold">Esc</div>
      </div>

      <div class="max-w-[980px] mx-auto pt-16">
        <div class="flex items-center justify-end mb-8">
          <button id="addUserBtn" class="bg-[#37a93f] hover:bg-[#2f9737] text-white font-semibold text-[18px] px-6 py-3 rounded-2xl shadow-soft transition">
            Adicionar usuário
          </button>
        </div>

        <div class="bg-transparent rounded-3xl">
          <div class="overflow-x-auto">
            <div class="min-w-full">
              <!-- Header -->
              <div class="table-grid bg-[#f6f6f6] text-[#222] text-[12px] font-semibold rounded-xl px-5 py-3 mb-1 shadow-sm">
                <div>ID</div>
                <div>Nome</div>
                <div>Cargo</div>
                <div>Depart./Área</div>
                <div>Matrícula</div>
                <div>Telefone</div>
                <div>Email</div>
                <div>Solicitações<br>Aprovadas</div>
                <div>Solicitações<br>Rejeitadas</div>
                <div class="text-center">OPÇÕES</div>
              </div>

              <!-- Rows -->
              <div class="bg-white rounded-xl shadow-soft divide-y divide-black/5 text-[10px] text-[#5b5b5b]">
                <div class="table-grid px-5 py-4">
                  <div>1</div>
                  <div>Saulo Bezerra Lima</div>
                  <div>Professor</div>
                  <div>Sistemas de Informação</div>
                  <div>2022103500273</div>
                  <div>(88) 94548-5854</div>
                  <div class="truncate pr-2">saulo@email.com</div>
                  <div>45</div>
                  <div>455</div>
                  <div class="flex items-center justify-center gap-3 text-[14px]">
                    <button class="text-blue-600 hover:scale-110 transition" title="Editar">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z"/></svg>
                    </button>
                    <button class="text-red-600 hover:scale-110 transition" title="Excluir">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z"/></svg>
                    </button>
                  </div>
                </div>

                <div class="table-grid px-5 py-4">
                  <div>2</div>
                  <div>Lívia Pereira Torres</div>
                  <div>Professor</div>
                  <div>Português</div>
                  <div>2022103500278</div>
                  <div>(88) 94548-5854</div>
                  <div class="truncate pr-2">livia@email.com</div>
                  <div>33</div>
                  <div>323</div>
                  <div class="flex items-center justify-center gap-3 text-[14px]">
                    <button class="text-blue-600 hover:scale-110 transition" title="Editar">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z"/></svg>
                    </button>
                    <button class="text-red-600 hover:scale-110 transition" title="Excluir">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z"/></svg>
                    </button>
                  </div>
                </div>

                <div class="table-grid px-5 py-4">
                  <div>3</div>
                  <div>Mário Ribeiro de Sousa Alcantara</div>
                  <div>Técnico</div>
                  <div>Lab. Redes</div>
                  <div>2022103500298</div>
                  <div>(88) 94548-5854</div>
                  <div class="truncate pr-2">marioribeirosousa29@email.com</div>
                  <div>03</div>
                  <div>12</div>
                  <div class="flex items-center justify-center gap-3 text-[14px]">
                    <button class="text-blue-600 hover:scale-110 transition" title="Editar">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z"/></svg>
                    </button>
                    <button class="text-red-600 hover:scale-110 transition" title="Excluir">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z"/></svg>
                    </button>
                  </div>
                </div>

                <div class="table-grid px-5 py-4">
                  <div>4</div>
                  <div>Maria Francisca de Lima Mota</div>
                  <div>Professor</div>
                  <div>Matemática</div>
                  <div>202210350027389</div>
                  <div>(88) 94548-5854</div>
                  <div class="truncate pr-2">maria@email.com</div>
                  <div>69</div>
                  <div>869</div>
                  <div class="flex items-center justify-center gap-3 text-[14px]">
                    <button class="text-blue-600 hover:scale-110 transition" title="Editar">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z"/></svg>
                    </button>
                    <button class="text-red-600 hover:scale-110 transition" title="Excluir">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z"/></svg>
                    </button>
                  </div>
                </div>

                <div class="table-grid px-5 py-4">
                  <div>5</div>
                  <div>Noélia Devanir da Silva Lima</div>
                  <div>Professor</div>
                  <div>História</div>
                  <div>202210350027378</div>
                  <div>(88) 94548-5854</div>
                  <div class="truncate pr-2">noelia@email.com</div>
                  <div>32</div>
                  <div>302</div>
                  <div class="flex items-center justify-center gap-3 text-[14px]">
                    <button class="text-blue-600 hover:scale-110 transition" title="Editar">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z"/></svg>
                    </button>
                    <button class="text-red-600 hover:scale-110 transition" title="Excluir">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    document.getElementById('addUserBtn').addEventListener('click', () => {
      alert('Botão Adicionar usuário clicado!');
    });

    document.querySelectorAll('[title="Editar"]').forEach((btn, index) => {
      btn.addEventListener('click', () => alert(`Editar usuário ID ${index + 1}`));
    });

    document.querySelectorAll('[title="Excluir"]').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const confirmed = confirm(`Deseja excluir o usuário ID ${index + 1}?`);
        if (confirmed) alert('Usuário removido com sucesso!');
      });
    });
  </script>
</body>
</html>
