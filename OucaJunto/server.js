// Importa o Express
const express = require('express');

// Importa módulo nativo do Node para lidar com caminhos
const path = require('path');

// Cria a aplicação Express
const app = express();
const PORT = 5000;

// Define a pasta 'static' pública de forma única e confiável
const publicDir = path.join(__dirname, 'public');

// Middleware: Serve arquivos estáticos da pasta 'public'
app.use(express.static(publicDir));

// Usa as rotas definidas (agora o módulo exporta uma função que recebe publicDir)
const routes = require('./src/routes/web_routes')(publicDir);

// diz para o servidor usar as rotas quando a raiz for acessada
app.use('/', routes);

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
