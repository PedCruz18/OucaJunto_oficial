// containers.js
// Utilities para abrir/fechar/toggle containers e funções auxiliares relacionadas.
// Moved from central.js to centralize container logic.

const ContainerUtils = {
    openContainer(container, trigger, options = {}) {
        const {
            containerClass = 'open',
            triggerClass = 'open',
            triggerLabel = 'Fechar',
            triggerContent = null,
            display = null,
            tabIndex = null
        } = options;

        if (!container) return;

        container.classList.add(containerClass);
        container.setAttribute('aria-hidden', 'false');

        if (trigger) {
            if (triggerClass) try { trigger.classList.add(triggerClass); } catch (e) {}
            try { trigger.setAttribute('aria-expanded', 'true'); } catch (e) {}
            if (triggerLabel) try { trigger.setAttribute('aria-label', triggerLabel); } catch (e) {}
            if (triggerContent !== null) try { trigger.innerHTML = triggerContent; } catch (e) {}
        }

        if (display) try { container.style.display = display; } catch (e) {}
        if (tabIndex !== null) try { container.tabIndex = tabIndex; } catch (e) {}
    },

    closeContainer(container, trigger, options = {}) {
        const {
            containerClass = 'open',
            triggerClass = 'open',
            triggerLabel = 'Abrir',
            triggerContent = null,
            display = null,
            tabIndex = null,
            // seletor opcional para onde mover o foco caso o elemento ativo esteja dentro do container
            fallbackFocusSelector = '#mainContent'
        } = options;

        // --- Segurança de foco: se o elemento ativo estiver dentro do container,
        // movemos o foco para um elemento de fallback antes de esconder o container.
        try {
            const active = document.activeElement;
            if (active && container && container.contains(active)) {
                try {
                    const fallback = document.querySelector(fallbackFocusSelector);
                    if (fallback && typeof fallback.focus === 'function') {
                        fallback.focus({ preventScroll: true });
                    } else if (document.body && typeof document.body.focus === 'function') {
                        document.body.focus({ preventScroll: true });
                    }
                } catch (e) {
                    // ignore fallback focus errors
                }
            }
        } catch (err) {
            // se algo falhar, não interromper a execução
        }

        if (!container) return;

        container.classList.remove(containerClass);
        container.setAttribute('aria-hidden', 'true');

        if (trigger) {
            if (triggerClass) try { trigger.classList.remove(triggerClass); } catch (e) {}
            try { trigger.setAttribute('aria-expanded', 'false'); } catch (e) {}
            if (triggerLabel) try { trigger.setAttribute('aria-label', triggerLabel); } catch (e) {}
            if (triggerContent !== null) try { trigger.innerHTML = triggerContent; } catch (e) {}
        }

        if (display) try { container.style.display = display; } catch (e) {}
        if (tabIndex !== null) try { container.tabIndex = tabIndex; } catch (e) {}
    },

    toggleContainer(container, trigger, openOptions = {}, closeOptions = {}) {
        const containerClass = openOptions.containerClass || 'open';
        const isOpen = container && container.classList ? container.classList.contains(containerClass) : false;

        if (isOpen) {
            this.closeContainer(container, trigger, closeOptions);
        } else {
            this.openContainer(container, trigger, openOptions);
        }

        return !isOpen;
    },

    setupAccessibility(container, trigger, options = {}) {
        const {
            containerId = container && container.id ? container.id : null,
            initialExpanded = false,
            initialLabel = 'Abrir',
            tabIndex = -1
        } = options;

        if (trigger && containerId) {
            try { trigger.setAttribute('aria-controls', containerId); } catch (e) {}
            try { trigger.setAttribute('aria-expanded', String(initialExpanded)); } catch (e) {}
            try { trigger.setAttribute('aria-label', initialLabel); } catch (e) {}
        }

        if (container) {
            try { container.setAttribute('aria-hidden', String(!initialExpanded)); } catch (e) {}
            if (tabIndex !== null) try { container.tabIndex = tabIndex; } catch (e) {}
        }
    }
};

