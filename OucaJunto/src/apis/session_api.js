const crypto = require('crypto');

// Charset e tamanho centralizados para geração de session ids
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ID_LEN = 15;

function genId() {
  return Array.from(crypto.randomBytes(ID_LEN), b => CHARSET[b % CHARSET.length]).join('');
}

// Gera uma nova sessão (stateless) e retorna objeto com debug/log
function newSession() {
  const id = genId();
  const ts = Date.now();
  const iso = new Date(ts).toISOString();
  // Retornamos id e createdAt já formatado no padrão BR (dd/mm/yyyy HH:MM:SS)
  return { id, createdAt: formatBR(iso) };
}

// Formata ISO ou timestamp para dd/mm/yyyy HH:MM:SS (pt-BR)
function formatBR(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // pad helpers
  const z = (n) => String(n).padStart(2, '0');
  const day = z(d.getDate());
  const month = z(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = z(d.getHours());
  const mins = z(d.getMinutes());
  const secs = z(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
}

// exportando apenas o necessário para o server.js
module.exports = {
  ID_LEN,
  newSession,
  formatBR
};
