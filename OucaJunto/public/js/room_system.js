(function (global) {

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

    global.ClientRoomSystem = {
        createRoom
    };
})(window);
