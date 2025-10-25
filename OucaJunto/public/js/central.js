/**
 * ==============================================
 * 🛠️ FUNÇÕES AUXILIARES PARA CONTAINERS
 * ==============================================
 */
const ContainerUtils = {
    /**
     * Abre um container aplicando classes CSS e configurando acessibilidade
     * @param {HTMLElement} container - Elemento do container
     * @param {HTMLElement} trigger - Elemento que dispara a ação (botão)
     * @param {Object} options - Opções de configuração
     */
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

    /**
     * Fecha um container removendo classes CSS e configurando acessibilidade
     * @param {HTMLElement} container - Elemento do container
     * @param {HTMLElement} trigger - Elemento que dispara a ação (botão)
     * @param {Object} options - Opções de configuração
     */
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

    /**
     * Alterna estado de um container (aberto/fechado)
     * @param {HTMLElement} container - Elemento do container
     * @param {HTMLElement} trigger - Elemento que dispara a ação (botão)
     * @param {Object} openOptions - Opções para abertura
     * @param {Object} closeOptions - Opções para fechamento
     */
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

    /**
     * Configura acessibilidade inicial de um container
     * @param {HTMLElement} container - Elemento do container
     * @param {HTMLElement} trigger - Elemento que dispara a ação (botão)
     * @param {Object} options - Opções de configuração
     */
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
        ContainerUtils.openContainer(roomInputBox, joinBtn, {
            containerClass: 'expanded',
            triggerClass: null, // Não usar classe no trigger
            triggerLabel: 'Fechar',
            triggerContent: '✕'
        });

        // Adiciona classe no wrapper para compatibilidade com browsers antigos
        roomInputWrapper?.classList.add('expanded-state');

        expandedContent?.setAttribute('aria-hidden', 'false');

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

        // Restaurar input para estado normal
        roomInput.disabled = false;
        roomInput.removeAttribute('aria-disabled');
        if (roomInput.dataset._placeholder)
            roomInput.placeholder = roomInput.dataset._placeholder;

        if (roomHelp) roomHelp.textContent = 'Carregando...';
    };

    // --- Eventos principais
    joinBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const value = roomInput.value.trim();

        if (roomInputBox.classList.contains('expanded')) {
            closeExpand();
            return;
        }

        if (value) {
            showLoadingState();
            console.log('[RoomJoin] Conectar à sala:', value);
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
    roomInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const value = roomInput.value.trim();

        if (roomInputBox.classList.contains('expanded')) return;

        if (value) {
            showLoadingState();
            console.log('[RoomJoin] Enter: conectar à sala', value);
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

    /**
     * Adiciona classe de erro temporariamente a um elemento
     * @param {HTMLElement} element - Elemento para adicionar erro
     * @param {number} duration - Duração em ms (padrão: 1200)
     */
    const showTemporaryError = (element, duration = 1200) => {
        if (!element) return;
        element.classList.add('input-error');
        setTimeout(() => element.classList.remove('input-error'), duration);
    };

    /**
     * Reseta o estado da interface após criar sala
     */
    const resetToInitialState = () => {
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
        if (roomHelp) roomHelp.textContent = 'Carregando...';
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

    // --- Criar sala
    createRoomBtn?.addEventListener('click', () => {
        const name = document.getElementById('newRoomName')?.value.trim() || '';
        const pass = document.getElementById('newRoomPass')?.value || '';
        const selected = document.querySelector('.listener-choice[aria-pressed="true"]');
        const num = selected ? Number(selected.dataset.value) : null;

        // Validações
        if (!name) {
            const field = document.getElementById('newRoomName');
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

        console.log('[CreateRoom] Criar sala:', { name, pass, num });

        // Reset da interface usando função auxiliar
        resetToInitialState();

        // Exemplo de integração futura:
        // await fetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name, pass, num }) })
    });
})();
