// sidebar.js
// Lógica da sidebar (status, infos da sala e tratamento de evento room:closed).

/**
 * Atualiza o texto de status de conexão na sidebar.
 * Ex: 'Conectado a ABC123' ou reseta para 'SEM CONEXÃO' quando vazio.
 */
function setConnectionStatus(text) {
    try {
        const el = document.getElementById('connection-status');
        const leaveBtn = document.getElementById('leaveRoomBtn');
        if (!el) return;
        el.textContent = text && String(text).length ? text : 'SEM CONEXÃO';
        
        // Mostrar botão de sair apenas se estiver conectado
        if (leaveBtn) {
            if (text && String(text).length && text !== 'SEM CONEXÃO') {
                // forçar display compatível com a regra de CSS (#leaveRoomBtn { display: none })
                leaveBtn.style.display = 'inline-flex';
                leaveBtn.disabled = false;
            } else {
                leaveBtn.style.display = 'none';
                leaveBtn.disabled = true;
            }
        }
    } catch (e) {
        // ignore
    }
}

/**
 * Atualiza o nome e gênero da sala exibidos na sidebar.
 * passar null para esconder.
 */
function setSidebarRoomInfo(room) {
    try {
        const nameEl = document.getElementById('sidebarRoomName');
        const genreEl = document.getElementById('sidebarRoomGenre');
        if (!nameEl || !genreEl) return;

        if (room && (room.name || room.genre)) {
            nameEl.textContent = room.name || '';
            genreEl.textContent = room.genre || '';
            // usar display explícito para sobrescrever o CSS que pode esconder esses elementos
            nameEl.style.display = 'block';
            genreEl.style.display = 'block';
        } else {
            nameEl.textContent = '';
            genreEl.textContent = '';
            nameEl.style.display = 'none';
            genreEl.style.display = 'none';
        }
    } catch (e) {
        // ignore
    }
}

// expor globalmente
if (typeof window !== 'undefined') {
    window.setConnectionStatus = setConnectionStatus;
    window.setSidebarRoomInfo = setSidebarRoomInfo;
}

// Aviso caso o módulo de room-users não tenha sido carregado antes
if (typeof window !== 'undefined' && !window.startRoomUsersUpdater) {
    console.warn('[sidebar.js] room-users não encontrado. Carregue `/js/room-users.js` antes de `sidebar.js`.');
}

