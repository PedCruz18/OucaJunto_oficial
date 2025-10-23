// define os elementos do DOM a serem utilizados
const btn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');

// fallback: evita erro quando elementos não existem no DOM
if (!btn || !sidebar) {
    console.warn('hamburgerBtn ou sidebar não encontrados — script de toggle abortado.');
} else {

    // Acessibilidade inicial
    btn.setAttribute('aria-controls', 'sidebar');
    btn.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
    sidebar.tabIndex = -1;

    // abre o sidebar
    const toggleSidebar = () => {
        const isOpen = sidebar.classList.toggle('open');
        btn.classList.toggle('open', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
        sidebar.setAttribute('aria-hidden', String(!isOpen));
    };

    // clique no botão hambuguer abre/fecha
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

}

// --- Toggle de expansão do input (botão + -> X) ---
const joinBtn = document.getElementById('joinBtn');
const roomInputBox = document.querySelector('.room-input-box');
const roomInput = document.getElementById('roomCode');
const expandedContent = document.getElementById('expandedContent');

if (!joinBtn || !roomInputBox || !roomInput) {
    console.warn('joinBtn, roomInputBox ou roomInput não encontrados — comportamento de expansão não inicializado.');
} else {

    // Acessibilidade inicial
    joinBtn.setAttribute('aria-expanded', 'false');

    const openExpand = () => {
        roomInputBox.classList.add('expanded');
        joinBtn.setAttribute('aria-expanded', 'true');
        // guarda e remove placeholder para que não apareça
        roomInput.dataset._placeholder = roomInput.getAttribute('placeholder') || '';
        roomInput.removeAttribute('placeholder');
        // muda símbolo para X
        joinBtn.textContent = '✕';
        joinBtn.setAttribute('aria-label', 'Fechar');
        if (expandedContent) expandedContent.setAttribute('aria-hidden', 'false');
        // torna o input não editável enquanto a box está expandida
        roomInput.disabled = true;
        roomInput.setAttribute('aria-disabled', 'true');
        // não focar o input desabilitado — manter foco no botão por acessibilidade
        joinBtn.focus();
    };

    const closeExpand = () => {
        roomInputBox.classList.remove('expanded');
        joinBtn.setAttribute('aria-expanded', 'false');
        // restaura placeholder
        const ph = roomInput.dataset._placeholder || '';
        if (ph) roomInput.setAttribute('placeholder', ph);
        // reabilita o input para digitação
        roomInput.disabled = false;
        roomInput.removeAttribute('aria-disabled');
        joinBtn.textContent = '+';
        joinBtn.setAttribute('aria-label', 'Entrar na sala');
        if (expandedContent) expandedContent.setAttribute('aria-hidden', 'true');
    };

    const toggleExpand = () => {
        if (roomInputBox.classList.contains('expanded')) closeExpand();
        else openExpand();
    };

    // ícone SVG para seta direita (usado quando há texto no input)
    const RIGHT_ARROW_SVG = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;display:block"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

    // Reutilizável: oculta a caixa de input e mostra estado de carregamento
    function hideRoomInputAndShowLoading() {
        // fecha a expansão se estiver aberta
        if (roomInputBox) {
            roomInputBox.classList.remove('expanded');
            // oculta todo o container da entrada de sala
            roomInputBox.style.display = 'none';
            roomInputBox.setAttribute('aria-hidden', 'true');
        }

        // restaura/botão e conteúdo expandido
        if (joinBtn) {
            joinBtn.setAttribute('aria-expanded', 'false');
            joinBtn.textContent = '+';
            joinBtn.setAttribute('aria-label', 'Entrar na sala');
            joinBtn.disabled = true;
        }

        if (expandedContent) expandedContent.setAttribute('aria-hidden', 'true');

        // restaura placeholder do input caso tenha sido guardado
        if (roomInput) {
            roomInput.disabled = false;
            roomInput.removeAttribute('aria-disabled');
            const ph = roomInput.dataset._placeholder || '';
            if (ph) roomInput.setAttribute('placeholder', ph);
        }

        // altera a ajuda/estado para carregar
        const roomHelp = document.getElementById('roomHelp');
        if (roomHelp) roomHelp.textContent = 'Carregando...';
    }

    joinBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // se a caixa estiver expandida, apenas fecha/abre (comportamento atual)
        if (roomInputBox.classList.contains('expanded')) {
            toggleExpand();
            return;
        }

        // se não estiver expandida: se houver texto no input, interpretar como "conectar/ir"
        const val = roomInput?.value?.trim() || '';
        if (val) {
            // UX local: ocultar e mostrar carregando
            hideRoomInputAndShowLoading();
            console.log('Conectar/ir para sala:', val);
            // aqui você pode iniciar a navegação/consulta para entrar na sala
            return;
        }

        // caso contrário, abre a área expandida
        toggleExpand();
    });

    // escuta quando usuário digita no input — muda o botão para setinha quando tiver texto
    roomInput.addEventListener('input', (e) => {
        const hasText = roomInput.value.trim().length > 0;
        if (hasText) {
            // usar SVG inline em vez de caractere
            joinBtn.innerHTML = RIGHT_ARROW_SVG;
            joinBtn.setAttribute('aria-label', 'Conectar');
            joinBtn.setAttribute('data-icon', 'arrow');
        } else {
            // se estiver na vista padrão sem expandir, mostra '+'; se estiver expandido, X já é tratado por openExpand
            if (!roomInputBox.classList.contains('expanded')) {
                joinBtn.textContent = '+';
                joinBtn.setAttribute('aria-label', 'Entrar na sala');
                joinBtn.removeAttribute('data-icon');
            }
        }
    });

    // Enter no input: comporta-se como clicar no botão (quando não expandido)
    roomInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // se estiver expandido, não interferir (submit do form é separado)
            if (roomInputBox.classList.contains('expanded')) return;
            const val = roomInput.value.trim();
            if (val) {
                hideRoomInputAndShowLoading();
                console.log('Conectar/ir para sala (enter):', val);
            } else {
                // se vazio, abre a expansão para criar sala
                toggleExpand();
            }
        }
    });

    // fechar ao clicar fora da box expandida
    document.addEventListener('click', (e) => {
        if (roomInputBox.classList.contains('expanded') && !roomInputBox.contains(e.target)) {
            closeExpand();
        }
    });

    // ESC fecha a expansão — escuta em nível de documento para funcionar mesmo com input desabilitado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (roomInputBox.classList.contains('expanded')) closeExpand();
        }
    });

}

