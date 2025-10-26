const crypto = require('crypto');

// Map simples em memória para armazenar salas durante a execução.
// Chave: id da sala (string), Valor: objeto da sala.
const rooms = new Map();

// Charset e tamanho do id da sala
const CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LEN = 8;

function genId() {
	// Gera um id curto e legível usando crypto
	return Array.from(crypto.randomBytes(ID_LEN)).map(b => CHARSET[b % CHARSET.length]).join('');
}

// funções de sala -------------------------------------------------------

function createRoom({ name, pass = '', num = 1, ownerId = null } = {}) {
	if (!name) throw new Error('room name is required');

	// garantir id único
	let id;
	do {
		id = genId();
	} while (rooms.has(id));

	const room = {
		id,
		name: String(name),
		pass: pass == null ? '' : String(pass),
		num: Number(num) || 1,
		ownerId: ownerId || null,
		players: [] // lista de jogadores/ouvintes (poderá ser populada depois)
	};

	// Se for informado um ownerId, adicionar esse owner ao array de players
	// assim a sala já começa com 1 usuário (o dono). Usamos somente o id
	if (ownerId) {
		room.players.push(ownerId);
		// marcar presença inicial
		_touchPresence(id, ownerId);
	}

	rooms.set(id, room);
	// log de backend mais detalhado: inclui id e quantidade de usuários (players.length)
	console.log(`[room_system] createRoom id=${id} name="${room.name}" num=${room.num} owner=${room.ownerId} users=${room.players.length}`);
	return room;
}

function getRoom(id) {
	const r = rooms.get(id) || null;
	console.log(`[room_system] getRoom id=${id} found=${!!r}`);
	return r;
}

function deleteRoom(id) {
	const removed = rooms.delete(id);
	console.log(`[room_system] deleteRoom id=${id} removed=${removed}`);
	return removed;
}

function listRooms() {
	return Array.from(rooms.values());
}

// ----------------------
// Presença / heartbeat
// ----------------------
// Mantemos um map em memória: roomId -> Map(userId -> lastSeenTimestamp)
const presence = new Map();

// garante que há um Map para a sala; retorna o Map de userId -> lastSeenTimestamp
function _ensurePresenceMap(roomId) {
	if (!presence.has(roomId)) presence.set(roomId, new Map());
	return presence.get(roomId);
}

// marca presença (heartbeat) do userId na sala roomId
function _touchPresence(roomId, userId) {
	if (!roomId || !userId) return;
	const m = _ensurePresenceMap(roomId);
	m.set(String(userId), Date.now());
}

// retorna a contagem de usuários ativos na sala (com base em presença/heartbeat)
function getActiveUsersCount(roomId, timeoutMs = 5000) {
	const m = presence.get(roomId);
	if (!m) return 0;
	const now = Date.now();
	let count = 0;
	for (const [uid, lastSeen] of m.entries()) {
		if (now - lastSeen <= timeoutMs) count++;
	}
	return count;
}

// verifica se um usuário específico está ativo (presença recente)
function isUserActive(roomId, userId, timeoutMs = 5000) {
	if (!roomId || !userId) return false;
	const m = presence.get(roomId);
	if (!m) return false;
	const ts = m.get(String(userId));
	if (!ts) return false;
	return (Date.now() - ts) <= timeoutMs;
}

// valida se o join na sala é permitido (id e senha); retorna { ok: bool, reason?, room? }
function validateJoin(id, pass) {
	const r = rooms.get(id);
	if (!r) return { ok: false, reason: 'not_found' };

	// verificar senha primeiro
	if (r.pass && r.pass !== pass) return { ok: false, reason: 'bad_pass' };

	// verificar capacidade usando usuários ativos (heartbeat)
	try {
		const active = getActiveUsersCount(id);
		// se o número máximo for um valor válido e já estivermos no limite, recusar
		if (Number.isFinite(Number(r.num)) && Number(r.num) > 0 && active >= Number(r.num)) {
			return { ok: false, reason: 'full' };
		}
	} catch (err) {
		// em caso de erro ao calcular presença, não bloquear join por segurança
		console.error('[room_system] validateJoin failed to compute active users', err);
	}

	return { ok: true, room: r };
}

// retorna o estado resumido da sala (id, name, usersCount, maxUsers, hasPassword, ownerId)
function getRoomState(id) {
	const r = rooms.get(id);
	if (!r) return null;

	// usersCount agora é calculado a partir da presença ativa (heartbeat)
	const usersCount = getActiveUsersCount(id);

	// Retorna estado resumido da sala (para ping/status checks)
	return {
		id: r.id,
		name: r.name,
		usersCount: usersCount,
		maxUsers: r.num,
		hasPassword: Boolean(r.pass),
		ownerId: r.ownerId
	};
}

// adiciona um jogador à sala (registro histórico). Não altera presença ativa.
function addPlayer(roomId, userId) {
	if (!roomId || !userId) return false;
	const r = rooms.get(roomId);
	if (!r) return false;
	const sid = String(userId);
	if (!Array.isArray(r.players)) r.players = [];
	if (!r.players.includes(sid)) {
		r.players.push(sid);
		return true;
	}
	return false;
}

module.exports = {
	createRoom,
	getRoom,
	deleteRoom,
	listRooms,
	validateJoin,
	getRoomState,
	// exposição para uso interno do servidor
	_touchPresence,
	getActiveUsersCount,
	isUserActive,
	addPlayer
};