// room-users.js
// Lógica isolada para atualizar e renderizar a lista de usuários da sala.

(function () {
    let roomUsersInterval = null;
    let currentRoomForUsers = null;

    function getSessionIdFromStorage() {
        try {
            const stored = localStorage.getItem('oucaSession');
            if (!stored) return null;
            const s = JSON.parse(stored);
            return s && s.id ? s.id : null;
        } catch (e) {
            return null;
        }
    }

    async function updateRoomUsersUI(roomId) {
        if (!roomId) return;
        try {
            const resp = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/players`);
            if (!resp.ok) return;
            const data = await resp.json();
            // Proteção contra respostas assíncronas atrasadas:
            // se o updater foi parado ou trocado para outra sala enquanto
            // a requisição estava em andamento, ignoramos a resposta.
            if (currentRoomForUsers !== roomId) {
                console.debug('[RoomUsers] fetched data for stale room, ignoring', { roomId, currentRoomForUsers });
                return;
            }

            renderRoomUsers(data, roomId);
        } catch (e) {
            // failed to update users UI
        }
    }

    // renderiza a lista de usuários na UI (versão otimizada)
    function renderRoomUsers(data, roomId) {
        const container = document.getElementById('roomUsersContainer');
        const list = document.getElementById('roomUsersList');
        if (!container || !list) return;

        // extrair dados com fallback
        const active = Array.isArray(data && data.activeUsers) ? data.activeUsers : [];
        const registered = Array.isArray(data && data.registeredPlayers) ? data.registeredPlayers : [];
        const ownerId = data && data.ownerId ? String(data.ownerId) : '';

        // decidir lista a mostrar: ativa tem preferência
        const displayList = (active.length ? active : registered) || [];

        // limpar lista imediatamente
        list.innerHTML = '';

        // metadata e visibilidade
        try {
            container.dataset.ownerId = ownerId;
            container.dataset.activeCount = String(active.length);
            container.dataset.registeredCount = String(registered.length);
            container.dataset.displayedCount = String(displayList.length);
            container.dataset.lastUpdate = new Date().toISOString();
        } catch (e) { /* ignore dataset failures */ }

        if (displayList.length === 0) {
            container.style.display = 'none';
            container.dataset.visible = 'false';
            return;
        }

        // mostrar container
        container.style.display = 'block';
        container.dataset.visible = 'true';

    // render: updating list

        const myId = getSessionIdFromStorage();
        const amOwner = myId && ownerId && String(myId) === String(ownerId);

        // estilos reaproveitados com cssText para reduzir repetição
        const liStyle = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.02);';
        const spanStyle = 'font-size:13px;color:rgba(255,255,255,0.9);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        const btnStyle = 'border:none;background:transparent;color:rgba(255,255,255,0.85);cursor:pointer;font-weight:700;padding:2px 6px;';

        const frag = document.createDocumentFragment();

        displayList.forEach(uidRaw => {
            const uid = String(uidRaw);
            const li = document.createElement('li');
            li.style.cssText = liStyle;

            const span = document.createElement('span');
            span.textContent = uid;
            span.title = uid;
            span.style.cssText = spanStyle;

            li.appendChild(span);

            // owner pode remover outros usuários, mas não a si mesmo
            if (amOwner && uid !== ownerId) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'remove-user-btn';
                btn.setAttribute('aria-label', `Remover usuário ${uid}`);
                btn.dataset.userId = uid;
                btn.textContent = '✕';
                btn.style.cssText = btnStyle;
                li.appendChild(btn);
            }

            frag.appendChild(li);
        });

        list.appendChild(frag);

        try {
            container.dataset.lastRenderEnd = new Date().toISOString();
        } catch (e) {}
    }

    function startRoomUsersUpdater(roomId) {
        stopRoomUsersUpdater();
        if (!roomId) return;
        currentRoomForUsers = roomId;
        // atualizar imediatamente e depois a cada 3s
        updateRoomUsersUI(roomId);
        roomUsersInterval = setInterval(() => updateRoomUsersUI(roomId), 3000);
        try {
            const container = document.getElementById('roomUsersContainer');
            if (container) {
                container.dataset.updaterStartedAt = new Date().toISOString();
                container.dataset.updaterForRoom = roomId;
            }
        } catch (e) {}
    }

    // para o updater de usuários
    function stopRoomUsersUpdater() {
        if (roomUsersInterval) {
            clearInterval(roomUsersInterval);
            roomUsersInterval = null;
        }
        currentRoomForUsers = null;
        const container = document.getElementById('roomUsersContainer');
        const list = document.getElementById('roomUsersList');
        if (list) list.innerHTML = '';
        try {
            if (container) {
                container.style.display = 'none';
                container.dataset.visible = 'false';
                container.dataset.updaterStoppedAt = new Date().toISOString();
            }
        } catch (e) {}
    }

    // delegação para clique em remover usuário
    document.addEventListener('click', async (ev) => {
        const t = ev.target;
        if (!t) return;
        const btn = t.closest && t.closest('.remove-user-btn');
        if (!btn) return;
        ev.preventDefault();

        const uid = btn.dataset.userId;
        const roomId = currentRoomForUsers;
        if (!uid || !roomId) return;

        // enviar pedido ao backend para remover o usuário
        try {
            const ownerId = getSessionIdFromStorage();
            const resp = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/remove-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Ouca-Session-Id': ownerId || '' },
                body: JSON.stringify({ userId: uid })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                try { const container = document.getElementById('roomUsersContainer'); if (container) container.dataset.lastRemoveError = JSON.stringify(err); } catch (e) {}
                return;
            }

            const data = await resp.json();
            try { const container = document.getElementById('roomUsersContainer'); if (container) container.dataset.lastRemove = JSON.stringify({ user: uid, at: new Date().toISOString() }); } catch (e) {}
            // Atualizar UI com nova lista
            renderRoomUsers({ ownerId: getSessionIdFromStorage(), activeUsers: data.activeUsers, registeredPlayers: [] }, roomId);
        } catch (e) {
            try { const container = document.getElementById('roomUsersContainer'); if (container) container.dataset.lastRemoveError = String(e); } catch (er) {}
        }
    });

    // expor para o escopo global para controle por outros módulos
    if (typeof window !== 'undefined') {
        window.startRoomUsersUpdater = startRoomUsersUpdater;
        window.stopRoomUsersUpdater = stopRoomUsersUpdater;
    }

    // Garantir limpeza quando o usuário sair manualmente
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // opcional: não parar automaticamente, apenas manter
        }
    });

})();

// Redundância: se algum outro módulo disparar 'room:closed' (p.ex. ClientRoomSystem
// detectando que o usuário foi removido), garantir que o updater de usuários seja parado
// e o container escondido imediatamente.
(function () {
    try {
        if (typeof window === 'undefined') return;
        window.addEventListener('room:closed', (e) => {
            try {
                // room:closed event received

                if (typeof window.stopRoomUsersUpdater === 'function') {
                    // chamar o stopper (ele já faz logs), mas também colocar um log contextual aqui
                    try {
                        window.stopRoomUsersUpdater();
                    } catch (err) {
                        // ignore
                    }
                } else {
                    // fallback: esconder container manualmente e logar a ação
                    const container = document.getElementById('roomUsersContainer');
                    const list = document.getElementById('roomUsersList');

                        if (list) {
                            try { list.innerHTML = ''; } catch (err) { /* ignore */ }
                        }

                        if (container) {
                            try { container.style.display = 'none'; } catch (err) { /* ignore */ }
                            try { container.dataset.visible = 'false'; } catch (err) { /* ignore */ }
                        }
                }
            } catch (err) {
                // não propagar erro do handler
                console.error('[RoomUsers] error in room:closed handler', err);
            }
        });
    } catch (e) {
        // ignore
    }
})();
