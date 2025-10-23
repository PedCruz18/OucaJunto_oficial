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

    joinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleExpand();
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

if (listenerChoices && listenerChoices.length) {
    listenerChoices.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // desmarca todos
            listenerChoices.forEach(b => b.setAttribute('aria-pressed', 'false'));
            // marca o selecionado
            btn.setAttribute('aria-pressed', 'true');
        });
    });
}

if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
        const name = document.getElementById('newRoomName')?.value || '';
        const pass = document.getElementById('newRoomPass')?.value || '';
        const selected = document.querySelector('.listener-choice[aria-pressed="true"]');
        const num = selected ? selected.dataset.value : null;

        // validação mínima
        if (!name.trim()) {
            // realça o campo
            const fld = document.getElementById('newRoomName');
            fld.classList.add('input-error');
            setTimeout(() => fld.classList.remove('input-error'), 1200);
            fld.focus();
            return;
        }

        // Aqui você integraria com sua API para criar a sala.
        console.log('Criar sala:', { name, pass, num });

        // fechar o painel e restaurar estado (comportamento opcional)
        if (roomInputBox.classList.contains('expanded')) {
            // reusar closeExpand definido acima
            // procura a função no escopo — se não existir, apenas remove a classe
            try { closeExpand(); } catch (err) { roomInputBox.classList.remove('expanded'); }
        }
    });
}

// pequeno estilo de erro via classe (adiciona/remover em JS)
const style = document.createElement('style');
style.textContent = '.input-error{ box-shadow: 0 0 0 3px rgba(255,0,0,0.12); }';
document.head.appendChild(style);
