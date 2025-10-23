// importa o express
const express = require('express');

// Cria um roteador Express
const router = express.Router();

// exporta uma função que recebe publicDir do server.js
module.exports = (publicDir) => {

  // responde com o arquivo templates/central.html usando o publicDir recebido
  router.get('/', (req, res) => {
    res.sendFile('templates/central.html', { root: publicDir });
  });

  // retorna o router configurado
  return router;
};