// === comportamento do formulário expandido (seleção de ouvintes + criar) ===
const listenerChoices = document.querySelectorAll('.listener-choice');
const createRoomBtn = document.getElementById('createRoomBtn');

// mínimo de ouvintes exigido para criar a sala.
// Altere esse valor conforme a regra do seu app.
const MIN_LISTENERS = 1;

if (listenerChoices && listenerChoices.length) {
    listenerChoices.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // desmarca todos
            listenerChoices.forEach(b => b.setAttribute('aria-pressed', 'false'));
            // marca o selecionado
            btn.setAttribute('aria-pressed', 'true');

            // ao selecionar, limpa qualquer erro de validação previamente mostrado
            btn.removeAttribute('aria-invalid');
            const container = document.querySelector('.listener-choices') || btn.parentElement;
            if (container) container.classList.remove('input-error');
        });
    });
}

// comportamento do botão criar sala
if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
        const name = document.getElementById('newRoomName')?.value || '';
        const pass = document.getElementById('newRoomPass')?.value || '';
        const selected = document.querySelector('.listener-choice[aria-pressed="true"]');
        const num = selected ? Number(selected.dataset.value) : null;

        // validação mínima do nome
        if (!name.trim()) {
            const fld = document.getElementById('newRoomName');
            if (fld) {
                fld.classList.add('input-error');
                setTimeout(() => fld.classList.remove('input-error'), 1200);
                fld.focus();
            }
            return;
        }

        // validação mínima de ouvintes: precisa ter uma opção selecionada e o valor numérico >= MIN_LISTENERS
        if (!selected || isNaN(num) || num < MIN_LISTENERS) {
            const container = document.querySelector('.listener-choices') || (listenerChoices[0] && listenerChoices[0].parentElement);

            // visual feedback
            if (container) {
                container.classList.add('input-error');
                setTimeout(() => container.classList.remove('input-error'), 1200);
            }

            // marcar aria-invalid no elemento selecionado (se existir) para acessibilidade, ou focar o primeiro botão
            if (selected) {
                selected.setAttribute('aria-invalid', 'true');
                selected.focus();
            } else if (listenerChoices && listenerChoices.length) {
                listenerChoices[0].focus();
            } else {
                // fallback
                alert(`Por favor escolha pelo menos ${MIN_LISTENERS} ouvinte(s).`);
            }

            return;
        }

        // Aqui você integraria com sua API para criar a sala.
        console.log('Criar sala:', { name, pass, num });

        // --- UX: fechar/ocultar formulário e indicar carregamento ---
        // fecha a expansão se estiver aberta
        if (roomInputBox) {
            roomInputBox.classList.remove('expanded');
            // oculta todo o container da entrada de sala
            roomInputBox.style.display = 'none';
            roomInputBox.setAttribute('aria-hidden', 'true');
        }

        // restaura/botão e conteúdo expandido
        if (joinBtn) {
            joinBtn.setAttribute('aria-expanded', 'false');
            joinBtn.textContent = '+';
            joinBtn.setAttribute('aria-label', 'Entrar na sala');
        }

        if (expandedContent) expandedContent.setAttribute('aria-hidden', 'true');

        // restaura placeholder do input caso tenha sido guardado
        if (roomInput) {
            roomInput.disabled = false;
            roomInput.removeAttribute('aria-disabled');
            const ph = roomInput.dataset._placeholder || '';
            if (ph) roomInput.setAttribute('placeholder', ph);
        }

        // desabilita o botão criar para evitar cliques duplicados
        createRoomBtn.disabled = true;

        // altera a ajuda/estado para carregar
        const roomHelp = document.getElementById('roomHelp');
        if (roomHelp) roomHelp.textContent = 'Carregando..';

        // aqui você chamaria sua API async; ex:
        // fetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name, pass, num }) })...
    });
}
