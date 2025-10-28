// ============================
//        DEPENDÊNCIAS
// ============================
const express = require('express');
const path = require('path');
const os = require('os');
const sessionApi = require('./src/apis/session_api');
const webRoutes = require('./src/routes/web_routes');     
const roomSystem = require('./src/modules/room_system');

// ============================
//        CONFIGURAÇÕES
// ============================
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// pasta pública 
const publicDir = path.join(__dirname, 'public');

// ============================
//        MIDDLEWARES
// ============================

// Serve arquivos estáticos da pasta 'public'
app.use(express.static(publicDir));

// Suporte a JSON no body para APIs (POST/PUT)
app.use(express.json());

// ============================
//        ROTAS
// ============================

// Rota que gera um novo session
app.get('/api/session-debug', (req, res) => {
  try {
    // tenta receber id e createdAt enviados pelo cliente via query ou header
    const suppliedId = req.query.id || req.get('X-Ouca-Session-Id');
    const suppliedCreated = req.query.createdAt || req.get('X-Ouca-Session-Created');

    // validação simples: existir e ter o comprimento esperado; se both presentes, ecoamos
    if (typeof suppliedId === 'string' && suppliedId.length === sessionApi.ID_LEN && suppliedCreated) {
      // formatar createdAt para padrão BR antes de retornar
      const createdBR = sessionApi.formatBR(suppliedCreated) || suppliedCreated;
      return res.json({ id: suppliedId, createdAt: createdBR });
    }

    // caso não haja id válido+createdAt, gera novo
    const s = sessionApi.newSession();
    return res.json(s);
  } catch (e) {
    console.error('failed to generate session debug', e);
    return res.status(500).json({ error: 'failed to generate session' });
  }
});

// Rota simples para criar salas (usa Map em memória)
app.post('/api/rooms', (req, res) => {
  try {
    const body = req.body || {};
    const name = body.name;
    const genre = body.genre || '';
    const num = Number(body.num) || 1;
    const ownerId = body.ownerId || null;

    if (!name) return res.status(400).json({ error: 'name is required' });

    const room = roomSystem.createRoom({ name, genre, num, ownerId });

  // retornar ID e URL para que o cliente faça redirecionamento
  return res.status(201).json({ room: room });
  } catch (e) {
    console.error('failed to create room', e);
    return res.status(500).json({ error: 'failed to create room' });
  }
});

// Rota para um usuário entrar em uma sala pelo id
app.post('/api/rooms/:id/join', (req, res) => {
  try {
    const roomId = req.params.id;
    const body = req.body || {};
    const userId = body.userId || req.get('X-Ouca-Session-Id') || null;

    if (!roomId) return res.status(400).json({ error: 'room id is required' });
    if (!userId) return res.status(400).json({ error: 'user id is required' });

    // valida join (sem senha agora)
    const v = roomSystem.validateJoin(roomId);
    if (!v.ok) return res.status(400).json({ error: 'join_not_allowed', reason: v.reason });

    // adicionar player ao registro histórico
    const added = roomSystem.addPlayer ? roomSystem.addPlayer(roomId, userId) : false;

    // marcar presença imediatamente
    if (roomSystem._touchPresence) roomSystem._touchPresence(roomId, userId);

    console.log(`[api/rooms/join] user=${userId} joined room=${roomId} added=${added}`);

    const state = roomSystem.getRoomState(roomId);
    return res.json({ ok: true, added, state });
  } catch (e) {
    console.error('failed to join room', e);
    return res.status(500).json({ error: 'failed to join room' });
  }
});

// Rota para obter informações básicas da sala (sem fazer join)
app.get('/api/rooms/:id/info', (req, res) => {
  try {
    const roomId = req.params.id;
    if (!roomId) return res.status(400).json({ error: 'room id is required' });

    const room = roomSystem.getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'room not found' });

    const activeUsers = roomSystem.getActiveUsersCount ? roomSystem.getActiveUsersCount(roomId) : 0;
    
    // retornar informações básicas da sala para preview
    return res.json({
      id: room.id,
      name: room.name,
      usersCount: activeUsers,
      maxUsers: room.num,
      genre: room.genre || ''
    });
  } catch (e) {
    console.error('failed to get room info', e);
    return res.status(500).json({ error: 'failed to get room info' });
  }
});

