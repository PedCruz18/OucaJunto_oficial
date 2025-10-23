(function(){
  const KEY = 'oucaSession'; // armazenaremos JSON {id, createdAt}

  // função para garantir que a sessão está ativa
  async function ensureSession(){
    try {

      // tenta ler sessão armazenada no localStorage
      const storedRaw = localStorage.getItem(KEY);
      let stored = null;
      if (storedRaw) {
        try { stored = JSON.parse(storedRaw); } catch (e) { stored = null; }
      }

      // se já houver sessão armazenada, exibe o ID imediatamente no UI
      if (stored && stored.id) {
        updateSidebarSessionId(stored.id);
      }

      // constrói URL de requisição
      let url = '/api/session-debug';
      if (stored && stored.id && stored.createdAt) {
        url += '?id=' + encodeURIComponent(stored.id) + '&createdAt=' + encodeURIComponent(stored.createdAt);
      }

      // busca a sessão do backend (sem cache)
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) {
        console.error('falha ao obter debug da sessão', resp.status);
        return;
      }

      // aguarda e lê JSON da resposta
      const json = await resp.json();

      // Esperamos apenas { id, createdAt } do backend; salvamos no localStorage como JSON
      if (json && json.id && json.createdAt) {
        localStorage.setItem(KEY, JSON.stringify({ id: json.id, createdAt: json.createdAt }));
        
        // Atualiza o ID na sidebar
        updateSidebarSessionId(json.id);
      }

      // imprimir apenas a resposta JSON 
      console.log(json);

    } catch (err) {
      console.error('erro na sessão:', err);
    }
  }

  // função para atualizar o ID da sessão na sidebar
  function updateSidebarSessionId(sessionId) {
    const sessionIdText = document.getElementById('sessionIdText');
    if (sessionIdText) {
      sessionIdText.textContent = sessionId;
    }
  }

  // aguarda o carregamento do DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSession);
  } else {
    ensureSession();
  }
})();
