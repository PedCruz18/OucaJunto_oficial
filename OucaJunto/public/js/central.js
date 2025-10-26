/**
 * ==============================================
 * 🛠️ FUNÇÕES AUXILIARES PARA CONTAINERS
 * ==============================================
 */
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

        container.classList.add(containerClass);
        container.setAttribute('aria-hidden', 'false');
        
        if (trigger) {
            if (triggerClass) trigger.classList.add(triggerClass);
            trigger.setAttribute('aria-expanded', 'true');
            if (triggerLabel) trigger.setAttribute('aria-label', triggerLabel);
            if (triggerContent !== null) trigger.textContent = triggerContent;
        }

        if (display) container.style.display = display;
        if (tabIndex !== null) container.tabIndex = tabIndex;
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
                let fallback = null;
                if (fallbackFocusSelector) fallback = document.querySelector(fallbackFocusSelector);

                // Se não encontrou fallback, usar body como último recurso (apenas blur)
                if (fallback) {
                    const prevTab = fallback.getAttribute && fallback.getAttribute('tabindex');
                    const needRemoveTab = prevTab === null;
                    // Garantir que o fallback seja focável
                    fallback.setAttribute('tabindex', '-1');
                    fallback.focus();
                    // se não existia tabindex antes, removemos para não poluir DOM
                    if (needRemoveTab) fallback.removeAttribute('tabindex');
                } else if (active && typeof active.blur === 'function') {
                    active.blur();
                }
            }
        } catch (err) {
            // se algo falhar, não interromper a execução - apenas prosseguir
            // console.debug('ContainerUtils: foco fallback falhou', err);
        }

        container.classList.remove(containerClass);
        container.setAttribute('aria-hidden', 'true');

        if (trigger) {
            if (triggerClass) trigger.classList.remove(triggerClass);
            trigger.setAttribute('aria-expanded', 'false');
            if (triggerLabel) trigger.setAttribute('aria-label', triggerLabel);
            if (triggerContent !== null) trigger.textContent = triggerContent;
        }

        if (display) container.style.display = display;
        if (tabIndex !== null) container.tabIndex = tabIndex;
    },

    toggleContainer(container, trigger, openOptions = {}, closeOptions = {}) {
        const containerClass = openOptions.containerClass || 'open';
        const isOpen = container.classList.contains(containerClass);
        
        if (isOpen) {
            this.closeContainer(container, trigger, closeOptions);
        } else {
            this.openContainer(container, trigger, openOptions);
        }
        
        return !isOpen;
    },

    setupAccessibility(container, trigger, options = {}) {
        const {
            containerId = container.id,
            initialExpanded = false,
            initialLabel = 'Abrir',
            tabIndex = -1
        } = options;

        if (trigger && containerId) {
            trigger.setAttribute('aria-controls', containerId);
            trigger.setAttribute('aria-expanded', String(initialExpanded));
            trigger.setAttribute('aria-label', initialLabel);
        }

        container.setAttribute('aria-hidden', String(!initialExpanded));
        if (tabIndex !== null) container.tabIndex = tabIndex;
    }
};

/**
 * Função utilitária global para destacar temporariamente um elemento com erro
 * Uso: showTemporaryError(element, durationMs)
 */
function showTemporaryError(element, duration = 1200) {
    if (!element) return;
    element.classList.add('input-error');
    setTimeout(() => element.classList.remove('input-error'), duration);
}

// Expõe para outros módulos/escopos que possam esperar encontrá-la globalmente
if (typeof window !== 'undefined') window.showTemporaryError = showTemporaryError;

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
                leaveBtn.style.display = 'inline-flex';
            } else {
                leaveBtn.style.display = 'none';
            }
        }
    } catch (e) {
        // ignore
    }
}

if (typeof window !== 'undefined') window.setConnectionStatus = setConnectionStatus;

/**
 * ==============================================
 * 🧭 SIDEBAR TOGGLE (hamburger menu)
 * ==============================================
 */
(() => {
    const btn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');

    if (!btn || !sidebar) {
        console.warn('[Sidebar] Elementos não encontrados. Script abortado.');
        return;
    }

    // --- Configuração inicial de acessibilidade
    ContainerUtils.setupAccessibility(sidebar, btn, {
        containerId: 'sidebar',
        initialExpanded: false,
        initialLabel: 'Abrir menu',
        tabIndex: -1
    });

    // --- Função de toggle usando utility
    const toggleSidebar = () => {
        return ContainerUtils.toggleContainer(
            sidebar, 
            btn,
            { // Opções para abrir
                containerClass: 'open',
                triggerClass: 'open',
                triggerLabel: 'Fechar menu'
            },
            { // Opções para fechar
                containerClass: 'open',
                triggerClass: 'open',
                triggerLabel: 'Abrir menu'
            }
        );
    };

    // --- Evento principal
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });
})();

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
    setConnectionStatus();
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
                    joinBtn.setAttribute('aria-expanded', 'false');
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

    } catch (err) {
        console.error('[UI] failed to handle room:closed event', err);
    }
});


/**
 * ==============================================
 * 💬 ROOM JOIN / EXPAND INPUT AREA
 * ==============================================
 */
(() => {
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
            // atualizar status de conexão na sidebar
            setConnectionStatus(`Conectado a ${finalRoomId}`);
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

    const showTemporaryError = (element, duration = 1200) => {
        if (!element) return;
        element.classList.add('input-error');
        setTimeout(() => element.classList.remove('input-error'), duration);
    };

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
                // atualizar status de conexão na sidebar
                setConnectionStatus(`Conectado a ${roomId}`);
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
            
            // Disparar evento de sala fechada para resetar a UI completamente
            if (typeof window.CustomEvent === 'function') {
                window.dispatchEvent(new CustomEvent('room:closed', { detail: { roomId: null, manual: true } }));
            }
        } catch (err) {
            console.error('[LeaveRoom] Erro ao sair da sala', err);
        }
    });
})();