// Rota para consultar estado da sala (ping/status check)
app.get('/api/rooms/:id/state', (req, res) => {
  try {
    const roomId = req.params.id;
    if (!roomId) return res.status(400).json({ error: 'room id is required' });

    // aceitar ownerId via query ou header para atualizar presença
    const ownerId = req.query.ownerId || req.get('X-Ouca-Session-Id') || null;

    // se fornecido ownerId, marcar presença apenas se o id pertencer à sala
    if (ownerId) {
      try {
        const room = roomSystem.getRoom(roomId);
        // só tocar presença se o id for o owner da sala ou estiver registrado nos players
        const ownerMatches = room && room.ownerId && String(room.ownerId) === String(ownerId);
        const registered = room && Array.isArray(room.players) && room.players.includes(String(ownerId));
        if (ownerMatches || registered) {
          if (typeof roomSystem._touchPresence === 'function') {
            roomSystem._touchPresence(roomId, ownerId);
          }
        } else {
          // Ignorar touchPresence para ids não registrados (por exemplo, usuários removidos/kicked)
          // console.debug(`[room-state] ignored touchPresence for ${ownerId} in room ${roomId}`);
        }
      } catch (e) {
        console.error('[room-state] failed to touch presence', e);
      }
    }

    const state = roomSystem.getRoomState(roomId);
    if (!state) return res.status(404).json({ error: 'room not found' });

    // adicionar flag indicando se o usuário solicitante pertence à sala
    let userBelongsToRoom = false;
    if (ownerId) {
      try {
        const room = roomSystem.getRoom(roomId);
        const ownerMatches = room && room.ownerId && String(room.ownerId) === String(ownerId);
        const registered = room && Array.isArray(room.players) && room.players.includes(String(ownerId));
        userBelongsToRoom = ownerMatches || registered;
      } catch (e) {
        // ignore
      }
    }

    return res.json({ state, userBelongsToRoom });
  } catch (e) {
    console.error('failed to get room state', e);
    return res.status(500).json({ error: 'failed to get room state' });
  }
});

// Rota para listar usuários ativos/registrados de uma sala
app.get('/api/rooms/:id/players', (req, res) => {
  try {
    const roomId = req.params.id;
    if (!roomId) return res.status(400).json({ error: 'room id is required' });

    const room = roomSystem.getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'room not found' });

    // lista de usuários ativos (com base em presença/heartbeat)
    const active = typeof roomSystem.getActiveUsersList === 'function' ? roomSystem.getActiveUsersList(roomId) : [];

    return res.json({ ownerId: room.ownerId || null, activeUsers: active, registeredPlayers: Array.isArray(room.players) ? room.players : [] });
  } catch (e) {
    console.error('failed to get room players', e);
    return res.status(500).json({ error: 'failed to get room players' });
  }
});

// Rota para remover um usuário da sala (apenas o dono pode fazer)
app.post('/api/rooms/:id/remove-user', (req, res) => {
  try {
    const roomId = req.params.id;
    const body = req.body || {};
    const targetUser = body.userId || req.query.userId;

    // ownerId enviado via header X-Ouca-Session-Id ou no body
    const ownerId = req.get('X-Ouca-Session-Id') || body.ownerId || null;

    if (!roomId) return res.status(400).json({ error: 'room id is required' });
    if (!targetUser) return res.status(400).json({ error: 'user id is required' });
    if (!ownerId) return res.status(400).json({ error: 'owner id is required' });

    const room = roomSystem.getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'room not found' });

    if (String(room.ownerId) !== String(ownerId)) return res.status(403).json({ error: 'forbidden', reason: 'not_owner' });

    const removed = typeof roomSystem.removePlayer === 'function' ? roomSystem.removePlayer(roomId, targetUser) : false;

    const active = typeof roomSystem.getActiveUsersList === 'function' ? roomSystem.getActiveUsersList(roomId) : [];

    return res.json({ ok: true, removed, activeUsers: active });
  } catch (e) {
    console.error('failed to remove user from room', e);
    return res.status(500).json({ error: 'failed to remove user' });
  }
});