/**
 * Função utilitária global para destacar temporariamente um elemento com erro
 * Uso: showTemporaryError(element, durationMs)
 */
function showTemporaryError(element, duration = 1200) {
    if (!element) return;
    try {
        element.classList.add('input-error');
        setTimeout(() => element.classList.remove('input-error'), duration);
    } catch (e) {
        // ignore DOM errors
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.ContainerUtils = ContainerUtils;
    window.showTemporaryError = showTemporaryError;
}

/**
 * ==============================================
 * 💬 ROOM JOIN / EXPAND INPUT AREA
 * (moved from central.js)
 * ==============================================
 */
(function () {
    const joinBtn = document.getElementById('joinBtn');
    const roomInputBox = document.querySelector('.room-input-box');
    const roomInput = document.getElementById('roomCode');
    const expandedContent = document.getElementById('expandedContent');
    const roomHelp = document.getElementById('roomHelp');
    const roomInputWrapper = document.querySelector('.room-input-wrapper');
    const roomPreviewContent = document.getElementById('roomPreviewContent');
    const confirmJoinBtn = document.getElementById('confirmJoinBtn');

    if (!joinBtn || !roomInputBox || !roomInput) {
        console.warn('[RoomJoin] Elementos não encontrados. Script abortado.');
        return;
    }

    const RIGHT_ARROW_SVG = `
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
            <path d="M5 12h14M13 6l6 6-6 6" 
                  stroke="currentColor" stroke-width="2" 
                  stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
    `;

    // --- Configuração inicial de acessibilidade
    ContainerUtils.setupAccessibility(roomInputBox, joinBtn, {
        initialExpanded: false,
        initialLabel: 'Entrar na sala'
    });

    /** 🔓 Expande o campo de entrada */
    const openExpand = () => {
        // Garantir que o container esteja visível (pode ter sido escondido por outras rotinas)
        try { if (roomInputBox) roomInputBox.style.display = 'flex'; } catch (e) {}

        ContainerUtils.openContainer(roomInputBox, joinBtn, {
            containerClass: 'expanded',
            triggerClass: null, // Não usar classe no trigger
            triggerLabel: 'Fechar',
            triggerContent: '✕'
        });

        // Adiciona classe no wrapper para compatibilidade com browsers antigos
        roomInputWrapper?.classList.add('expanded-state');

        // Restaurar visibilidade do conteúdo expandido (pode ter sido marcado com display:none)
        expandedContent?.setAttribute('aria-hidden', 'false');
        try { if (expandedContent) expandedContent.style.display = ''; } catch (e) {}

        // Garantir que o preview esteja oculto quando abrimos o formulário de criação
        try { const rpc = document.getElementById('roomPreviewContent'); if (rpc) rpc.style.display = 'none'; } catch (e) {}

        // Configurações específicas do input
        roomInput.dataset._placeholder = roomInput.placeholder || '';
        roomInput.removeAttribute('placeholder');
        roomInput.disabled = true;
        roomInput.setAttribute('aria-disabled', 'true');

        joinBtn.focus();
    };

    /** 🔒 Fecha o campo expandido */
    const closeExpand = () => {
        ContainerUtils.closeContainer(roomInputBox, joinBtn, {
            containerClass: 'expanded',
            triggerClass: null, // Não usar classe no trigger
            triggerLabel: 'Entrar na sala',
            triggerContent: '+'
        });

        // Remove classe do wrapper para compatibilidade com browsers antigos
        roomInputWrapper?.classList.remove('expanded-state');

        expandedContent?.setAttribute('aria-hidden', 'true');

        // Restaurar configurações do input
        const placeholder = roomInput.dataset._placeholder || '';
        if (placeholder) roomInput.placeholder = placeholder;

        roomInput.disabled = false;
        roomInput.removeAttribute('aria-disabled');
    };

    /** ⏳ Oculta input e mostra "carregando" */
    const showLoadingState = () => {
        ContainerUtils.closeContainer(roomInputBox, joinBtn, {
            containerClass: 'expanded',
            triggerClass: null,
            triggerLabel: 'Entrar na sala',
            triggerContent: '+',
            display: 'none'
        });

        // Remove classe do wrapper para compatibilidade com browsers antigos
        roomInputWrapper?.classList.remove('expanded-state');

        joinBtn.disabled = true;
        expandedContent?.setAttribute('aria-hidden', 'true');
        roomPreviewContent?.setAttribute('aria-hidden', 'true');

        // Restaurar input para estado normal
        roomInput.disabled = false;
        roomInput.removeAttribute('aria-disabled');
        if (roomInput.dataset._placeholder)
            roomInput.placeholder = roomInput.dataset._placeholder;

        if (roomHelp) roomHelp.textContent = 'Carregando...';
    };

    /** 🏠 Mostra preview da sala com informações e botão para entrar */
    const showRoomPreview = (roomInfo, roomId) => {
        // mostrar o container novamente
        roomInputBox.style.display = 'flex';
        roomInputBox.classList.add('expanded', 'room-preview');
        roomInputWrapper?.classList.add('expanded-state');

        // garantir que o conteúdo de criação de sala esteja completamente oculto
        expandedContent?.setAttribute('aria-hidden', 'true');
        if (expandedContent) {
            expandedContent.style.display = 'none';
        }
        
        // mostrar conteúdo de preview
        roomPreviewContent?.setAttribute('aria-hidden', 'false');
        if (roomPreviewContent) {
            roomPreviewContent.style.display = 'block';
        }

        // preencher informações
        const titleEl = document.getElementById('previewRoomTitle');
        const nameEl = document.getElementById('previewRoomName');
        const genreEl = document.getElementById('previewRoomGenre');
        
        if (titleEl) titleEl.textContent = `SALA ${roomId.toUpperCase()} ENCONTRADA!`;
        if (nameEl) nameEl.textContent = `${roomInfo.name || 'SEM NOME'}`;
        if (genreEl) genreEl.textContent = `${roomInfo.genre || 'SEM GÊNERO'}`;

        // configurar botão de entrada
        if (confirmJoinBtn) {
            confirmJoinBtn.disabled = false;
            confirmJoinBtn.dataset.roomId = roomId;
        }

        // configurar botão de fechar (X)
        joinBtn.disabled = false;
        joinBtn.innerHTML = '✕';
        joinBtn.setAttribute('aria-label', 'Fechar preview');

        if (roomHelp) roomHelp.textContent = `${roomInfo.usersCount}/${roomInfo.maxUsers} ouvintes`;
    };

    /** 🔒 Fecha o preview da sala e volta ao estado inicial */
    const closePreview = () => {
        roomInputBox.classList.remove('expanded', 'room-preview');
        roomInputWrapper?.classList.remove('expanded-state');
        
        // ocultar preview e restaurar display do conteúdo de criação
        roomPreviewContent?.setAttribute('aria-hidden', 'true');
        if (roomPreviewContent) {
            roomPreviewContent.style.display = 'none';
        }
        if (expandedContent) {
            expandedContent.style.display = '';  // restaurar display original
        }
        
        // restaurar botão e input
        joinBtn.innerHTML = '+';
        joinBtn.setAttribute('aria-label', 'Entrar na sala');
        joinBtn.disabled = false;
        
        roomInput.value = '';
        roomInput.disabled = false;
        
        if (roomHelp) roomHelp.textContent = 'INSIRA UM CÓDIGO OU CRIE UMA SALA.';
    };

    // Event listener para o botão de confirmação de entrada
    confirmJoinBtn?.addEventListener('click', async () => {
        const roomId = confirmJoinBtn.dataset.roomId;
        if (!roomId) return;

        confirmJoinBtn.disabled = true;
        confirmJoinBtn.textContent = 'ENTRANDO';
        
        try {
            const data = await window.ClientRoomSystem.joinRoom(roomId);
            if (roomHelp) roomHelp.textContent = 'Conectado à sala.';
            
            // ocultar preview e mostrar estado conectado
            roomInputBox.style.display = 'none';
            
            // iniciar ping para atualizar presença
            const finalRoomId = data && data.state && data.state.id ? data.state.id : roomId;
            window.ClientRoomSystem.startRoomPing(finalRoomId);
            try { if (typeof window.startRoomUsersUpdater === 'function') window.startRoomUsersUpdater(finalRoomId); } catch (e) { /* ignore */ }
            // atualizar status de conexão na sidebar
            setConnectionStatus(`Conectado a ${finalRoomId}`);
            // mostrar nome/gênero da sala na sidebar se disponível
            try {
                const roomState = data && data.state ? data.state : {};
                setSidebarRoomInfo({ name: roomState.name || '', genre: roomState.genre || '' });
            } catch (e) {}
        } catch (err) {
            console.error('[RoomJoin] falha ao entrar na sala confirmada', err);
            let msg = 'Erro ao entrar na sala';
            if (err && err.info) {
                if (err.info.reason === 'not_found') msg = 'Sala não encontrada';
                else if (err.info.reason === 'full') msg = 'Sala cheia';
                else if (err.info.error) msg = String(err.info.error);
            }
            if (roomHelp) roomHelp.textContent = msg;
            showTemporaryError(confirmJoinBtn);
            
            // restaurar botão
            confirmJoinBtn.disabled = false;
            confirmJoinBtn.textContent = 'ENTRAR';
        }
    });

    // --- Eventos principais
    joinBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        const value = roomInput.value.trim();

        if (roomInputBox.classList.contains('expanded')) {
            // se estiver em modo preview, fechar e voltar ao estado inicial
            if (roomInputBox.classList.contains('room-preview')) {
                closePreview();
            } else {
                closeExpand();
            }
            return;
        }

        if (value) {
            // buscar informações da sala primeiro para mostrar preview
            showLoadingState();
            try {
                const roomInfo = await window.ClientRoomSystem.getRoomInfo(value);
                showRoomPreview(roomInfo, value);
            } catch (err) {
                console.error('[RoomJoin] falha ao buscar info da sala', err);
                // Mensagens amigáveis com base no motivo retornado pela API
                let msg = 'Erro ao buscar sala';
                if (err && err.info) {
                    if (err.info.reason === 'not_found') msg = 'Sala não encontrada';
                    else if (err.info.error) msg = String(err.info.error);
                }
                if (roomHelp) roomHelp.textContent = msg;
                showTemporaryError(joinBtn);
                joinBtn.disabled = false;
            }
        } else {
            openExpand();
        }
    });

    // --- Atualiza ícone conforme texto
    roomInput.addEventListener('input', () => {
        const hasText = roomInput.value.trim().length > 0;

        if (hasText) {
            joinBtn.innerHTML = RIGHT_ARROW_SVG;
            joinBtn.setAttribute('aria-label', 'Conectar');
            joinBtn.dataset.icon = 'arrow';
        } else if (!roomInputBox.classList.contains('expanded')) {
            joinBtn.textContent = '+';
            joinBtn.setAttribute('aria-label', 'Entrar na sala');
            joinBtn.removeAttribute('data-icon');
        }
    });

    // --- Enter = Conectar / expandir
    roomInput.addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const value = roomInput.value.trim();

        if (roomInputBox.classList.contains('expanded')) return;

        if (value) {
            showLoadingState();
            try {
                const roomInfo = await window.ClientRoomSystem.getRoomInfo(value);
                showRoomPreview(roomInfo, value);
            } catch (err) {
                console.error('[RoomJoin] falha ao buscar info da sala', err);
                let msg = 'Erro ao buscar sala';
                if (err && err.info) {
                    if (err.info.reason === 'not_found') msg = 'Sala não encontrada';
                    else if (err.info.error) msg = String(err.info.error);
                }
                if (roomHelp) roomHelp.textContent = msg;
                showTemporaryError(joinBtn);
                joinBtn.disabled = false;
            }
        } else {
            openExpand();
        }
    });

})();
