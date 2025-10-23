// ============================
//        DEPENDÊNCIAS
// ============================
const express = require('express');
const path = require('path');
const os = require('os');
const sessionApi = require('./src/apis/session_api');
const webRoutes = require('./src/routes/web_routes');      

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
});