// Listener global: quando o servidor/monitor remover a sala, atualizamos a UI
window.addEventListener('room:closed', (e) => {
    try {
        const roomId = e && e.detail && e.detail.roomId ? e.detail.roomId : null;
        const roomHelp = document.getElementById('roomHelp');
        const joinBtn = document.getElementById('joinBtn');
        const roomInputBox = document.querySelector('.room-input-box');
        const roomInputWrapper = document.querySelector('.room-input-wrapper');
        const roomInput = document.getElementById('roomCode');
        const sessionDisp = document.getElementById('sessionIdDisplay');

        if (roomHelp) roomHelp.textContent = 'Saindo..';
        if (sessionDisp) sessionDisp.textContent = 'PING: 0ms';
        // reset status de conexão
        if (typeof setConnectionStatus === 'function') try { setConnectionStatus(); } catch (e) {}
        // limpar info da sala na sidebar
        try { if (typeof setSidebarRoomInfo === 'function') setSidebarRoomInfo(null); } catch (e) {}
        // esconder container de usuários imediatamente - delegar ao mesmo procedimento usado pelo botão de desconectar
        try {
            try { if (typeof setSidebarRoomInfo === 'function') setSidebarRoomInfo(null); } catch (er) {}

            // Garantir que o updater que atualiza a lista de usuários seja parado
            try {
                if (typeof window.stopRoomUsersUpdater === 'function') {
                    window.stopRoomUsersUpdater();
                }
            } catch (er) {}
        } catch (e) {}
        // Reset imediato do preview/confirm (garantir que o container de 'entrar' volte ao estado inicial)
        try {
            const previewNow = document.getElementById('roomPreviewContent');
            const expandedNow = document.getElementById('expandedContent');
            const confirmNow = document.getElementById('confirmJoinBtn');

            if (previewNow) {
                previewNow.setAttribute('aria-hidden', 'true');
                try { previewNow.style.display = 'none'; } catch (e) {}
            }

            if (confirmNow) {
                // limpar dados do botão de confirmação
                try { delete confirmNow.dataset.roomId; } catch (e) {}
                confirmNow.disabled = false;
                try { confirmNow.textContent = 'ENTRAR'; } catch (e) {}
            }

            if (expandedNow) {
                // garantir que o conteúdo de criação fique oculto imediatamente
                expandedNow.setAttribute('aria-hidden', 'true');
                try { expandedNow.style.display = 'none'; } catch (e) {}
            }

            if (roomInputBox) roomInputBox.classList.remove('room-preview');
        } catch (e) {
            // ignore
        }
        // após alguns segundos, resetar o container de input como se o usuário tivesse acabado de entrar na página
        try {
            setTimeout(() => {
                try {
                    const expanded = document.getElementById('expandedContent');
                    const preview = document.getElementById('roomPreviewContent');
                    // esconder preview e expanded
                    if (preview) {
                        preview.setAttribute('aria-hidden', 'true');
                        preview.style.display = 'none';
                    }
                    if (expanded) {
                        expanded.setAttribute('aria-hidden', 'true');
                        expanded.style.display = 'none';
                    }

                    // restaurar estado do input box
                    if (roomInputBox) roomInputBox.classList.remove('room-preview');
                    if (joinBtn) {
                        joinBtn.textContent = '+';
                        try { joinBtn.setAttribute('aria-expanded', 'false'); } catch (e) {}
                    }
                    if (roomInput) {
                        roomInput.value = '';
                        roomInput.disabled = false;
                        roomInput.removeAttribute('data-preview-id');
                        // focar para facilitar nova entrada
                        try { roomInput.focus(); } catch (e) {}
                    }

                    // restaurar mensagem de ajuda padrão
                    if (roomHelp) roomHelp.textContent = 'INSIRA UM CÓDIGO OU CRIE UMA SALA.';

                    // garantir que o wrapper esteja visível
                    if (roomInputWrapper) roomInputWrapper.style.display = '';
                    // garantir que a caixa de input esteja visível (pode ter sido escondida por outras rotinas)
                    if (roomInputBox) roomInputBox.style.display = 'flex';

                    // zerar display de ping (já foi feito) e garantir o sessionIdDisplay
                    if (sessionDisp) sessionDisp.textContent = 'PING: 0ms';

                    // reabilitar botão de criar sala caso estivesse desabilitado
                    try {
                        const createBtn = document.getElementById('createRoomBtn');
                        if (createBtn) {
                            createBtn.disabled = false;
                            createBtn.classList.remove('input-error');
                        }
                    } catch (e) {
                        // ignore
                    }

                } catch (e) {
                    console.error('[room:closed] erro ao resetar UI', e);
                }
            }, 4000);
        } catch (e) {
            // não bloquear caso setTimeout falhe (muito improvável)
        }

        // Parar ping caso esteja ativo
        if (window.ClientRoomSystem && typeof window.ClientRoomSystem.stopRoomPing === 'function') {
            try { window.ClientRoomSystem.stopRoomPing(); } catch (err) { /* ignore */ }
        }

        // Parar updater de usuários também (se houver)
        try { if (typeof window.stopRoomUsersUpdater === 'function') window.stopRoomUsersUpdater(); } catch (e) { /* ignore */ }

        // Reset visual do botão/input
        if (joinBtn) {
            joinBtn.disabled = false;
            joinBtn.innerHTML = '+';
            joinBtn.setAttribute('aria-label', 'Entrar na sala');
            joinBtn.removeAttribute('data-icon');
            joinBtn.classList.remove('input-error');
        }

        // Garantir que o botão de criar sala seja reabilitado ao fechar a sala
        try {
            const createBtn = document.getElementById('createRoomBtn');
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.classList.remove('input-error');
            }
        } catch (e) {
            // ignore
        }

        if (roomInput) {
            roomInput.value = '';
            roomInput.disabled = false;
            roomInput.removeAttribute('aria-disabled');
        }

        if (roomInputBox) {
            roomInputBox.classList.remove('expanded');
        }
        if (roomInputWrapper) {
            roomInputWrapper.classList.remove('expanded-state');
        }

        // garantir que a sidebar móvel seja fechada se estiver aberta
        try {
            const sidebarEl = document.getElementById('sidebar');
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            if (sidebarEl) sidebarEl.classList.remove('open');
            if (hamburgerBtn) hamburgerBtn.classList.remove('open');
        } catch (e) {}

    } catch (err) {
        console.error('[UI] failed to handle room:closed event', err);
    }
});

// Mobile: abrir/fechar sidebar via botão hamburger
(function () {
    try {
        const hamburger = document.getElementById('hamburgerBtn');
        const sidebarEl = document.getElementById('sidebar');
        if (!hamburger || !sidebarEl) return;

        hamburger.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const isOpen = hamburger.classList.toggle('open');
            try {
                if (isOpen) sidebarEl.classList.add('open');
                else sidebarEl.classList.remove('open');
            } catch (e) {}
            try { hamburger.setAttribute('aria-expanded', String(!!isOpen)); } catch (e) {}
        });

        // opcional: fechar sidebar quando clicar fora (apenas em telas menores)
        document.addEventListener('click', (ev) => {
            try {
                if (!sidebarEl.classList.contains('open')) return;
                const target = ev.target;
                if (!target) return;
                if (sidebarEl.contains(target) || hamburger.contains(target)) return;
                // fechar
                hamburger.classList.remove('open');
                sidebarEl.classList.remove('open');
                try { hamburger.setAttribute('aria-expanded', 'false'); } catch (e) {}
            } catch (e) {}
        });
    } catch (e) {
        // ignore
    }
})();
