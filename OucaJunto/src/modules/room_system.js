const crypto = require('crypto');

// Map simples em memória para armazenar salas durante a execução.
// Chave: id da sala (string), Valor: objeto da sala.
const rooms = new Map();

// Charset e tamanho do id da sala (curto para URLs simples)
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

function validateJoin(id, pass) {
	const r = rooms.get(id);
	if (!r) return { ok: false, reason: 'not_found' };
	if (r.pass && r.pass !== pass) return { ok: false, reason: 'bad_pass' };
	return { ok: true, room: r };
}

module.exports = {
	createRoom,
	getRoom,
	deleteRoom,
	listRooms,
	validateJoin
};