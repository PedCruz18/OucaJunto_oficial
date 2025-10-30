// As funções utilitárias de containers foram movidas para
// `public/js/containers.js` para separar responsabilidades.
// Certifique-se de carregar esse arquivo antes de `central.js`.
if (typeof window !== 'undefined' && !window.ContainerUtils) {
    // ContainerUtils missing — UI may behave degraded if not loaded before central.js
}
// A lógica da sidebar (lista de usuários, updater e tratamento de eventos como
// 'room:closed') foi movida para `public/js/sidebar.js`.
// Certifique-se de carregar `sidebar.js` antes de `central.js`.
if (typeof window !== 'undefined' && !window.startRoomUsersUpdater) {
    // Sidebar logic missing — room users updater may not be available
}

/**
 * ==============================================
 * 🏗️ CREATE ROOM FORM (ouvintes + validações)
 * ==============================================
 */
(() => {
    const listenerChoices = document.querySelectorAll('.listener-choice');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const roomInputBox = document.querySelector('.room-input-box');
    const joinBtn = document.getElementById('joinBtn');
    const expandedContent = document.getElementById('expandedContent');
    const roomInput = document.getElementById('roomCode');
    const roomHelp = document.getElementById('roomHelp');

    const MIN_LISTENERS = 1;

    // Usar a função global `showTemporaryError` definida em `public/js/containers.js`.
    // Ela é exposta como `window.showTemporaryError` e estará disponível se
    // `containers.js` for carregado antes de `central.js` (veja template).

    /**
     * Reseta o estado da interface após criar sala
     */
    const resetToInitialState = (message = 'Carregando...') => {
        // Usar utility para fechar container
        ContainerUtils.closeContainer(roomInputBox, joinBtn, {
            containerClass: 'expanded',
            triggerClass: null,
            triggerLabel: 'Entrar na sala',
            triggerContent: '+',
            display: 'none'
        });

        expandedContent?.setAttribute('aria-hidden', 'true');

        if (roomInput) {
            roomInput.disabled = false;
            roomInput.removeAttribute('aria-disabled');
            const placeholder = roomInput.dataset._placeholder || '';
            if (placeholder) roomInput.placeholder = placeholder;
        }

        createRoomBtn.disabled = true;
        if (roomHelp) roomHelp.textContent = message;
    };

    // --- Escolha de ouvintes
    listenerChoices.forEach(btn => {
        btn.addEventListener('click', () => {
            listenerChoices.forEach(b => b.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');

            const container = document.querySelector('.listener-choices') || btn.parentElement;
            container?.classList.remove('input-error');
            btn.removeAttribute('aria-invalid');
        });
    });

    // --- Criar sala (chama API e redireciona para a sala criada (dentro da mesma pagina))
    createRoomBtn?.addEventListener('click', async () => {
        const name = document.getElementById('newRoomName')?.value.trim() || '';
        const genre = document.getElementById('newRoomGenre')?.value || '';
        const selected = document.querySelector('.listener-choice[aria-pressed="true"]');
        const num = selected ? Number(selected.dataset.value) : null;

        // Validações
        if (!name) {
            const field = document.getElementById('newRoomName');
            showTemporaryError(field);
            field?.focus();
            return;
        }

        if (!genre) {
            const field = document.getElementById('newRoomGenre');
            showTemporaryError(field);
            field?.focus();
            return;
        }

        if (!selected || isNaN(num) || num < MIN_LISTENERS) {
            const container = document.querySelector('.listener-choices') || selected?.parentElement;
            showTemporaryError(container);
            selected?.setAttribute('aria-invalid', 'true');
            (selected || listenerChoices[0])?.focus();
            return;
        }

    // indicar carregamento na UI: fechar/ocultar o container e mostrar mensagem
    resetToInitialState('Criando sala...');

        try {
            // Delegar a criação da sala ao módulo cliente (isolando lógica de rede)
            const data = await window.ClientRoomSystem.createRoom({ name, genre, num });

            // atualizar UI: informar sucesso e manter o formulário oculto
            if (roomHelp) roomHelp.textContent = 'Sala criada.';

            // Iniciar ping automático para a sala recém-criada
            const roomId = data && data.room && data.room.id ? data.room.id : null;
            if (roomId) {
                window.ClientRoomSystem.startRoomPing(roomId);
                try { if (typeof window.startRoomUsersUpdater === 'function') window.startRoomUsersUpdater(roomId); } catch (e) { /* ignore */ }
                // atualizar status de conexão na sidebar
                setConnectionStatus(`Conectado a ${roomId}`);
                try {
                    setSidebarRoomInfo({ name: data && data.room ? data.room.name : '', genre: data && data.room ? data.room.genre : '' });
                } catch (e) { /* ignore */ }
            }

        } catch (err) {
            console.error('[CreateRoom] erro ao criar sala', err);
            if (roomHelp) roomHelp.textContent = 'Erro ao criar sala';
            showTemporaryError(createRoomBtn);
            createRoomBtn.disabled = false;
        }
    });
})();


/**
 * ==============================================
 * 🚪 BOTÃO DE SAIR DA SALA
 * ==============================================
 */
(() => {
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    
    if (!leaveRoomBtn) {
        console.warn('[LeaveRoom] Botão não encontrado.');
        return;
    }

    leaveRoomBtn.addEventListener('click', () => {
        try {
            console.log('[LeaveRoom] Usuário saiu da sala manualmente');
            
            // Parar ping
            if (window.ClientRoomSystem && typeof window.ClientRoomSystem.stopRoomPing === 'function') {
                window.ClientRoomSystem.stopRoomPing();
            }
            // limpar informações da sidebar imediatamente
            try { setSidebarRoomInfo(null); } catch (e) {}
            
            // Disparar evento de sala fechada para resetar a UI completamente
            if (typeof window.CustomEvent === 'function') {
                window.dispatchEvent(new CustomEvent('room:closed', { detail: { roomId: null, manual: true } }));
            }
        } catch (err) {
            console.error('[LeaveRoom] Erro ao sair da sala', err);
        }
    });
})();