// Rotas do site (exporta publicDir para servir arquivos estáticos)
app.use('/', webRoutes(publicDir));

// ============================
//        INICIALIZAÇÃO DO SERVIDOR
// ============================
app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);

  // mostra IPs locais para acessar pela rede
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach((name) => {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`Acesse via rede: http://${net.address}:${PORT}`);
      }
    }
  });

  // Monitor periódico de salas: lista e resume as rooms a cada 5 segundos (apenas para debug)
  // Map para rastrear quando uma sala foi observada pela primeira vez com 0 usuários
  const zeroSince = new Map();

  setInterval(() => {
    try {
      const rooms = roomSystem.listRooms();

      if (!rooms || rooms.length === 0) {
        console.log('[room-monitor] 0 rooms');
        return;
      }

  // Log resumo curto usando usuários ativos (heartbeat)
  const summary = rooms.map(r => `${r.id}(users=${roomSystem.getActiveUsersCount ? roomSystem.getActiveUsersCount(r.id) : (Array.isArray(r.players) ? r.players.length : 0)})`).join(', ');
      console.log(`[room-monitor] ${rooms.length} room(s): ${summary}`);

      // Checagem por sala: log detalhado e remoção de salas vazias que persistirem >5s
      const now = Date.now();
      const ZERO_TIMEOUT = 5000; // ms

      rooms.forEach(r => {
  // checar se o owner existe e se saiu — se saiu, encerrar a sala imediatamente
  try {
    if (r.ownerId && typeof roomSystem.isUserActive === 'function') {
      const ownerActive = roomSystem.isUserActive(r.id, r.ownerId);
      if (!ownerActive) {
        const removed = roomSystem.deleteRoom(r.id);
        console.log(`[room-monitor] room ${r.id} removed because owner ${r.ownerId} left removed=${removed}`);
        // garantir que qualquer marcação em zeroSince seja removida
        if (zeroSince.has(r.id)) zeroSince.delete(r.id);
        return; // seguir para próxima sala
      }
    }
  } catch (err) {
    console.error('[room-monitor] owner presence check failed', err);
  }

  const users = roomSystem.getActiveUsersCount ? roomSystem.getActiveUsersCount(r.id) : (Array.isArray(r.players) ? r.players.length : 0);

        if (users === 0) {
          if (!zeroSince.has(r.id)) {
            // primeira vez que vemos 0 usuários, marcar timestamp
            zeroSince.set(r.id, now);
            console.log(`[room-monitor] room ${r.id} became empty at ${new Date(now).toISOString()}`);
          } else {
            const t0 = zeroSince.get(r.id);
            if (now - t0 >= ZERO_TIMEOUT) {
              // Excedeu timeout: deletar sala
              const removed = roomSystem.deleteRoom(r.id);
              console.log(`[room-monitor] room ${r.id} removed due to inactivity (users=0 for >=${ZERO_TIMEOUT}ms) removed=${removed}`);
              zeroSince.delete(r.id);
            }
          }
        } else {
          // se a sala tem usuários agora, limpar qualquer marcação anterior
          if (zeroSince.has(r.id)) {
            zeroSince.delete(r.id);
            console.log(`[room-monitor] room ${r.id} is no longer empty; cleared zeroSince mark`);
          }
        }
      });

      // Também limpar entradas em zeroSince que não existem mais (por segurança)
      for (const id of Array.from(zeroSince.keys())) {
        if (!rooms.find(rr => rr.id === id)) {
          zeroSince.delete(id);
        }
      }

    } catch (err) {
      console.error('[room-monitor] failed to list rooms', err);
    }
  }, 5000);
});
