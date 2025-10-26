(function (global) {

    // Variável global para controlar ping ativo
    let currentRoomPing = null;

    async function createRoom({ name, pass = '', num = 1 } = {}) {

        console.log('[CreateRoom] Criando sala.. (requisitando API no backend):', { name, pass, num });

        if (!name) throw new Error('name is required');

        // tentar ler ownerId da sessão já presente no localStorage
        let ownerId = null;
        try {
            const stored = localStorage.getItem('oucaSession');
            if (stored) {
                const s = JSON.parse(stored);
                if (s && s.id) ownerId = s.id;
            }
        } catch (e) {
            // se falhar ao ler localStorage, seguir sem ownerId
        }

        const resp = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, pass, num, ownerId })
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            const e = new Error('failed to create room');
            e.info = err;
            e.status = resp.status;
            throw e;
        }

        const data = await resp.json();

        try {
            const roomId = data && data.room && data.room.id ? data.room.id : null;
            console.log(`[Backend:] Sala Criada id=${roomId}`, data);
        } catch (e) {
            // não bloquear em caso de erro no log
        }

        return data;
    }

    async function getRoomState(roomId) {
        if (!roomId) throw new Error('roomId is required');

        // tentar ler ownerId da sessão já presente no localStorage e enviar ao servidor
        let ownerId = null;
        try {
            const stored = localStorage.getItem('oucaSession');
            if (stored) {
                const s = JSON.parse(stored);
                if (s && s.id) ownerId = s.id;
            }
        } catch (e) {
            // ignore
        }

        const url = ownerId ? `/api/rooms/${roomId}/state?ownerId=${encodeURIComponent(ownerId)}` : `/api/rooms/${roomId}/state`;
        const resp = await fetch(url);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            const e = new Error('failed to get room state');
            e.info = err;
            e.status = resp.status;
            throw e;
        }

        return resp.json();
    }

        async function joinRoom(roomId, pass = '') {
            if (!roomId) throw new Error('roomId is required');

            // tentar ler ownerId da sessão já presente no localStorage
            let ownerId = null;
            try {
                const stored = localStorage.getItem('oucaSession');
                if (stored) {
                    const s = JSON.parse(stored);
                    if (s && s.id) ownerId = s.id;
                }
            } catch (e) {
                // ignore
            }

            if (!ownerId) throw new Error('no session ownerId available');

            const resp = await fetch(`/api/rooms/${roomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: ownerId, pass })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                const e = new Error('failed to join room');
                e.info = err;
                e.status = resp.status;
                throw e;
            }

            return resp.json();
        }

    function startRoomPing(roomId) {
        if (!roomId) {
            console.warn('[RoomPing] roomId não fornecido');
            return;
        }

        // Parar ping anterior se existir
        stopRoomPing();

        console.log(`[RoomPing] Iniciando ping para sala ${roomId}`);
        
        currentRoomPing = setInterval(async () => {
            try {
                    // medir RTT (round-trip time) da requisição
                    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                    const response = await getRoomState(roomId);
                    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                    const latency = Math.max(0, Math.round(t1 - t0));
                    const state = response.state;
                    console.log(`[RoomPing] Estado da sala ${roomId}: users=${state.usersCount}/${state.maxUsers} name="${state.name}" latency=${latency}ms`);

                    // atualizar indicador de ping na UI se existir
                    try {
                        if (typeof window !== 'undefined') {
                            const disp = document.getElementById('sessionIdDisplay');
                            if (disp) disp.textContent = `PING: ${latency}ms`;
                            // emitir evento para listeners opcionais
                            if (typeof window.CustomEvent === 'function') {
                                window.dispatchEvent(new CustomEvent('room:latency', { detail: { roomId, latency } }));
                            }
                        }
                    } catch (e) {
                        // não bloquear o loop por erro de UI
                        console.error('[RoomPing] failed to update latency UI', e);
                    }
            } catch (err) {
                console.error(`[RoomPing] Erro ao consultar sala ${roomId}:`, err.message);
                // Se sala não existir mais (404), para o ping
                if (err.status === 404) {
                    console.log(`[RoomPing] Sala ${roomId} não encontrada. Emitting room:closed and parando ping.`);
                    // Notificar a UI que a sala foi encerrada (pode ser removida pelo servidor)
                    try {
                        if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
                            window.dispatchEvent(new CustomEvent('room:closed', { detail: { roomId } }));
                        }
                    } catch (e) {
                        // não bloquear por erro no dispatch
                        console.error('[RoomPing] failed to dispatch room:closed event', e);
                    }

                    stopRoomPing();
                }
            }
        }, 5000);
    }

    function stopRoomPing() {
        if (currentRoomPing) {
            clearInterval(currentRoomPing);
            currentRoomPing = null;
            console.log('[RoomPing] Ping parado');
        }
    }

    global.ClientRoomSystem = {
        createRoom,
        getRoomState,
        startRoomPing,
        stopRoomPing,
        joinRoom
    };
})(window);
