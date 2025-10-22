// Importa o Express
const express = require('express');

// Importa módulo nativo do Node para lidar com caminhos
const path = require('path');

// Cria a aplicação Express
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const os = require('os');

// Define a pasta 'static' pública de forma única e confiável
const publicDir = path.join(__dirname, 'public');

// Middleware: Serve arquivos estáticos da pasta 'public'
app.use(express.static(publicDir));

// Usa as rotas definidas (agora o módulo exporta uma função que recebe publicDir)
const routes = require('./src/routes/web_routes')(publicDir);

// diz para o servidor usar as rotas quando a raiz for acessada
app.use('/', routes);

// Inicia o servidor escutando em todas as interfaces
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
